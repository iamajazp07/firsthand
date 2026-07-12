/**
 * Meta publisher — Facebook Page feed + Instagram (Graph API).
 *
 * One module covers both Meta surfaces because they share the Graph API and
 * token model:
 *   - Facebook: POST /{META_PAGE_ID}/feed  (message + link), auth
 *     META_PAGE_ACCESS_TOKEN.
 *   - Instagram: two-step container publish on /{META_IG_USER_ID}/media then
 *     /media_publish. IG captions cannot contain clickable links, so the
 *     generator writes "link in bio"; an image_url is required by the API.
 *
 * As with every module: webhook fallback wins if configured; otherwise, when
 * the required token is missing we return skippedNoCredentials WITHOUT any
 * network call so the dispatcher marks the post `skipped_no_credentials`.
 */

import type { PublishablePost, SendResult } from "./types.ts";
import { tryWebhook, composeText } from "./types.ts";

export async function send(post: PublishablePost): Promise<SendResult> {
  // 1) Webhook fallback wins if configured.
  const viaWebhook = await tryWebhook(post);
  if (viaWebhook) return viaWebhook;

  if (post.platform === "instagram") return sendInstagram(post);
  return sendFacebook(post);
}

async function sendFacebook(post: PublishablePost): Promise<SendResult> {
  const pageId = process.env.META_PAGE_ID;
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) {
    return {
      ok: false,
      skippedNoCredentials: true,
      note: "skipped — no credentials configured (set META_PAGE_ID + META_PAGE_ACCESS_TOKEN or SOCIAL_WEBHOOK_URL)",
    };
  }

  try {
    const url = new URL(`https://graph.facebook.com/v21.0/${pageId}/feed`);
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: composeText(post),
        link: post.content_url,
        access_token: token,
      }),
    });
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, note: `posted to Facebook Page (HTTP ${res.status})` };
    }
    const body = await res.text().catch(() => "");
    return {
      ok: false,
      note: `Facebook Graph API returned HTTP ${res.status}${body ? ` — ${body.slice(0, 160)}` : ""}`,
    };
  } catch (err) {
    return {
      ok: false,
      note: `Facebook Graph API call failed: ${(err as Error).message}`,
    };
  }
}

async function sendInstagram(post: PublishablePost): Promise<SendResult> {
  const igUserId = process.env.META_IG_USER_ID;
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!igUserId || !token) {
    return {
      ok: false,
      skippedNoCredentials: true,
      note: "skipped — no credentials configured (set META_IG_USER_ID + META_PAGE_ACCESS_TOKEN or SOCIAL_WEBHOOK_URL)",
    };
  }

  try {
    // Step 1: create the media container (image + caption).
    const createRes = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          image_url: post.image_url,
          caption: composeText(post),
          access_token: token,
        }),
      },
    );
    if (createRes.status < 200 || createRes.status >= 300) {
      const body = await createRes.text().catch(() => "");
      return {
        ok: false,
        note: `Instagram container create returned HTTP ${createRes.status}${body ? ` — ${body.slice(0, 160)}` : ""}`,
      };
    }
    const { id: creationId } = (await createRes.json()) as { id: string };

    // Step 2: publish the container.
    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: token,
        }),
      },
    );
    if (publishRes.status >= 200 && publishRes.status < 300) {
      return { ok: true, note: `posted to Instagram (HTTP ${publishRes.status})` };
    }
    const body = await publishRes.text().catch(() => "");
    return {
      ok: false,
      note: `Instagram media_publish returned HTTP ${publishRes.status}${body ? ` — ${body.slice(0, 160)}` : ""}`,
    };
  } catch (err) {
    return {
      ok: false,
      note: `Instagram Graph API call failed: ${(err as Error).message}`,
    };
  }
}
