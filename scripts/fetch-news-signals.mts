/**
 * scripts/fetch-news-signals.mts — the "news-signal fetcher" (no paid AI APIs,
 * no heavy dependencies — a small hand-rolled RSS/Atom parser using native
 * fetch).
 *
 * WHAT IT DOES
 *   1. Reads the PRIMARY-SOURCE feed config in src/data/news-feeds.json.
 *   2. Fetches every ENABLED, non-`blocked_from_env` feed (native fetch, with a
 *      browser-like User-Agent). Failures are logged and skipped gracefully —
 *      one dead feed never aborts the run.
 *   3. Parses the latest items (title, link, pubDate, summary) from both RSS
 *      (`<item>`) and Atom (`<entry>`) feeds.
 *   4. Dedupes every item against previously-seen GUIDs/links persisted in the
 *      gitignored data/news-seen.local.json, so a signal is only ever surfaced
 *      ONCE.
 *   5. Writes up to N (default 3, override with a CLI arg) NEW candidate signals
 *      into the gitignored data/briefs/ directory as `news-*.md` brief files.
 *      Each brief embeds the primary source, the REQUIRED original-analysis
 *      angle, the required GEO structure, and the compliance rules.
 *   6. Marks EVERY item seen this run (not just the N written) so an immediate
 *      re-run reports 0 new signals — the dedup proof.
 *   7. Prints a summary table: feeds fetched, items found, new signals written,
 *      duplicates skipped.
 *
 * Run it with either:
 *   npm run news:fetch          # up to 3 new signals
 *   npm run news:fetch -- 5     # up to 5 new signals
 *   node --experimental-strip-types scripts/fetch-news-signals.mts 5
 *
 * This script does NOT touch the content queue. News briefs are pre-draft
 * scaffolding: the operator drafts the ORIGINAL ANALYSIS in Claude Code and then
 * runs `npm run content:ingest -- <file.md>` (draft-only, capped 2/day).
 *
 * SEPARATION RULE: news fuels the freshness / social / email layer. It never
 * auto-touches the money pages (reviews / hub_update) — those stay separate.
 */

import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";

// ---------------------------------------------------------------------------
// Types & paths
// ---------------------------------------------------------------------------

interface FeedConfig {
  id: string;
  name: string;
  url: string;
  category_slug: string;
  format?: "rss" | "atom";
  enabled: boolean;
  blocked_from_env?: boolean;
  note?: string;
}

interface Signal {
  key: string; // dedup key (guid || link || hash(title))
  feed_id: string;
  feed_name: string;
  category_slug: string;
  title: string;
  link: string;
  pubDate: string;
  summary: string;
}

interface SeenStore {
  version: number;
  seen: Record<string, { feed_id: string; title: string; seen_at: string }>;
}

const FEEDS_FILE = path.join(process.cwd(), "src", "data", "news-feeds.json");
const BRIEFS_DIR = path.join(process.cwd(), "data", "briefs");
const SEEN_FILE = path.join(process.cwd(), "data", "news-seen.local.json");

