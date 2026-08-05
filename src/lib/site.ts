/**
 * Site-wide branding — derived from the vertical serving the CURRENT REQUEST.
 *
 * These used to be module-scope constants (`export const SITE_NAME = …`), which
 * only worked while one build served one vertical. A single build now serves
 * every vertical as a path (`/health`, `/money`, …), so branding is resolved
 * from an EXPLICIT vertical key that callers pass down from their route param.
 *
 * `SITE_URL` is the one genuinely build-wide value left: every vertical lives
 * on the SAME origin now (readfirsthand.com/health), so there is no per-vertical
 * host any more.
 */
import { getVertical } from "@/lib/verticals";

/**
 * Absolute origin for canonicals, sitemap, robots, RSS, and JSON-LD.
 * Single-origin now — verticals are paths, not subdomains.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://readfirsthand.com"
).replace(/\/+$/, "");

/** Brand name of the whole network (used by the portal and shared pages). */
export const NETWORK_NAME = "Firsthand";



/**
 * Same branding, resolved from an EXPLICIT vertical key rather than the
 * request store. `generateMetadata` needs this: it can run before the layout
 * populates the store, but it always receives `params.vertical`.
 */
export function brandFor(verticalKey: string) {
  const v = getVertical(verticalKey);
  return {
    name: v.name,
    tagline: v.tagline,
    description: v.description,
    key: v.key,
  };
}

/**
 * Absolute URL for a path inside a vertical: verticalUrl("health", "/reviews/x")
 * → "https://readfirsthand.com/health/reviews/x". Portal paths get no prefix.
 */
export function verticalUrl(verticalKey: string, path = ""): string {
  const suffix = path && !path.startsWith("/") ? `/${path}` : path;
  if (verticalKey === "portal") return `${SITE_URL}${suffix}`;
  return `${SITE_URL}/${verticalKey}${suffix}`;
}

/**
 * Root-relative href for a path inside a vertical — the link form used
 * throughout the UI. verticalPath("money", "/best/x") → "/money/best/x".
 */
export function verticalPath(verticalKey: string, path = ""): string {
  const suffix = path && !path.startsWith("/") ? `/${path}` : path;
  if (verticalKey === "portal") return suffix || "/";
  return `/${verticalKey}${suffix}`;
}
