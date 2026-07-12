/**
 * Shared entity types for the Vivahale data layer.
 * These mirror the Postgres schema in supabase/migrations/0001_init.sql
 * and the local seed JSON in src/data/.
 */

export type ArticleType =
  | "hub"
  | "review"
  | "education"
  | "reddit_roundup"
  | "news";

export type ArticleStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "scheduled"
  | "published";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  bio: string;
  credentials: string;
}

export interface Reviewer {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  bio: string;
  credentials: string;
  credential_type: "RD" | "MD" | "Editorial";
  is_placeholder: boolean;
}

/** Per-criterion review scores (0–10), matching the /methodology criteria. */
export interface CriterionRatings {
  safety: number;
  evidence: number;
  cost_value: number;
  transparency: number;
  support: number;
}

export interface PricingPlan {
  plan: string;
  price: string;
  notes: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** Inline citation: a claim followed by its linked source. */
export interface EvidencePoint {
  claim: string;
  source_name: string;
  source_url: string;
}

/**
 * A reviewed product/provider (spoke page unit). Seeded from
 * src/data/products.json; Supabase table arrives in a later migration.
 * `affiliate_url` for monetized items is the literal placeholder string
 * "VIVAHALE_AFFILIATE_PLACEHOLDER" until real affiliate links are wired.
 */
export interface Product {
  id: string;
  slug: string;
  name: string;
  category_slug: string;
  is_monetized: boolean;
  affiliate_url: string | null;
  /** 0–10, one decimal — weighted per /methodology. */
  rating_overall: number;
  ratings: CriterionRatings;
  price_summary: string;
  pros: string[];
  /** Must include at least one genuine red-flag style con. */
  cons: string[];
  best_for: string;
  /** 2–3 sentence blurb used on hub pages. */
  summary: string;
  /** 130–170 word self-contained verdict for the spoke AnswerBlock. */
  verdict_summary: string;
  pricing_table: PricingPlan[];
  faq: FaqItem[];
  evidence_points: EvidencePoint[];
  /** ISO date */
  last_updated: string;
  /** Seed-fixture marker, e.g. "sample fixture" */
  _note?: string;
}

/**
 * A ranked "Best X of YYYY" hub page (hub-and-spoke money-page unit).
 * Seeded from src/data/hubs.json.
 */
export interface Hub {
  id: string;
  slug: string;
  title: string;
  category_slug: string;
  intro_mdx_or_text: string;
  /** 130–170 word self-contained answer for the hub AnswerBlock. */
  answer_block: string;
  /** Ordered ranking of product slugs (rank 1 first). */
  product_slugs: string[];
  faq: FaqItem[];
  /** ISO date */
  last_updated: string;
  /** Seed-fixture marker */
  _note?: string;
}

export interface ProductProvider {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  is_monetized: boolean;
  affiliate_url: string | null;
  pricing_json: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

export interface Article {
  id: string;
  slug: string;
  type: ArticleType;
  category_id: string;
  title: string;
  body_mdx: string;
  author_id: string;
  reviewer_id: string | null;
  status: ArticleStatus;
  scheduled_at: string | null;
  published_at: string | null;
  last_updated_at: string | null;
  compliance_json: Record<string, unknown> | null;
  sources_json: Array<Record<string, unknown>> | null;
}

export interface SocialPost {
  id: string;
  article_id: string;
  platform: string;
  caption: string;
  status: string;
  scheduled_at: string | null;
}

export interface EmailSubscriber {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
}
