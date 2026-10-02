/**
 * Firsthand request proxy (Next 16's renamed `middleware`) — /admin auth gate.
 *
 * WHY THIS EXISTS: the /admin layout already re-checks auth, but a layout gate
 * runs too late — Next still renders the protected PAGE to produce its RSC
 * flight payload, so sensitive data (queue items, social drafts + captions)
 * leaks into the HTML response body even when the visible UI is a 403 page or
 * a redirect. A proxy runs BEFORE any route renders, so an unauthenticated
 * request never causes the page to execute and nothing sensitive is serialized.
 *
 * This proxy is the PRIMARY /admin security boundary; the layout check remains
 * as defense-in-depth and to render the dev-open banner. Auth logic mirrors
 * src/lib/admin-auth.ts exactly (same cookie name, HMAC key, and token scheme).
 *
 * Runtime: Proxy defaults to the Node.js runtime in Next 16, so Node's `crypto`
 * is available here (the `runtime` segment option is not allowed in proxy).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { VERTICALS } from "@/lib/verticals";

// Mirror of src/lib/admin-auth.ts (kept in sync by hand — both are tiny).
const ADMIN_COOKIE = "vh_admin_session";
const HMAC_KEY = "firsthand-admin-session-v1";

function adminPassword(): string | undefined {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.length > 0 ? p : undefined;
}

function sessionToken(password: string): string {
  return createHmac("sha256", HMAC_KEY).update(password).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * The /admin auth gate — UNCHANGED. This is the exact logic that previously
 * lived in `proxy()`; it is now invoked only for admin surfaces so the security
 * boundary behaves byte-for-byte as before. Do not weaken, reorder, or bypass.
 */
function adminGate(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // The login page + its POST handler must stay reachable unauthenticated.
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const pw = adminPassword();

  // No password configured.
  if (!pw) {
    // Production → block entirely (no valid session can exist). This prevents
    // the layout's 403 page from rendering the protected page's flight data.
    if (process.env.NODE_ENV === "production") {
      return new NextResponse(
        "403 Forbidden — admin console disabled (ADMIN_PASSWORD is not set).",
        { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }
    // Development → dev-open (the layout shows a banner).
    return NextResponse.next();
  }

  // Password configured → require a valid signed session cookie.
  const got = request.cookies.get(ADMIN_COOKIE)?.value ?? "";
  if (got.length > 0 && safeEqualHex(got, sessionToken(pw))) {
    return NextResponse.next();
  }

  // Unauthenticated → send to login WITHOUT rendering the protected route.
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

/**
 * Request proxy — now a single responsibility: the /admin auth gate.
 *
 * Host-based vertical resolution and the apex `/` → `/portal` rewrite are GONE.
 * Most verticals are path segments (`/money`, `/tech`, …) on the apex, so their
 * active vertical comes from the `[vertical]` route param. Health is different:
 * it serves from health.readfirsthand.com, so this proxy maps that host onto the
 * internal `/health/*` routes and 301s the retired apex paths to it.
 */

/**
 * Apex origin, mirroring src/lib/site.ts. Kept as a local constant rather than
 * an import for the same reason the admin constants above are: this module is
 * deliberately dependency-light.
 */
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://readfirsthand.com"
).replace(/\/+$/, "");
const APEX_HOST = new URL(SITE_URL).host;

/**
 * Verticals served from their own subdomain: request host → vertical key.
 * Derived from the registry (which is Next-free by design, so it is safe to
 * import here) so adding a `host` to a vertical config is the only edit needed.
 */
const HOST_VERTICALS: Record<string, string> = Object.fromEntries(
  Object.values(VERTICALS)
    .filter((v) => v.key !== "portal" && v.host && v.host !== APEX_HOST)
    .map((v) => [v.host.toLowerCase(), v.key]),
);

/**
 * Network-wide pages with exactly one canonical copy, on the apex. Requested on
 * a vertical's subdomain they would resolve to `/health/about` and 404, so send
 * the reader to the apex copy instead of duplicating them per host.
 */
const APEX_ONLY_PATHS = new Set([
  "/about",
  "/editorial-policy",
  "/affiliate-disclosure",
  "/contact",
  "/privacy",
  "/terms",
]);

/** Host header minus any port, lowercased. */
function hostnameOf(request: NextRequest): string {
  return (request.headers.get("host") ?? "").split(":")[0].trim().toLowerCase();
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  // Admin surfaces run through the unchanged auth gate. The conditions below
  // reproduce the original matcher semantics exactly ("/admin", "/admin/*",
  // "/api/admin", "/api/admin/*") so no admin path escapes the gate and no
  // non-admin path is newly gated. This block is intentionally FIRST and
  // untouched — admin routes on any host hit the same gate as before.
  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/");
  if (isAdminRoute) {
    return adminGate(request);
  }

  const hostname = hostnameOf(request);
  const hostVertical = HOST_VERTICALS[hostname];

  if (hostVertical) {
    // --- On a vertical's own subdomain -------------------------------------
    // Shared legal pages and the admin console live on the apex only.
    if (APEX_ONLY_PATHS.has(pathname)) {
      return NextResponse.redirect(new URL(`${pathname}${search}`, SITE_URL), 301);
    }

    // Already-prefixed paths are the retired shape; drop the prefix so the
    // subdomain never serves the same page at two URLs.
    if (
      pathname === `/${hostVertical}` ||
      pathname.startsWith(`/${hostVertical}/`)
    ) {
      const stripped = pathname.slice(`/${hostVertical}`.length) || "/";
      return NextResponse.redirect(
        new URL(`${stripped}${search}`, request.nextUrl.origin),
        301,
      );
    }

    // Everything else maps onto the internal [vertical] routes. The URL in the
    // address bar is untouched — this is a rewrite, not a redirect.
    const target = pathname === "/" ? `/${hostVertical}` : `/${hostVertical}${pathname}`;
    return NextResponse.rewrite(new URL(`${target}${search}`, request.nextUrl.origin));
  }

  // --- On the apex ----------------------------------------------------------
  // A vertical that has moved to its own host must not still answer here, or
  // the same page exists at two URLs. Send its old paths to the new home.
  for (const [host, key] of Object.entries(HOST_VERTICALS)) {
    if (pathname === `/${key}` || pathname.startsWith(`/${key}/`)) {
      const rest = pathname.slice(`/${key}`.length) || "/";
      return NextResponse.redirect(
        new URL(`${rest}${search}`, `https://${host}`),
        301,
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  // Runs on everything except Next internals and static assets, because host
  // routing has to see ordinary page requests — not just /admin as before.
  // Without this exclusion the rewrite would also catch /_next/* and break CSS.
  // /feed.xml is listed on its own because the extension rule above skips it,
  // and on a vertical subdomain it has to be rewritten like any page.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)", "/feed.xml"],
};
