/**
 * LinkedIn publisher — Share on LinkedIn (UGC Posts / Share API).
 *
 * Auth: LINKEDIN_ACCESS_TOKEN (OAuth 2.0), posting as the organization named by
 * LINKEDIN_ORG_URN (e.g. "urn:li:organization:12345678"). The real call posts
 * an article share to /v2/ugcPosts.
 *
 * As with every module: webhook fallback wins if configured; otherwise, when a
 * required credential is missing we return skippedNoCredentials WITHOUT any
 * network call so the dispatcher marks the post `skipped_no_credentials`.
 */

import type { PublishablePost, SendResult } from "./types.ts";
import { tryWebhook, composeText } from "./types.ts";

export async function send(post: PublishablePost): Promise<SendResult> {
  // 1) Webhook fallback wins if configured.
  const viaWebhook = await tryWebhook(post);
  if (viaWebhook) return viaWebhook;

  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const orgUrn = process.env.LINKEDIN_ORG_URN;
  if (!token || !orgUrn) {
    return {
      ok: false,
      skippedNoCredentials: true,
      note: "skipped — no credentials configured (set LINKEDIN_ACCESS_TOKEN + LINKEDIN_ORG_URN or SOCIAL_WEBHOOK_URL)",
    };
  }

  try {
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: orgUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: composeText(post) },
            shareMediaCategory: "ARTICLE",
            media: [
              {
                status: "READY",
                originalUrl: post.content_url,
                thumbnails: [{ url: post.image_url }],
              },
            ],
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, note: `posted to LinkedIn (HTTP ${res.status})` };
    }
    const body = await res.text().catch(() => "");
    return {
      ok: false,
      note: `LinkedIn API returned HTTP ${res.status}${body ? ` — ${body.slice(0, 160)}` : ""}`,
    };
  } catch (err) {
    return {
      ok: false,
      note: `LinkedIn API call failed: ${(err as Error).message}`,
    };
  }
}
