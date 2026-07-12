import { addSubscriber } from "@/lib/db";

/**
 * POST /api/subscribe
 *
 * Body: { email: string, source?: string, website?: string }
 *  - `email`   : validated server-side; invalid → 400.
 *  - `source`  : free-form origin tag (homepage/footer/article/quiz).
 *  - `website` : honeypot. If present/non-empty the request is treated as a
 *                bot: we return 200 { ok: true } but store nothing.
 *
 * Storage is dual-mode via the data layer (Supabase or local JSON), deduped
 * on email. The service-role key never leaves the server.
 */

// Deliberately simple, permissive-but-safe email shape check.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const data = (body ?? {}) as {
    email?: unknown;
    source?: unknown;
    website?: unknown;
  };

  // Honeypot: a real user never fills the hidden `website` field.
  // Silently accept without storing so bots get no signal.
  if (typeof data.website === "string" && data.website.trim() !== "") {
    return Response.json({ ok: true });
  }

  const email = typeof data.email === "string" ? data.email.trim() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return Response.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const source =
    typeof data.source === "string" && data.source.trim() !== ""
      ? data.source.trim().slice(0, 64)
      : null;

  try {
    await addSubscriber(email, source);
  } catch (err) {
    console.error("[subscribe] failed to store subscriber", err);
    return Response.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  // Duplicates return ok:true too — we never disclose whether an email is
  // already on the list.
  return Response.json({ ok: true });
}
