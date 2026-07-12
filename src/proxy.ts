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

export function proxy(request: NextRequest): NextResponse {
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

export const config = {
  // Gate every /admin route and the /api/admin surface. Static assets, the
  // rest of the site, and non-admin APIs are untouched.
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
