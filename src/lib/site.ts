/**
 * Site-wide constants. SITE_URL is used for canonical URLs, sitemap, robots,
 * and JSON-LD. It reads NEXT_PUBLIC_SITE_URL (set this in Vercel to the live
 * production origin, e.g. https://vivahale.com) and defaults to
 * https://vivahale.com when the env var is unset. Any trailing slash is
 * stripped so callers can safely concatenate `${SITE_URL}/path`.
 */
export const SITE_NAME = "Vivahale";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://vivahale.com"
).replace(/\/+$/, "");
export const SITE_DESCRIPTION =
  "Vivahale is an independent health & wellness review site. We analyze clinical research to rank supplements, telehealth providers, and health products — clearly and without hype.";

/** Number of categories shown directly in the header nav (rest go in "More"). */
export const NAV_PRIMARY_COUNT = 6;

/**
 * Static nav copy of the category list (name + slug only) so the header —
 * a client component — never needs the server data layer. Full category
 * records (descriptions etc.) come from src/lib/db.ts.
 */
export const NAV_CATEGORIES: Array<{ name: string; slug: string }> = [
  { name: "Weight Loss", slug: "weight-loss" },
  { name: "Dental & Oral Health", slug: "dental-oral-health" },
  { name: "Sleep", slug: "sleep" },
  { name: "Women's Health", slug: "womens-health" },
  { name: "Hearing", slug: "hearing" },
  { name: "Heart Health", slug: "heart-health" },
  { name: "Nutrition & Supplements", slug: "nutrition-supplements" },
  { name: "Fitness", slug: "fitness" },
  { name: "Mental Wellness", slug: "mental-wellness" },
  { name: "Health News", slug: "health-news" },
  { name: "Health Tech & AI", slug: "health-tech-ai" },
];
