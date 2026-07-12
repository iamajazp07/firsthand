/**
 * scripts/ingest-draft.mts — the "ingest" step (no paid AI APIs).
 *
 * Accepts a single markdown file with a YAML-ish frontmatter block, validates
 * the required fields, and inserts it into the content queue as status
 * `draft` (NEVER higher — human review/approval happens in /admin). Uses the
 * same dual-mode store as the app (Supabase when configured, else
 * data/queue.local.json), via src/lib/queue.ts.
 *
 * Run it with either:
 *   npm run content:ingest -- data/drafts/my-article.md
 *   node --experimental-strip-types scripts/ingest-draft.mts data/drafts/my-article.md
 *
 * FRONTMATTER FORMAT (between the first two `---` fences):
 *   ---
 *   title: Article Title
 *   slug: article-slug
 *   type: education            # education | reddit_roundup | news
 *   category_slug: sleep
 *   author_slug: health-research-analyst     # optional (default)
 *   reviewer_slug: dr-elena-marsh            # optional (default)
 *   answer_block: |
 *     A self-contained 130-170 word answer paragraph...
 *   sources:
 *     - Source name | https://example.com/url
 *     - Second source | https://example.com/other
 *   ---
 *   ## Body markdown starts here...
 *
 * VOLUME CAP (Google scaled-content-abuse guardrail):
 *   Refuses to create a draft when >= CAP queue items were already created
 *   TODAY (UTC), site-wide across every type/status. CAP defaults to 2/day.
 *   For controlled demos you may raise it with the env var
 *   CONTENT_DAILY_CAP=<n> — the DEFAULT remains 2/day.
 */

import { promises as fs } from "fs";
import path from "path";

import {
  createQueueItem,
  countItemsCreatedOn,
  QUEUE_TYPES,
  PUBLISHED_ARTICLE_TYPES,
  type QueueItemType,
  type QueueSource,
} from "../src/lib/queue.ts";

const DEFAULT_DAILY_CAP = 2;

interface ParsedDraft {
  title: string;
  slug: string;
  type: string;
  category_slug: string;
  author_slug: string;
  reviewer_slug: string | null;
  answer_block: string;
  sources: QueueSource[];
  body_md: string;
}

/** Split "---\nfrontmatter\n---\nbody" into [frontmatter, body]. */
function splitFrontmatter(raw: string): { fm: string; body: string } {
  const text = raw.replace(/\r\n/g, "\n");
  const m = text.match(/^\s*---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) {
    throw new Error(
      "No frontmatter block found. The file must start with a `---` fenced YAML-ish header.",
    );
  }
  return { fm: m[1], body: m[2].trim() };
}

