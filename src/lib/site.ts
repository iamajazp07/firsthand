/**
 * Site-wide branding constants — now DERIVED from the active vertical config
 * (`@/lib/verticals`) instead of hard-coded. The exported NAMES and SHAPES are
 * unchanged so every existing importer (layout, sitemap, robots, feed.xml,
 * api/og, Header, Footer, Breadcrumbs, page metadata) keeps working untouched.
 *
 * For the Health vertical every value below is identical to the previous
 * literals (the health config was authored to carry the exact live values).
 *
 * PARITY EXCEPTION — SITE_URL: this stays env-driven with the SAME fallback as
 * before (`NEXT_PUBLIC_SITE_URL` || `https://vivahale.com`, trailing slash
 * stripped). It is deliberately NOT tied to the vertical `host`; the health
 * subdomain rebrand is a later phase. Callers can safely concatenate
 * `${SITE_URL}/path`.
 */
import { getActiveVertical } from "@/lib/verticals";

const vertical = getActiveVertical();

export const SITE_NAME = vertical.name;
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://vivahale.com"
).replace(/\/+$/, "");
export const SITE_DESCRIPTION = vertical.description;

/** Number of categories shown directly in the header nav (rest go in "More"). */
export const NAV_PRIMARY_COUNT = vertical.navPrimaryCount;

/**
 * Static nav copy of the category list (name + slug only) so the header —
 * a client component — never needs the server data layer. Full category
 * records (descriptions etc.) come from src/lib/db.ts. Sourced from the active
 * vertical's `navCategories` (same order, count, and labels as before).
 */
export const NAV_CATEGORIES: Array<{ name: string; slug: string }> =
  vertical.navCategories;
