/**
 * Shared publisher contract (step 9).
 *
 * Each platform module in this folder exposes `send(post): Promise<SendResult>`.
 * The shape below is a STRUCTURAL subset of src/lib/social.ts's SocialPost — we
 * deliberately do NOT import SocialPost here so these modules stay decoupled and
 * fully Node-script-safe (scripts/social-send.mts imports them with an explicit
 * `.ts` extension under the type-stripping loader). `import type` from this file
 * is erased at runtime, so no extensionless resolution ever happens at runtime.
 */

export interface PublishablePost {
  id: string;
  platform: string;
  content_type: string;
  content_slug: string;
  content_url: string;
  caption: string;
  hashtags: string[];
  image_url: string;
  is_monetized_link: boolean;
}

export interface SendResult {
  /** True only when the post was actually delivered (real API or webhook 2xx). */
  ok: boolean;
  /** Honest, human-readable outcome note (stored on the post's result_note). */
  note: string;
  /**
   * Distinguishes "no credentials configured" (→ skipped_no_credentials) from a
   * genuine delivery failure (→ failed). Absent/false means: on !ok, mark failed.
   */
  skippedNoCredentials?: boolean;
}

/**
 * Shared webhook fallback: if SOCIAL_WEBHOOK_URL is set, POST the full post JSON
 * to it (Buffer / Zapier / Make style) and treat any 2xx as a successful send.
 * Every platform module calls this FIRST, before its direct-API path, because
 * the webhook is the operator's near-term route while no real tokens exist.
 *
 * Returns null when no webhook is configured (caller falls through to its own
 * credential check). In --dry-run mode the caller must not reach here.
 */
export async function tryWebhook(
  post: PublishablePost,
): Promise<SendResult | null> {
  const url = process.env.SOCIAL_WEBHOOK_URL;
  if (!url) return null;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "vivahale", post }),
    });
    if (res.status >= 200 && res.status < 300) {
      return {
        ok: true,
        note: `sent via SOCIAL_WEBHOOK_URL (HTTP ${res.status})`,
      };
    }
    return {
      ok: false,
      note: `webhook returned HTTP ${res.status} — not delivered`,
    };
  } catch (err) {
    return {
      ok: false,
      note: `webhook POST failed: ${(err as Error).message}`,
    };
  }
}

/** Compose the outward-facing post text (caption already includes hashtags for
 *  platforms where we inline them; this is the canonical single-string body). */
export function composeText(post: PublishablePost): string {
  return post.caption;
}
