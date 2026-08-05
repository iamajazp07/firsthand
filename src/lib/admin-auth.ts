/**
 * Admin auth for /admin — env-password + signed HttpOnly cookie.
 *
 * No external auth library. The session cookie value is an HMAC-SHA256 of the
 * configured ADMIN_PASSWORD (keyed by a fixed app string), so a stolen cookie
 * cannot be reversed into the password and a cookie minted for a different
 * password fails verification. Comparison is timing-safe.
 *
 * Modes (see `authMode()`):
 *   - "configured"   : ADMIN_PASSWORD is set → normal login required.
 *   - "dev-open"     : ADMIN_PASSWORD unset AND not production → open, banner.
 *   - "prod-blocked" : ADMIN_PASSWORD unset AND production → 403, no access.
 *
 * Server-only (reads env + next/headers cookies). Never import client-side.
 */

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "vh_admin_session";
const HMAC_KEY = "firsthand-admin-session-v1";

export type AuthMode = "configured" | "dev-open" | "prod-blocked";

function adminPassword(): string | undefined {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.length > 0 ? p : undefined;
}

export function authMode(): AuthMode {
  if (adminPassword()) return "configured";
  return process.env.NODE_ENV === "production" ? "prod-blocked" : "dev-open";
}

/** Deterministic session token for a given password. */
export function sessionToken(password: string): string {
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

/** True when the submitted password matches ADMIN_PASSWORD. */
export function verifyPassword(submitted: string): boolean {
  const pw = adminPassword();
  if (!pw) return false;
  return safeEqualHex(sessionToken(submitted), sessionToken(pw));
}

/**
 * Whether the current request is allowed into /admin.
 *   - dev-open   → always true (open dev access)
 *   - prod-blocked → always false
 *   - configured → true only when the cookie matches the expected token
 */
export async function isAuthed(): Promise<boolean> {
  const mode = authMode();
  if (mode === "dev-open") return true;
  if (mode === "prod-blocked") return false;

  const pw = adminPassword()!;
  const expected = sessionToken(pw);
  const jar = await cookies();
  const got = jar.get(ADMIN_COOKIE)?.value ?? "";
  return got.length > 0 && safeEqualHex(got, expected);
}

/** Cookie options for the session cookie (secure in production). */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  };
}
