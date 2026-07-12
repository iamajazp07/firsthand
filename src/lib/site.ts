/**
 * Site-wide branding constants — now DERIVED from the active vertical config
 * (`@/lib/verticals`) instead of hard-coded. The exported NAMES and SHAPES are
 * unchanged so every existing importer (layout, sitemap, robots, feed.xml,
 * api/og, Header, Footer, Breadcrumbs, page metadata) keeps working untouched.
 *
 * For the Health vertical the branding values below come from its config.
 *
 * SITE_URL (Phase B) is now VERTICAL-AWARE: `NEXT_PUBLIC_SITE_URL` if set,
 * otherwise `https://${activeVertical.host}` (health → https://health.vivahale.com,
 * portal → https://vivahale.com). The exported name/shape and trailing-slash
 * stripping are unchanged, so callers can still concatenate `${SITE_URL}/path`.
 */
import { getActiveVertical } from "@/lib/verticals";

const vertical = getActiveVertical();

export const SITE_NAME = vertical.name;
/** Short tagline for the active vertical (used in title defaults). */
export const SITE_TAGLINE = vertical.tagline;
/** True in a portal-mode build (apex vivahale.com brand hub). */
export const IS_PORTAL = vertical.key === "portal";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || `https://${vertical.host}`
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
