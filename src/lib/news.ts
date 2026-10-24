/**
 * Firsthand news store — the primary-source tracker.
 *
 * WHY A FILE AND NOT A DATABASE
 * -----------------------------
 * News items are append-only, read-mostly, and only ever queried by
 * (vertical, country, category, recency). That is a list, not a relational
 * problem. A plain JSON file per vertical needs no container, no credentials,
 * no free-tier that can be revoked, and no `node:sqlite` (which requires
 * --experimental-sqlite on the Node 22.11 the production container runs).
 *
 * The file lives OUTSIDE the build so the fetcher can update it every 15
 * minutes without a rebuild or redeploy. Point `NEWS_DATA_DIR` at a mounted
 * volume in production; it defaults to `data/news/` for local development.
 * Routes that read it use `dynamic = "force-dynamic"`, the same pattern the
 * category pages already use for runtime-published queue articles.
 *
 * Each vertical file is capped at MAX_PER_VERTICAL newest-first. The cap is
 * what stops an append-only file growing without bound; the full history of
 * what has ever been seen lives in the fetcher's own seen-store.
 *
 * This module is server-only. Do not import it from client components.
 */

import { promises as fs } from "fs";
import path from "path";

export interface NewsItem {
  /** Stable id: the feed's guid/link. Also the dedup key. */
  id: string;
  /** URL-safe slug derived from the title, suffixed for collisions. */
  slug: string;
  title: string;
  /** The PRIMARY SOURCE url. This is the point of the whole system. */
  link: string;
  /** Human-readable issuing authority, e.g. "FDA Press Announcements". */
  source_name: string;
  /** Feed id from the vertical's news-feeds.json. */
  source_id: string;
  vertical: string;
  /** "US" | "GB" | "EU" | "IN" | "AU" | "global" — the issuing authority's jurisdiction. */
  country: string;
  category_slug: string;
  /** ISO date from the feed, or the time we first saw it when the feed omits one. */
  published_at: string;
  /** The official summary as published. Displayed as a quote, never as our prose. */
  summary: string;
  first_seen_at: string;
  /**
   * Original analysis written by the news writer, when one exists. Absent on
   * most items: the tracker records every announcement, but only a few a day
   * get written up. The official summary above is always shown regardless.
   */
  analysis?: NewsAnalysis;
}

export interface NewsAnalysis {
  title: string;
  /** Self-contained 130–170 word answer. */
  answer_block: string;
  body_md: string;
  /** Which model wrote it, kept so a bad batch can be traced and pulled. */
  model: string;
  written_at: string;
}

const MAX_PER_VERTICAL = 2000;

/*
 * The store is RUNTIME data on a mounted volume, not part of the build. The
 * turbopackIgnore hints stop Next's file tracer from seeing an env-derived
 * path, concluding it might read anything, and copying the whole project into
 * the deployment output (it warned "whole project was traced unintentionally").
 */
function newsDir(): string {
  return (
    process.env.NEWS_DATA_DIR ??
    path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "news")
  );
}

function fileFor(vertical: string): string {
  return path.join(/*turbopackIgnore: true*/ newsDir(), `${vertical}.json`);
}

/**
 * In-process cache. The health file is ~1.8MB, and routes are force-dynamic,
 * so without this every page view would re-parse the whole vertical. The
 * fetcher runs every 15 minutes, so a 60s TTL is far fresher than the data and
 * costs at most one re-read per minute per vertical. mtime is checked first so
 * a fetcher write is picked up immediately rather than waiting out the TTL.
 */
const CACHE_TTL_MS = 60_000;
const cache = new Map<
  string,
  { items: NewsItem[]; loadedAt: number; mtimeMs: number }
>();

/** Newest first. Missing file is an empty list, not an error. */
export async function readNews(vertical: string): Promise<NewsItem[]> {
  const file = fileFor(vertical);
  let mtimeMs = 0;
  try {
    mtimeMs = (await fs.stat(file)).mtimeMs;
  } catch {
    return [];
  }

  const hit = cache.get(vertical);
  if (
    hit &&
    hit.mtimeMs === mtimeMs &&
    Date.now() - hit.loadedAt < CACHE_TTL_MS
  ) {
    return hit.items;
  }

  try {
    const parsed = JSON.parse(await fs.readFile(file, "utf8")) as NewsItem[];
    // Feed names like "gov.uk — HM Treasury", and some feed titles and
    // summaries, are stored as fetched; show them without the em dash.
    const items = (Array.isArray(parsed) ? parsed : []).map((i) => ({
      ...i,
      source_name: (i.source_name ?? "").replace(/\s*—\s*/g, ": "),
      title: (i.title ?? "").replace(/\s*—\s*/g, ", "),
      summary: (i.summary ?? "").replace(/\s*—\s*/g, ", "),
    }));
    cache.set(vertical, { items, loadedAt: Date.now(), mtimeMs });
    return items;
  } catch {
    return [];
  }
}

