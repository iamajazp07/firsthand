/**
 * scripts/fetch-news-signals.mts — the "news-signal fetcher" (no paid AI APIs,
 * no heavy dependencies — a small hand-rolled RSS/Atom parser using native
 * fetch).
 *
 * WHAT IT DOES
 *   1. Reads the PRIMARY-SOURCE feed config in src/data/health/news-feeds.json.
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

import { appendNews, newsStatePath, type NewsItem } from "../src/lib/news.ts";

// ---------------------------------------------------------------------------
// Types & paths
// ---------------------------------------------------------------------------

interface FeedConfig {
  id: string;
  name: string;
  url: string;
  category_slug: string;
  format?: "rss" | "atom";
  /** ISO-ish country/bloc tag for the issuing authority ("US", "GB", "EU", "IN", "AU", "global"). */
  country?: string;
  /** Which vertical registry this feed was loaded from. Set by loadAllFeeds(). */
  vertical?: string;
  enabled: boolean;
  blocked_from_env?: boolean;
  note?: string;
}

interface Signal {
  key: string; // dedup key (guid || link || hash(title))
  feed_id: string;
  feed_name: string;
  category_slug: string;
  vertical: string;
  country: string;
  title: string;
  link: string;
  pubDate: string;
  summary: string;
}

interface SeenStore {
  version: number;
  seen: Record<string, { feed_id: string; title: string; seen_at: string }>;
}

const VERTICALS = ["health", "money", "tech", "education", "travel"] as const;

function feedsFileFor(vertical: string): string {
  return path.join(process.cwd(), "src", "data", vertical, "news-feeds.json");
}

/**
 * Load every vertical's feed registry into one list, tagging each feed with
 * the vertical it came from.
 *
 * This is the whole categorisation strategy: the vertical IS the field label
 * and the feed's `country` IS the country label, because we know which door
 * an item arrived through. No classifier, no model, no cost. Adding a field
 * means adding a registry; adding a country means adding a feed.
 */
async function loadAllFeeds(): Promise<FeedConfig[]> {
  const all: FeedConfig[] = [];
  for (const vertical of VERTICALS) {
    let raw: string;
    try {
      raw = await fs.readFile(feedsFileFor(vertical), "utf8");
    } catch {
      continue; // a vertical with no registry yet is not an error
    }
    const parsed = JSON.parse(raw) as FeedConfig[];
    for (const f of parsed) {
      all.push({ ...f, vertical, country: f.country ?? "US" });
    }
  }
  return all;
}
const BRIEFS_DIR = path.join(process.cwd(), "data", "briefs");
/**
 * Beside the store, so on the server it sits on the same persistent volume.
 * Inside the container it would be wiped on every deploy, and the fetcher
 * would then treat the whole backlog as new each time.
 */
const SEEN_FILE = newsStatePath("_seen.json");

/** Feeds disagree wildly on date format; normalise to ISO, empty when unparseable. */
function toIso(raw: string): string {
  const t = Date.parse(raw);
  return Number.isNaN(t) ? "" : new Date(t).toISOString();
}

const DEFAULT_MAX_NEW = 3;
const USER_AGENT =
  "Mozilla/5.0 (compatible; FirsthandNewsBot/1.0; +https://health.readfirsthand.com/editorial-policy)";

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

/**
 * Decode ALL numeric character references, decimal and hex, rather than a
 * hardcoded shortlist. The shortlist covered curly quotes and dashes but not,
 * for example, &#8377; (the rupee sign), which left raw entity text on RBI
 * items. Government feeds use the whole range, so decode the range.
 */
function decodeNumeric(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d) => {
      const code = Number.parseInt(d, 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : _;
    })
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, h) => {
      const code = Number.parseInt(h, 16);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : _;
    });
}

/** One decoding pass: numeric references, then named, then &amp; last. */
function decodePass(s: string): string {
  return decodeNumeric(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    // Typographic named entities. Government feeds use these constantly:
    // gov.uk and RBI ship &rsquo; and &ndash; in ordinary prose. Decoded
    // faithfully rather than normalised, because this text is the source's
    // own wording quoted on the page, not ours to tidy.
    .replace(/&[lr]squo;/g, "\u2019")
    .replace(/&sbquo;/g, "\u201a")
    .replace(/&ldquo;/g, "\u201c")
    .replace(/&rdquo;/g, "\u201d")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&bull;/g, "\u2022")
    .replace(/&pound;/g, "\u00a3")
    .replace(/&euro;/g, "\u20ac")
    .replace(/&deg;/g, "\u00b0")
    .replace(/&trade;/g, "\u2122")
    .replace(/&[lr]aquo;/g, '"')
    // &amp; LAST within a pass, so "&amp;lt;" becomes "&lt;" and not "<".
    .replace(/&amp;/g, "&");
}

/**
 * Decode until the string stops changing, capped at 3 passes.
 *
 * Feeds double- and occasionally triple-encode: gov.uk ships "&amp;amp;" and
 * FTC ships "&amp;nbsp;". A single pass peels one layer and leaves the rest
 * visible on the page, which is what the first version did. Looping peels all
 * of them. The cap stops a pathological input from spinning, and 3 is one more
 * than the deepest nesting seen across the 26 feeds we carry.
 */
function decodeEntities(s: string): string {
  let out = s;
  for (let i = 0; i < 3; i++) {
    const next = decodePass(out);
    if (next === out) break;
    out = next;
  }
  return out;
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
      vertical: feed.vertical ?? "health",
      country: feed.country ?? "US",
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
reviewer_slug: editorial-team
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
- Author \`health-research-analyst\`, reviewer \`editorial-team\`.

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

  const feeds = await loadAllFeeds();
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

  // ---- Persist EVERY new signal to the news store ----------------------
  // The store is the tracker, so it takes all of them. The briefs below stay
  // capped because each brief is the front of a much slower funnel: something
  // has to write original analysis for it. Two different rates, two outputs.
  const storeNow = new Date().toISOString();
  const itemsByVertical = new Map<string, NewsItem[]>();
  for (const s of freshSignals) {
    const list = itemsByVertical.get(s.vertical) ?? [];
    list.push({
      id: s.key,
      slug: slugify(s.title).slice(0, 80),
      title: s.title,
      link: s.link,
      source_name: s.feed_name,
      source_id: s.feed_id,
      vertical: s.vertical,
      country: s.country,
      category_slug: s.category_slug,
      published_at: toIso(s.pubDate) || storeNow,
      summary: s.summary,
      first_seen_at: storeNow,
    });
    itemsByVertical.set(s.vertical, list);
  }
  const stored: { vertical: string; added: number }[] = [];
  for (const [vertical, items] of itemsByVertical) {
    stored.push({ vertical, added: await appendNews(vertical, items) });
  }

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

  // ---- Coverage -------------------------------------------------------
  const tally = (pick: (f: FeedConfig) => string) => {
    const m = new Map<string, number>();
    for (const f of active) m.set(pick(f), (m.get(pick(f)) ?? 0) + 1);
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([k, n]) => `${k} ${n}`)
      .join(", ");
  };
  if (stored.length > 0) {
    console.log("\n  Stored to news tracker:");
    for (const st of stored.sort((a, b) => b.added - a.added)) {
      console.log(`    ${st.vertical.padEnd(12)} +${st.added}`);
    }
  }

  console.log("\n  Coverage:");
  console.log(`    by field:    ${tally((f) => f.vertical ?? "?")}`);
  console.log(`    by country:  ${tally((f) => f.country ?? "?")}`);

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
