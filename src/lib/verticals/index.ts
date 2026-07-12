import type { Vertical } from "./types";
import { health } from "./health";

export type { Vertical, RatingCriterion, VerticalExtras } from "./types";

/**
 * Registry of known verticals. Add new verticals (money, tech, …) here as their
 * configs are authored. `portal` (the apex vivahale.com hub) has no config yet.
 *
 * Keep this module free of Next.js imports so it stays usable from plain Node
 * scripts and the request proxy.
 */
export const VERTICALS: Record<string, Vertical> = {
  health,
};

/** Default vertical when NEXT_PUBLIC_VERTICAL is unset or the host is unknown. */
export const DEFAULT_VERTICAL = "health";

/**
 * Resolve the active vertical from NEXT_PUBLIC_VERTICAL (default "health").
 * Throws a clear error for an unknown key so misconfiguration fails loudly.
 */
export function getActiveVertical(): Vertical {
  const key = process.env.NEXT_PUBLIC_VERTICAL || DEFAULT_VERTICAL;
  const vertical = VERTICALS[key];
  if (!vertical) {
    throw new Error(
      `Unknown vertical "${key}" (from NEXT_PUBLIC_VERTICAL). Known verticals: ${Object.keys(
        VERTICALS,
      ).join(", ")}.`,
    );
  }
  return vertical;
}

/**
 * Map a request host to a vertical key.
 *   - "health.vivahale.com" / "health.localhost"        → "health"
 *   - "localhost" (bare dev host)                        → NEXT_PUBLIC_VERTICAL || "health"
 *   - apex "vivahale.com" / "www.vivahale.com"           → "portal" (no config yet)
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
  if (hostname === "vivahale.com" || hostname === "www.vivahale.com") {
    return "portal";
  }

  // Bare local dev host → fall back to the configured/default vertical.
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return process.env.NEXT_PUBLIC_VERTICAL || DEFAULT_VERTICAL;
  }

  // Subdomain form: "<vertical>.vivahale.com" or "<vertical>.localhost".
  const sub =
    hostname.endsWith(".vivahale.com") || hostname.endsWith(".localhost")
      ? hostname.split(".")[0]
      : null;
  if (sub && (VERTICALS[sub] || sub === "portal")) {
    return sub;
  }

  return null;
}