/**
 * Merge `incoming` into the vertical's file. Existing ids win, so re-running
 * the fetcher never rewrites an item we already stored (and never changes a
 * slug that may already be indexed). Returns how many were genuinely new.
 */
export async function appendNews(
  vertical: string,
  incoming: NewsItem[],
): Promise<number> {
  const existing = await readNews(vertical);
  const byId = new Map(existing.map((i) => [i.id, i]));
  const takenSlugs = new Set(existing.map((i) => i.slug));

  let added = 0;
  for (const item of incoming) {
    if (byId.has(item.id)) continue;

    // Two different announcements can share a title (e.g. "Auction of
    // Government of India Dated Security"). Suffix rather than collide,
    // because the slug is the permanent URL.
    let slug = item.slug;
    let n = 2;
    while (takenSlugs.has(slug)) slug = `${item.slug}-${n++}`;
    takenSlugs.add(slug);

    byId.set(item.id, { ...item, slug });
    added++;
  }

  const merged = [...byId.values()].sort((a, b) =>
    (b.published_at || b.first_seen_at).localeCompare(
      a.published_at || a.first_seen_at,
    ),
  );

  // The cap only applies to bare announcements. An item with written analysis
  // is a page we want indexed, so it is never pushed out.
  let bare = 0;
  const kept = merged.filter((i) => i.analysis || bare++ < MAX_PER_VERTICAL);

  await fs.mkdir(newsDir(), { recursive: true });
  await fs.writeFile(fileFor(vertical), JSON.stringify(kept, null, 2) + "\n");
  // Drop the cache we just invalidated, so a second append in the same process
  // reads what we actually wrote rather than the pre-write list.
  cache.delete(vertical);
  return added;
}

/**
 * Attach analysis to one stored item. Returns false if the item has since been
 * pushed out by the per-vertical cap, which the writer treats as "skip".
 */
export async function setAnalysis(
  vertical: string,
  id: string,
  analysis: NewsAnalysis,
): Promise<boolean> {
  const items = await readNews(vertical);
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  const next = items.slice();
  next[idx] = { ...next[idx], analysis };
  await fs.mkdir(newsDir(), { recursive: true });
  await fs.writeFile(fileFor(vertical), JSON.stringify(next, null, 2) + "\n");
  cache.delete(vertical);
  return true;
}

/** Where the fetcher's and writer's bookkeeping lives: beside the store, on the volume. */
export function newsStatePath(name: string): string {
  return path.join(/*turbopackIgnore: true*/ newsDir(), name);
}

export async function getNewsItem(
  vertical: string,
  slug: string,
): Promise<NewsItem | null> {
  const items = await readNews(vertical);
  return items.find((i) => i.slug === slug) ?? null;
}

export interface NewsQuery {
  country?: string;
  category_slug?: string;
  limit?: number;
}

export async function listNews(
  vertical: string,
  q: NewsQuery = {},
): Promise<NewsItem[]> {
  let items = await readNews(vertical);
  if (q.country) items = items.filter((i) => i.country === q.country);
  if (q.category_slug)
    items = items.filter((i) => i.category_slug === q.category_slug);
  return q.limit ? items.slice(0, q.limit) : items;
}

/** Distinct countries present in a vertical, with counts, for the filter row. */
export async function newsCountries(
  vertical: string,
): Promise<{ country: string; count: number }[]> {
  const items = await readNews(vertical);
  const m = new Map<string, number>();
  for (const i of items) m.set(i.country, (m.get(i.country) ?? 0) + 1);
  return [...m.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
}

/** Display label for a country tag. */
export const COUNTRY_LABELS: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  EU: "European Union",
  IN: "India",
  AU: "Australia",
  CA: "Canada",
  global: "International",
};

export function countryLabel(code: string): string {
  return COUNTRY_LABELS[code] ?? code;
}
