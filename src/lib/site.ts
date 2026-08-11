/**
 * Site-wide branding — derived from the vertical serving the CURRENT REQUEST.
 *
 * These used to be module-scope constants (`export const SITE_NAME = …`), which
 * only worked while one build served one vertical. A single build now serves
 * every vertical as a path (`/health`, `/money`, …), so branding is resolved
 * from an EXPLICIT vertical key that callers pass down from their route param.
 *
 * Most verticals are paths on the apex (`readfirsthand.com/money`). A vertical
 * may instead claim its own subdomain by setting `host` in its config, in which
 * case it drops the path prefix and serves from that origin — Health does this.
 * Build URLs through `verticalUrl` / `vHref` rather than interpolating the key,
 * so both shapes keep working.
 */
import { getVertical } from "@/lib/verticals";

/**
 * Absolute origin of the apex: the portal, the shared legal pages, and every
 * vertical that has not claimed a host of its own.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://readfirsthand.com"
).replace(/\/+$/, "");

/** Apex hostname (`readfirsthand.com`) and scheme, parsed once. */
export const APEX_HOST = new URL(SITE_URL).host;
const APEX_PROTOCOL = new URL(SITE_URL).protocol;

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

/** `/reviews/x` and `reviews/x` both normalise to `/reviews/x`; "" stays "". */
function normalise(path: string): string {
  return path && !path.startsWith("/") ? `/${path}` : path;
}

/**
 * Does this vertical live on its own subdomain instead of an apex path?
 *
 * A vertical opts in by setting `host` to something other than the apex — see
 * `src/lib/verticals/health.ts`. Health is split off deliberately: it is YMYL
 * content, so a manual action or quality problem there should not be able to
 * reach money/tech/education/travel. Everything else shares the apex so their
 * link equity keeps compounding on one host.
 */
export function hasOwnHost(verticalKey: string): boolean {
  const host = getVertical(verticalKey).host;
  return Boolean(host) && host !== APEX_HOST;
}

/** Absolute origin serving a vertical — its own subdomain, or the apex. */
export function verticalOrigin(verticalKey: string): string {
  return hasOwnHost(verticalKey)
    ? `${APEX_PROTOCOL}//${getVertical(verticalKey).host}`
    : SITE_URL;
}

/**
 * Absolute URL for a path inside a vertical — canonicals, og:url, sitemap,
 * RSS and JSON-LD. Host-aware:
 *   verticalUrl("money",  "/best/x") → https://readfirsthand.com/money/best/x
 *   verticalUrl("health", "/best/x") → https://health.readfirsthand.com/best/x
 * A vertical on its own host drops the path prefix — the host already says
 * which vertical it is.
 */
export function verticalUrl(verticalKey: string, path = ""): string {
  const suffix = normalise(path);
  if (verticalKey === "portal") return `${SITE_URL}${suffix}`;
  if (hasOwnHost(verticalKey)) return `${verticalOrigin(verticalKey)}${suffix}`;
  return `${SITE_URL}/${verticalKey}${suffix}`;
}

/**
 * href for a link rendered INSIDE `verticalKey`'s own pages.
 *
 * Stays root-relative so client-side navigation is preserved: a vertical on its
 * own host is already at that origin, so it needs no prefix, while a vertical
 * on the apex keeps its `/money/...` prefix.
 */
export function vHref(verticalKey: string, path = ""): string {
  const suffix = normalise(path);
  if (verticalKey === "portal") return suffix || "/";
  if (hasOwnHost(verticalKey)) return suffix || "/";
  return `/${verticalKey}${suffix}`;
}

/**
 * href pointing AT a vertical's home from the apex (the portal card grid).
 * Absolute when the vertical lives on another host, root-relative otherwise.
 */
export function verticalEntryHref(verticalKey: string): string {
  return hasOwnHost(verticalKey) ? verticalUrl(verticalKey) : `/${verticalKey}`;
}

/**
 * href for a network-shared page (`/about`, `/privacy`, …). One canonical copy
 * of each lives on the apex, so a vertical on its own host has to link out
 * absolutely rather than root-relative, which would 404 on the subdomain.
 */
export function sharedHref(currentVerticalKey: string, path: string): string {
  const suffix = normalise(path);
  return hasOwnHost(currentVerticalKey) ? `${SITE_URL}${suffix}` : suffix;
}
