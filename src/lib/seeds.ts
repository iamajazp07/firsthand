/**
 * Compile-time seed registry (local-JSON fallback mode).
 *
 * WHY A REGISTRY: the multi-vertical refactor stores each vertical's committed
 * seed JSON under `src/data/<vertical>/`. JSON imports MUST stay STATIC so the
 * bundler can inline them — a seed cannot be dynamically imported by a runtime
 * string. So every vertical's seeds are imported statically here and collected
 * into one typed `SEEDS` map keyed by vertical. `db.ts` picks the active set
 * with `getActiveVertical().key`.
 *
 * This only affects LOCAL JSON mode. Supabase mode never touches this module.
 *
 * Server-only (loaded via `@/lib/db`). Do not import from a client component.
 */

import categoriesSeed from "@/data/health/categories.json";
import authorsSeed from "@/data/health/authors.json";
import reviewersSeed from "@/data/health/reviewers.json";
import articlesSeed from "@/data/health/articles.json";
import productsSeed from "@/data/health/products.json";
import hubsSeed from "@/data/health/hubs.json";

import { getActiveVertical } from "@/lib/verticals";

import type {
  Article,
  Author,
  Category,
  Hub,
  Product,
  Reviewer,
} from "@/lib/types";

/** The committed seed set a single vertical ships in local-JSON mode. */
export interface VerticalSeeds {
  categories: Category[];
  authors: Author[];
  reviewers: Reviewer[];
  articles: Article[];
  products: Product[];
  hubs: Hub[];
}

/**
 * Registry of every vertical's static seeds. Add a vertical by importing its
 * JSON above and adding an entry here (keys must match the vertical config
 * `key`). Typed as `Record<string, VerticalSeeds>` so lookups are total and
 * type-safe — no `any`, and a missing key returns `undefined` (handled below).
 */
const SEEDS: Record<string, VerticalSeeds> = {
  health: {
    categories: categoriesSeed as Category[],
    authors: authorsSeed as Author[],
    reviewers: reviewersSeed as Reviewer[],
    articles: articlesSeed as Article[],
    products: productsSeed as Product[],
    hubs: hubsSeed as Hub[],
  },
  // The apex portal is a brand hub with no content of its own. An EMPTY seed set
  // (rather than none) means a portal-mode build's data-layer calls return []
  // instead of throwing — so /feed.xml, /sitemap.xml, and the health `/` route
  // all render harmlessly empty when NEXT_PUBLIC_VERTICAL=portal.
  portal: {
    categories: [],
    authors: [],
    reviewers: [],
    articles: [],
    products: [],
    hubs: [],
  },
};

/**
 * The seed set for the currently active vertical (from NEXT_PUBLIC_VERTICAL).
 * Throws loudly if a vertical is active but has no registered seeds, so a
 * misconfiguration fails fast rather than silently serving an empty site.
 */
export function getActiveSeeds(): VerticalSeeds {
  const key = getActiveVertical().key;
  const seeds = SEEDS[key];
  if (!seeds) {
    throw new Error(
      `No local seed set registered for vertical "${key}". ` +
        `Known seed sets: ${Object.keys(SEEDS).join(", ")}.`,
    );
  }
  return seeds;
}