const DEFAULT_MAX_NEW = 3;
const USER_AGENT =
  "Mozilla/5.0 (compatible; VivahaleNewsBot/1.0; +https://vivahale.com/editorial-policy)";

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 70);
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#8217;/g, "’")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** Strip tags, collapse whitespace, decode entities. */
function clean(raw: string | undefined): string {
  if (!raw) return "";
  return decodeEntities(raw)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Pull the first <tag>…</tag> inner text from a block. */
function tag(block: string, name: string): string | undefined {
  const m = block.match(
    new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"),
  );
  return m ? m[1] : undefined;
}

/** Atom <link href="…"/> (prefer rel="alternate"), else first href. */
function atomLink(block: string): string {
  const alt = block.match(
    /<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i,
  );
  if (alt) return alt[1];
  const any = block.match(/<link[^>]*href=["']([^"']+)["']/i);
  return any ? any[1] : "";
}

// ---------------------------------------------------------------------------
// Feed parsing (RSS <item> + Atom <entry>)
// ---------------------------------------------------------------------------

function parseFeed(xml: string, feed: FeedConfig): Signal[] {
  const isAtom =
    feed.format === "atom" ||
    (/<entry[\s>]/i.test(xml) && !/<item[\s>]/i.test(xml));

  const blocks = isAtom
    ? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? []
    : xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  const out: Signal[] = [];
  for (const b of blocks) {
    const title = clean(tag(b, "title"));
    if (!title) continue;

    const link = isAtom
      ? atomLink(b)
      : clean(tag(b, "link")) || clean(tag(b, "guid"));

    const pubDate = clean(
      tag(b, "pubDate") ??
        tag(b, "published") ??
        tag(b, "updated") ??
        tag(b, "dc:date"),
    );

    const summary = clean(
      tag(b, "description") ?? tag(b, "summary") ?? tag(b, "content"),
    ).slice(0, 600);

    const guid = clean(tag(b, "guid")) || clean(tag(b, "id")) || link;
    const key = guid || `hash:${createHash("sha1").update(title).digest("hex")}`;

    out.push({
      key,
      feed_id: feed.id,
      feed_name: feed.name,
      category_slug: feed.category_slug,
      title,
      link,
      pubDate,
      summary,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Seen store
// ---------------------------------------------------------------------------

async function readSeen(): Promise<SeenStore> {
  try {
    const raw = await fs.readFile(SEEN_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<SeenStore>;
    return { version: parsed.version ?? 1, seen: parsed.seen ?? {} };
  } catch {
    return { version: 1, seen: {} };
  }
}

async function writeSeen(store: SeenStore): Promise<void> {
  await fs.mkdir(path.dirname(SEEN_FILE), { recursive: true });
  await fs.writeFile(SEEN_FILE, JSON.stringify(store, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// Brief markdown for a news signal
// ---------------------------------------------------------------------------

function briefMarkdown(sig: Signal): string {
  const slug = `news-${slugify(sig.title)}`;
  const dateLine = sig.pubDate || "(no date supplied by feed)";

  return `---
title: ${sig.title}
slug: ${slug}
type: news
category_slug: ${sig.category_slug}
target_query: ${slugify(sig.title).replace(/-/g, " ")}
author_slug: health-research-analyst
reviewer_slug: dr-elena-marsh
---

# News-analysis Brief — ${sig.title}

## Trigger primary source (link this PROMINENTLY near the top of the article)

- **Source feed:** ${sig.feed_name}
- **Primary source title:** ${sig.title}
- **Primary source URL:** ${sig.link}
- **Published:** ${dateLine}
- **Feed summary (context only — NOT the article):** ${sig.summary || "(none)"}

## Your job: ORIGINAL ANALYSIS, not a rewrite

> The source is the STARTING POINT; the analysis is the PRODUCT.

Write **data-analyst commentary**, not a summary of the announcement:

- **What this actually means for readers** — translate the announcement into a
  practical "so what" for someone in our audience.
- **Context from prior research** — connect it to what the peer-reviewed
  evidence already showed (effect sizes, prevalence numbers, comparable
  products/studies). Cite specific primary sources.
- **Hype vs. reality** — separate what the source demonstrates from what
  marketing or headlines will claim it demonstrates.
- **Honest limitations** — what the source does NOT show, evidence-quality
  caveats, conflicts of interest, and who it is not for.

Do **NOT** rewrite or paraphrase the source as the article. If your draft could
be produced by lightly reordering the press release, start over.

## Required structure (GEO / AI-citation optimized)

1. **Answer block** — a self-contained **130–170 word** paragraph that answers
   the reader's real question, includes **at least one concrete statistic**, and
   avoids hype. Becomes the \`answer_block\` frontmatter field on ingest.
2. **Primary source up top** — link the trigger source **prominently in the
   first section** of the body (the /articles route also renders a
   \`PrimarySourceNote\` box automatically for \`type: news\`).
3. **H2 sections** — what the source shows, what the wider evidence says, the
   practical takeaway, hype vs. reality.
4. **FAQ** — a \`## Frequently asked questions\` section using real search
   phrasings as \`###\` sub-headings, each answered in 2–4 sentences.
5. **Honest limitations** — at least one \`##\` section on what the evidence does
   not establish, quality caveats, and conflicts of interest.
6. **Sources** — **≥3 verifiable primary sources, INCLUDING the trigger source**
   (\`name | url\` lines). Curl-check each for HTTP 200 before ingest; if a host
   blocks curl, verify via a browser/WebFetch and note it honestly.

## Compliance rules (enforced at approval)

- **No disease-cure claims.** Never write "treats", "cures", "prevents
  disease", "melts fat", or "miracle". Use modest, hedged language:
  "may support", "is associated with", "cleared for", "small trials suggest".
- **No fabricated statistics or testimonials.** Every number traces to a source.
- Flag manufacturer funding / conflicts of interest where they exist.
- Author \`health-research-analyst\`, reviewer \`dr-elena-marsh\`.

## Ingest command (after drafting)

\`\`\`
npm run content:ingest -- data/drafts/${slug}.md
\`\`\`

Write the finished ORIGINAL analysis as a markdown file with the frontmatter
above (title, slug, type: news, category_slug, answer_block, and \`sources\` as
\`name | url\` lines). It enters the queue as **draft**; review and approve in
/admin. News fuels the freshness / social / email layer — money pages stay
separate.
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const arg = process.argv[2];
  const maxNew =
    arg !== undefined && !Number.isNaN(Number.parseInt(arg, 10))
      ? Number.parseInt(arg, 10)
      : DEFAULT_MAX_NEW;
  if (maxNew < 0) {
    console.error(`Invalid max-new argument: ${arg}`);
    process.exit(1);
  }

  const feeds = JSON.parse(await fs.readFile(FEEDS_FILE, "utf8")) as FeedConfig[];
  const active = feeds.filter((f) => f.enabled && !f.blocked_from_env);
  const skippedConfig = feeds.filter((f) => !f.enabled || f.blocked_from_env);

  console.log(`fetch-news-signals — ${new Date().toISOString()}`);
  console.log(
    `  ${active.length} enabled feed(s); ${skippedConfig.length} disabled/blocked (skipped by config).\n`,
  );

  const seenStore = await readSeen();
  const seenBefore = new Set(Object.keys(seenStore.seen));

  const perFeed: {
    name: string;
    status: string;
    items: number;
    fresh: number;
  }[] = [];

  const freshSignals: Signal[] = [];
  const freshKeys = new Set<string>();
  let totalItems = 0;

  for (const feed of active) {
    let items: Signal[] = [];
    let status = "ok";
    try {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/xml, text/xml, */*" },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        status = `HTTP ${res.status}`;
      } else {
        const xml = await res.text();
        items = parseFeed(xml, feed);
        if (items.length === 0) status = "0 items parsed";
      }
    } catch (err) {
      status = `error: ${(err as Error).message.slice(0, 40)}`;
    }

    totalItems += items.length;
    let feedFresh = 0;
    for (const s of items) {
      if (seenBefore.has(s.key) || freshKeys.has(s.key)) continue;
      freshKeys.add(s.key);
      freshSignals.push(s);
      feedFresh += 1;
    }
    perFeed.push({
      name: feed.name,
      status,
      items: items.length,
      fresh: feedFresh,
    });
  }

  // Freshest-first: sort by parsed date desc (unparseable dates sink to bottom).
  freshSignals.sort((a, b) => {
    const da = Date.parse(a.pubDate);
    const db = Date.parse(b.pubDate);
    const va = Number.isNaN(da) ? -Infinity : da;
    const vb = Number.isNaN(db) ? -Infinity : db;
    return vb - va;
  });

  const toWrite = freshSignals.slice(0, maxNew);

  await fs.mkdir(BRIEFS_DIR, { recursive: true });
  const written: string[] = [];
  for (const sig of toWrite) {
    const file = path.join(BRIEFS_DIR, `news-${slugify(sig.title)}.md`);
    await fs.writeFile(file, briefMarkdown(sig));
    written.push(path.relative(process.cwd(), file));
  }

  // Mark EVERY item encountered this run as seen (not just the written ones) so
  // an immediate re-run reports 0 new — the dedup proof.
  const nowIso = new Date().toISOString();
  for (const s of freshSignals) {
    seenStore.seen[s.key] = {
      feed_id: s.feed_id,
      title: s.title.slice(0, 160),
      seen_at: nowIso,
    };
  }
  await writeSeen(seenStore);

  // ---- Summary --------------------------------------------------------
  const duplicates = totalItems - freshSignals.length;
  console.log("  Per-feed results:");
  console.log(
    "    " +
      "FEED".padEnd(34) +
      "STATUS".padEnd(16) +
      "ITEMS".padStart(6) +
      "NEW".padStart(6),
  );
  for (const r of perFeed) {
    console.log(
      "    " +
        r.name.slice(0, 33).padEnd(34) +
        r.status.slice(0, 15).padEnd(16) +
        String(r.items).padStart(6) +
        String(r.fresh).padStart(6),
    );
  }

  console.log("\n  Summary:");
  console.log(`    feeds fetched:        ${active.length}`);
  console.log(`    items found:          ${totalItems}`);
  console.log(`    new signals found:    ${freshSignals.length}`);
  console.log(
    `    briefs written:       ${written.length}` +
      (freshSignals.length > written.length
        ? ` (capped at ${maxNew}; ${freshSignals.length - written.length} extra new item(s) recorded as seen without a brief)`
        : ""),
  );
  console.log(`    duplicates skipped:   ${duplicates}`);

  if (written.length > 0) {
    console.log("\n  New signal briefs:");
    for (const w of written) console.log(`   + ${w}`);
    console.log(
      "\n  Next: draft ORIGINAL analysis in Claude Code, then " +
        "`npm run content:ingest -- data/drafts/<file>.md`.",
    );
  } else {
    console.log("\n  No new signals — nothing to draft (dedup working).");
  }
}

main().catch((err) => {
  console.error("fetch-news-signals failed:", err);
  process.exit(1);
});
