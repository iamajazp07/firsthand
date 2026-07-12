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

/** A homepage "Top Rankings" / "Latest" card link. */
export interface HomepageRanking {
  title: string;
  category: string;
  blurb: string;
  href: string;
}

/** A homepage "Latest Analysis" placeholder card (rendered when seed content
 *  is thin). Empty array = render none. */
export interface HomepagePlaceholder {
  title: string;
  category: string;
  excerpt: string;
  byline: string;
}

/**
 * Homepage content that differs per vertical. The hero + "Latest Analysis"
 * article grid are data-driven (from the seed articles) and shared, but the
 * static rankings, trust bullets, placeholders, and the "browse all" link are
 * vertical-specific and live here so a health-only string never leaks onto a
 * money page (which would also be a broken link).
 */
export interface HomepageConfig {
  heroFallbackTitle: string;
  heroFallbackBody: string;
  trustHeading: string;
  trustPoints: string[];
  rankingsLabel: string;
  rankings: HomepageRanking[];
  latestPlaceholders: HomepagePlaceholder[];
  browseAllHref: string;
  browseAllLabel: string;
}

/** Newsletter branding copy (band + article CTA), per vertical. */
export interface NewsletterConfig {
  brandName: string;
  bandBlurb: string;
  ctaHeading: string;
  ctaBlurb: string;
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
   * Category slugs whose /category/[slug] page renders the timely "news-list"
   * layout (headline + date + one-line excerpt) instead of the default
   * card grid. Health: ["health-news", "health-tech-ai"]; Money: ["money-news"].
   * Optional — defaults to no news categories when unset.
   */
  newsCategorySlugs?: string[];
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
  /**
   * Bold label + aria-label for the content-disclaimer banner. Health:
   * "Medical disclaimer"; Money: "Financial disclaimer". Defaults to
   * "Disclaimer" when unset (portal).
   */
  contentDisclaimerLabel?: string;
  /** Optional vertical-specific tools/extras (e.g. the sleep quiz). */
  extras?: VerticalExtras;

  /**
   * Slug of the default author used on hub/review bylines (the site's single
   * research-analyst byline). Kept in config so hub/review pages don't hardcode
   * a health-specific slug. Content verticals set this; portal omits it.
   */
  defaultAuthorSlug?: string;
  /** Slug of the default editorial fact-check reviewer (e.g. "editorial-team"). */
  defaultReviewerSlug?: string;
  /**
   * Short footer copyright disclaimer clause (rendered after "© 2026 Vivahale.").
   * Health: "…is not medical advice."; Money: "…is not financial … advice."
   */
  footerDisclaimer?: string;
  /** Meta description for the /methodology page (vertical-specific). */
  methodologyMetaDescription?: string;
  /** Newsletter branding copy (band + article CTA). */
  newsletter?: NewsletterConfig;
  /** Homepage static content (rankings, trust bullets, placeholders, links). */
  homepage?: HomepageConfig;
}
