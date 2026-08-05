import type { Vertical } from "./types";
import { health } from "./health";
import { money } from "./money";
import { tech } from "./tech";
import { education } from "./education";
import { travel } from "./travel";
import { portal } from "./portal";

export type {
  Vertical,
  RatingCriterion,
  VerticalExtras,
  HomepageConfig,
  HomepageRanking,
  HomepagePlaceholder,
  NewsletterConfig,
} from "./types";

/**
 * Registry of known verticals. Add new content verticals (money, tech, …) here
 * as their configs are authored — the readfirsthand.com portal card grid is driven
 * off this map, so a new entry automatically gets a portal card.
 *
 * `portal` is the apex readfirsthand.com brand hub. It is a real registry entry (so
 * `getActiveVertical()` works under NEXT_PUBLIC_VERTICAL=portal) but NOT a
 * content vertical — `isContentVertical()` filters it out.
 *
 * Keep this module free of Next.js imports so it stays usable from plain Node
 * scripts and the request proxy.
 */
export const VERTICALS: Record<string, Vertical> = {
  health,
  money,
  tech,
  education,
  travel,
  portal,
};

/** The portal is a brand hub, not a content vertical. */
export function isContentVertical(v: Vertical): boolean {
  return v.key !== "portal";
}

/**
 * Does `vertical` expose an interactive tool at `path` (via `extras.tools`)?
 * Used to gate vertical-specific routes (e.g. /health/quiz/sleep is
 * health-only): the route 404s and is dropped from nav/sitemap when the
 * vertical doesn't list the tool. Health lists /quiz/sleep; money lists none.
 *
 * `path` is the vertical-relative path (no `/<vertical>` prefix).
 */
export function verticalHasTool(vertical: Vertical, path: string): boolean {
  const tools = vertical.extras?.tools ?? [];
  return tools.some((t) => t.path === path);
}

/**
 * Live content verticals in registry order (portal excluded). Drives the
 * portal's card grid — add a config entry above and its card appears here.
 */
export function contentVerticals(): Vertical[] {
  return Object.values(VERTICALS).filter(isContentVertical);
}

/** Fallback vertical when a request carries no resolvable `[vertical]` segment. */
export const DEFAULT_VERTICAL = "health";

/**
 * Look up a vertical by key. Throws for an unknown key so misconfiguration
 * fails loudly rather than silently rendering the wrong site.
 *
 * This is the PURE lookup. For "which vertical is this request for?", use
 * `getActiveVertical()` from `./active` — a single build now serves every
 * vertical as a path, so the answer is per-request, not per-build.
 */
export function getVertical(key: string): Vertical {
  const vertical = VERTICALS[key];
  if (!vertical) {
    throw new Error(
      `Unknown vertical "${key}". Known verticals: ${Object.keys(VERTICALS).join(", ")}.`,
    );
  }
  return vertical;
}

/** Is `key` a known vertical? Used to validate the `[vertical]` route segment. */
export function isVerticalKey(key: string): boolean {
  return Boolean(VERTICALS[key]);
}

/**
 * Map a request host to a vertical key.
 *   - "health.readfirsthand.com" / "health.localhost"        → "health"
 *   - "localhost" (bare dev host)                        → NEXT_PUBLIC_VERTICAL || "health"
 *   - apex "readfirsthand.com" / "www.readfirsthand.com"           → "portal" (no config yet)
 *   - anything else                                      → null
 *
 * Returns a string key only (portal has no Vertical config yet). Port suffixes
 * (":3000") and case are normalized away.
 */
export function resolveVerticalFromHost(host: string): string | null {
  if (!host) return null;

  // Strip port and lowercase; hostnames are case-insensitive.
  const hostname = host.split(":")[0].trim().toLowerCase();

  // Apex / www → the (not-yet-built) portal hub.
  if (hostname === "readfirsthand.com" || hostname === "www.readfirsthand.com") {
    return "portal";
  }

  // Bare local dev host → fall back to the configured/default vertical.
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return process.env.NEXT_PUBLIC_VERTICAL || DEFAULT_VERTICAL;
  }

  // Subdomain form: "<vertical>.readfirsthand.com" or "<vertical>.localhost".
  const sub =
    hostname.endsWith(".readfirsthand.com") || hostname.endsWith(".localhost")
      ? hostname.split(".")[0]
      : null;
  if (sub && (VERTICALS[sub] || sub === "portal")) {
    return sub;
  }

  return null;
}