/** Minimal YAML-ish parser for the exact subset our briefs/drafts use. */
function parseFrontmatter(fm: string): Record<string, string | string[]> {
  const lines = fm.split("\n");
  const out: Record<string, string | string[]> = {};
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) {
      i += 1;
      continue;
    }
    const key = kv[1];
    const rest = kv[2];

    // Block scalar: `key: |` or `key: >`
    if (rest === "|" || rest === ">") {
      const collected: string[] = [];
      i += 1;
      while (i < lines.length) {
        const l = lines[i];
        if (l.trim() === "") {
          collected.push("");
          i += 1;
          continue;
        }
        if (/^\s+/.test(l)) {
          collected.push(l.replace(/^\s+/, ""));
          i += 1;
        } else {
          break;
        }
      }
      out[key] =
        rest === ">"
          ? collected.join(" ").replace(/\s+/g, " ").trim()
          : collected.join("\n").trim();
      continue;
    }

    // List: `key:` followed by `- ...` items (used for sources).
    if (rest === "") {
      const items: string[] = [];
      let j = i + 1;
      while (j < lines.length && /^\s*-\s+/.test(lines[j])) {
        // Strip the "- " marker, then remove a single pair of surrounding
        // matching quotes (YAML requires quoting list entries that contain
        // ':' or '[' — without this the quotes would leak into the source
        // name and, worse, a trailing '"' onto the URL, breaking the link).
        const item = lines[j]
          .replace(/^\s*-\s+/, "")
          .trim()
          .replace(/^(["'])([\s\S]*)\1$/, "$2");
        items.push(item);
        j += 1;
      }
      if (items.length > 0) {
        out[key] = items;
        i = j;
        continue;
      }
      out[key] = "";
      i += 1;
      continue;
    }

    // Simple scalar (strip surrounding quotes).
    out[key] = rest.trim().replace(/^["']|["']$/g, "");
    i += 1;
  }

  return out;
}

function parseSources(value: string | string[] | undefined): QueueSource[] {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  const sources: QueueSource[] = [];
  for (const entry of list) {
    // "Name | https://url"  (split on the LAST pipe so names may contain '|')
    const idx = entry.lastIndexOf("|");
    if (idx === -1) continue;
    const name = entry.slice(0, idx).trim();
    const url = entry.slice(idx + 1).trim();
    if (name && url) sources.push({ name, url });
  }
  return sources;
}

function str(v: string | string[] | undefined): string {
  if (v === undefined) return "";
  return Array.isArray(v) ? v.join(" ") : v;
}

async function main(): Promise<void> {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npm run content:ingest -- <path/to/draft.md>");
    process.exit(1);
  }

  const abs = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  let raw: string;
  try {
    raw = await fs.readFile(abs, "utf8");
  } catch {
    console.error(`Cannot read file: ${abs}`);
    process.exit(1);
    return;
  }

  const { fm, body } = splitFrontmatter(raw);
  const meta = parseFrontmatter(fm);

  const draft: ParsedDraft = {
    title: str(meta.title),
    slug: str(meta.slug),
    type: str(meta.type),
    category_slug: str(meta.category_slug),
    author_slug: str(meta.author_slug) || "health-research-analyst",
    reviewer_slug:
      meta.reviewer_slug !== undefined && str(meta.reviewer_slug) !== ""
        ? str(meta.reviewer_slug)
        : "dr-elena-marsh",
    answer_block: str(meta.answer_block),
    sources: parseSources(meta.sources),
    body_md: body,
  };

  // ---- Validation ------------------------------------------------------
  const errors: string[] = [];
  if (!draft.title) errors.push("missing `title`");
  if (!draft.slug) errors.push("missing `slug`");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug))
    errors.push(`invalid \`slug\` (kebab-case only): "${draft.slug}"`);
  if (!draft.type) errors.push("missing `type`");
  else if (!QUEUE_TYPES.includes(draft.type as QueueItemType))
    errors.push(`invalid \`type\`: "${draft.type}"`);
  else if (!PUBLISHED_ARTICLE_TYPES.includes(draft.type as QueueItemType))
    errors.push(
      `\`type\` "${draft.type}" is not an article type (${PUBLISHED_ARTICLE_TYPES.join(
        " | ",
      )})`,
    );
  if (!draft.category_slug) errors.push("missing `category_slug`");
  if (!draft.answer_block) errors.push("missing `answer_block`");
  if (!draft.body_md) errors.push("empty body markdown");
  if (draft.sources.length < 1)
    errors.push("at least one `sources` entry (name | url) is required");

  if (errors.length > 0) {
    console.error("Ingest rejected — validation errors:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  // ---- Volume cap (scaled-content-abuse guardrail) ---------------------
  const capEnv = process.env.CONTENT_DAILY_CAP;
  const cap =
    capEnv !== undefined && !Number.isNaN(Number.parseInt(capEnv, 10))
      ? Number.parseInt(capEnv, 10)
      : DEFAULT_DAILY_CAP;

  const today = new Date().toISOString().slice(0, 10);
  const createdToday = await countItemsCreatedOn(today);
  if (createdToday >= cap) {
    console.error(
      `Daily volume cap reached (${cap}/day) — Google scaled-content-abuse guardrail`,
    );
    console.error(
      `  ${createdToday} queue item(s) already created today (${today}). ` +
        `Draft "${draft.title}" was NOT ingested.`,
    );
    if (cap === DEFAULT_DAILY_CAP) {
      console.error(
        "  (Set CONTENT_DAILY_CAP=<n> only for controlled demos; default stays 2/day.)",
      );
    }
    process.exit(2);
  }

  // ---- Insert as DRAFT -------------------------------------------------
  const item = await createQueueItem({
    type: draft.type as QueueItemType,
    title: draft.title,
    slug: draft.slug,
    category_slug: draft.category_slug,
    body_md: draft.body_md,
    answer_block: draft.answer_block,
    sources: draft.sources,
    author_slug: draft.author_slug,
    reviewer_slug: draft.reviewer_slug,
    status: "draft",
    notes: `Ingested from ${path.relative(process.cwd(), abs)} via content:ingest.`,
  });

  console.log(`Ingested draft — "${item.title}"`);
  console.log(`  id:        ${item.id}`);
  console.log(`  type:      ${item.type}`);
  console.log(`  slug:      ${item.slug}`);
  console.log(`  category:  ${item.category_slug}`);
  console.log(`  sources:   ${item.sources.length}`);
  console.log(`  status:    ${item.status}`);
  console.log(
    `  volume:    ${createdToday + 1}/${cap} created today (${today})`,
  );
  console.log("\nReview and advance it in /admin.");
}

main().catch((err) => {
  console.error("ingest-draft failed:", err);
  process.exit(1);
});
