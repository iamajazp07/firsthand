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

import moneyCategoriesSeed from "@/data/money/categories.json";
import moneyAuthorsSeed from "@/data/money/authors.json";
import moneyReviewersSeed from "@/data/money/reviewers.json";
import moneyArticlesSeed from "@/data/money/articles.json";
import moneyProductsSeed from "@/data/money/products.json";
import moneyHubsSeed from "@/data/money/hubs.json";

import techCategoriesSeed from "@/data/tech/categories.json";
import techAuthorsSeed from "@/data/tech/authors.json";
import techReviewersSeed from "@/data/tech/reviewers.json";
import techArticlesSeed from "@/data/tech/articles.json";
import techProductsSeed from "@/data/tech/products.json";
import techHubsSeed from "@/data/tech/hubs.json";

import educationCategoriesSeed from "@/data/education/categories.json";
import educationAuthorsSeed from "@/data/education/authors.json";
import educationReviewersSeed from "@/data/education/reviewers.json";
import educationArticlesSeed from "@/data/education/articles.json";
import educationProductsSeed from "@/data/education/products.json";
import educationHubsSeed from "@/data/education/hubs.json";

import travelCategoriesSeed from "@/data/travel/categories.json";
import travelAuthorsSeed from "@/data/travel/authors.json";
import travelReviewersSeed from "@/data/travel/reviewers.json";
import travelArticlesSeed from "@/data/travel/articles.json";
import travelProductsSeed from "@/data/travel/products.json";
import travelHubsSeed from "@/data/travel/hubs.json";

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
  // Money vertical (money.vivahale.com) — evidence-first personal-finance
  // reviews. Seeds live in src/data/money/; every number cites a primary
  // source with an as-of date.
  money: {
    categories: moneyCategoriesSeed as Category[],
    authors: moneyAuthorsSeed as Author[],
    reviewers: moneyReviewersSeed as Reviewer[],
    articles: moneyArticlesSeed as Article[],
    products: moneyProductsSeed as Product[],
    hubs: moneyHubsSeed as Hub[],
  },
  // Tech vertical (tech.vivahale.com) — evidence-first technology and software
  // reviews. Seeds live in src/data/tech/; ratings analyze published specs and
  // official documentation, NOT independent lab testing, and every figure cites
  // a primary source with an as-of date.
  tech: {
    categories: techCategoriesSeed as Category[],
    authors: techAuthorsSeed as Author[],
    reviewers: techReviewersSeed as Reviewer[],
    articles: techArticlesSeed as Article[],
    products: techProductsSeed as Product[],
    hubs: techHubsSeed as Hub[],
  },
  // Education vertical (education.vivahale.com) — evidence-first reviews of
  // learning programs and education tools. Seeds live in src/data/education/;
  // ratings analyze officially published data and provider documentation, NOT
  // independent audits of schools or student surveys, and every figure cites a
  // primary source with an as-of date. Self-reported outcomes are labeled.
  education: {
    categories: educationCategoriesSeed as Category[],
    authors: educationAuthorsSeed as Author[],
    reviewers: educationReviewersSeed as Reviewer[],
    articles: educationArticlesSeed as Article[],
    products: educationProductsSeed as Product[],
    hubs: educationHubsSeed as Hub[],
  },
  // Travel vertical (travel.vivahale.com) — evidence-first reviews of travel
  // services and gear. Seeds live in src/data/travel/; ratings analyze official
  // published documentation (DOT rules, policy wording, spec sheets, warranty
  // terms), NOT press trips, claims experience, lab tests, or traveler surveys,
  // and every figure cites a primary source with an as-of date. Quote-based
  // products (travel insurance) are compared on published plan structure, and
  // state-by-state benefit variation is disclosed.
  travel: {
    categories: travelCategoriesSeed as Category[],
    authors: travelAuthorsSeed as Author[],
    reviewers: travelReviewersSeed as Reviewer[],
    articles: travelArticlesSeed as Article[],
    products: travelProductsSeed as Product[],
    hubs: travelHubsSeed as Hub[],
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
