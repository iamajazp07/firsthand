/**
 * X (Twitter) publisher — POST /2/tweets (X API v2).
 *
 * Auth: OAuth 2.0 user-context bearer token (X_API_BEARER_TOKEN). The real HTTP
 * call is implemented behind an env check, BUT since the operator has no tokens
 * yet: when the credential is missing we return skippedNoCredentials WITHOUT any
 * network call, so the dispatcher marks the post `skipped_no_credentials` rather
 * than `failed`. If SOCIAL_WEBHOOK_URL is set it takes precedence (that's the
 * operator's near-term path).
 */

import type { PublishablePost, SendResult } from "./types.ts";
import { tryWebhook, composeText } from "./types.ts";

export async function send(post: PublishablePost): Promise<SendResult> {
  // 1) Webhook fallback wins if configured.
  const viaWebhook = await tryWebhook(post);
  if (viaWebhook) return viaWebhook;

  // 2) Direct X API v2 — only if a token exists.
  const token = process.env.X_API_BEARER_TOKEN;
  if (!token) {
    return {
      ok: false,
      skippedNoCredentials: true,
      note: "skipped — no credentials configured (set X_API_BEARER_TOKEN or SOCIAL_WEBHOOK_URL)",
    };
  }

  try {
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      // X does not accept image URLs inline; media must be pre-uploaded and
      // referenced by media_ids. With no tokens we never reach this path, so
      // we send the text tweet (link unfurls to the OG card) as the baseline.
      body: JSON.stringify({ text: composeText(post) }),
    });
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, note: `posted to X (HTTP ${res.status})` };
    }
    const body = await res.text().catch(() => "");
    return {
      ok: false,
      note: `X API returned HTTP ${res.status}${body ? ` — ${body.slice(0, 160)}` : ""}`,
    };
  } catch (err) {
    return { ok: false, note: `X API call failed: ${(err as Error).message}` };
  }
}
