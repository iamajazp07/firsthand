import { NextResponse, type NextRequest } from "next/server";

import {
  ADMIN_COOKIE,
  sessionCookieOptions,
  sessionToken,
  verifyPassword,
  authMode,
} from "@/lib/admin-auth";

/**
 * POST /api/admin/login  (standard form post — progressive-enhancement safe).
 *
 * Verifies the submitted password against ADMIN_PASSWORD. On success sets the
 * HttpOnly HMAC session cookie and redirects to /admin; on failure bounces to
 * /admin/login?error=1. Route handlers (not server actions) so that plain
 * form posts — and curl — work identically.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const mode = authMode();
  if (mode !== "configured") {
    // Nothing to log into (dev-open is already open; prod-blocked stays out).
    return NextResponse.redirect(new URL("/admin", request.url), 303);
  }

  const form = await request.formData();
  const password = String(form.get("password") ?? "");

  if (!verifyPassword(password)) {
    return NextResponse.redirect(
      new URL("/admin/login?error=1", request.url),
      303,
    );
  }

  const res = NextResponse.redirect(new URL("/admin", request.url), 303);
  res.cookies.set(ADMIN_COOKIE, sessionToken(password), sessionCookieOptions());
  return res;
}
