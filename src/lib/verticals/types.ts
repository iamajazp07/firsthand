/**
 * Multi-vertical config abstraction.
 *
 * Vivahale is evolving from a single health-review site into a config-driven
 * multi-vertical publisher (health.vivahale.com, money.vivahale.com, …), all in
 * one codebase. A `Vertical` captures everything that differs between verticals:
 * branding, nav, rating methodology, and legal/compliance copy.
 *
 * This module is intentionally free of Next.js (or any runtime-specific) imports
 * so it can be required from a plain Node script, a proxy, or a server component.
 */

/** A single weighted rating criterion in a vertical's scoring methodology. */
export interface RatingCriterion {
  /** Stable key — matches the per-product `ratings` object keys. */
  key: string;
  /**
   * Short human label shown in compact rating UI (e.g. the RatingBadge score
   * breakdown chips): "Safety", "Cost & Value", "Support".
   */
  label: string;
  /**
   * Optional longer, prose label used on the /methodology criteria table where
   * a fuller name reads better (e.g. "Evidence Quality", "Customer Support &
   * Experience"). Surfaces default to `label` when this is absent, so a vertical
   * only sets it where the two differ.
   */
  longLabel?: string;
  /** Fractional weight in [0,1]; the criteria weights sum to 1. */
  weight: number;
  /**
   * Optional "what we evaluate" description for the /methodology criteria table.
   * When present, the methodology page renders it verbatim as that criterion's
   * detail cell; otherwise the cell is empty.
   */
  description?: string;
}

/**
 * Vertical-specific tools / extras (optional). Lets a vertical opt into features
 * that don't apply everywhere — e.g. the Health sleep quiz at /quiz/sleep.
 */
export interface VerticalExtras {
  /** Interactive tools this vertical exposes (path + label). */
  tools?: Array<{ key: string; label: string; path: string }>;
  /** Escape hatch for future per-vertical config without a type change. */
  [key: string]: unknown;
}

export interface Vertical {
  /** Machine key, e.g. "health". */
  key: string;
  /** Site name for this vertical (SITE_NAME). */
  name: string;
  /** Primary host, e.g. "health.vivahale.com". */
  host: string;
  /** Short tagline. */
  tagline: string;
  /** SITE_DESCRIPTION for this vertical. */
  description: string;
  /** Brand color tokens (brandNavy, brandBlue, brandMist, …). */
  theme: Record<string, string>;
  /** How many categories render directly in the header nav. */
  navPrimaryCount: number;
  /** Ordered category slugs shown in nav. */
  categories: string[];
  /**
   * Ordered nav entries (display name + slug) for the header/footer. Carries
   * the human labels alongside slugs so the client Header — which never touches
   * the server data layer — can render nav from config alone. Order and count
   * must match `categories`; the labels are the ones the design ships.
   */
  navCategories: Array<{ name: string; slug: string }>;
  /** Per-vertical rating methodology (weights sum to 1). */
  criteria: RatingCriterion[];
  /** Intro paragraph for the /methodology page. */
  methodologyIntro: string;
  /** Label for the affiliate/monetization disclosure (e.g. "Affiliate disclosure"). */
  disclosureLabel: string;
  /** Body copy for the affiliate/monetization disclosure banner. */
  disclosureBody: string;
  /** Vertical-appropriate content disclaimer (medical / financial / general). */
  contentDisclaimer: string;
  /** Optional vertical-specific tools/extras (e.g. the sleep quiz). */
  extras?: VerticalExtras;
}
