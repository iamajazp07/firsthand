/**
 * Vivahale request proxy (Next 16's renamed `middleware`) — /admin auth gate.
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
import { resolveVerticalFromHost } from "@/lib/verticals";

// Mirror of src/lib/admin-auth.ts (kept in sync by hand — both are tiny).
const ADMIN_COOKIE = "vh_admin_session";
const HMAC_KEY = "vivahale-admin-session-v1";

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
 * Request proxy. Two responsibilities, kept strictly separate:
 *
 *  1. /admin auth gate — for admin surfaces ONLY, delegate to `adminGate()`
 *     (identical behavior to the previous implementation). This preserves the
 *     RSC flight-leak defense exactly.
 *  2. Vertical resolution + portal routing — for every other route, resolve the
 *     active vertical from the request host and expose it to downstream server
 *     components via the `x-vivahale-vertical` request header. When the host is
 *     the apex (vivahale.com → "portal"), the site root `/` is REWRITTEN to the
 *     `/portal` brand hub. Vertical subdomain hosts (health.vivahale.com) are
 *     never rewritten and behave exactly as before.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

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

  // Non-admin routes: resolve vertical, fall back to NEXT_PUBLIC_VERTICAL
  // (default "health") for unrecognized hosts, and forward it as a header.
  const host = request.headers.get("host") ?? "";
  const vertical =
    resolveVerticalFromHost(host) ||
    process.env.NEXT_PUBLIC_VERTICAL ||
    "health";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-vivahale-vertical", vertical);

  // Portal routing: on the apex host (or a portal-mode build), serve the brand
  // hub at the site root by rewriting `/` → `/portal`. Only the root is
  // rewritten; all other paths pass through untouched, and non-portal hosts are
  // completely unaffected.
  if (vertical === "portal" && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Run on all routes EXCEPT Next internals and static assets, so the vertical
  // header reaches every rendered page while the /admin gate (applied inside
  // `proxy`) still covers every /admin + /api/admin path.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
