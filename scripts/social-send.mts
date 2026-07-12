/**
 * scripts/social-send.mts — SOCIAL dispatcher.
 *
 * Picks social posts with status `scheduled` and `scheduled_at <= now` and
 * dispatches them via the per-platform publisher modules (src/lib/publishers).
 * Rate-limit-friendly: a small delay between sends, and a per-run cap of 8.
 *
 * Behavior with NO tokens (the operator's current state):
 *   - Each publisher checks its own env vars. If SOCIAL_WEBHOOK_URL is set, the
 *     full post JSON is POSTed there and a 2xx marks the post `sent`.
 *   - Otherwise, with no platform token configured, the publisher returns
 *     skippedNoCredentials WITHOUT any network call and the post is marked
 *     `skipped_no_credentials` (NOT failed) with an honest note.
 *
 * COMPLIANCE GUARD (FTC): any post with is_monetized_link=true whose caption
 * lacks an '#ad' / 'affiliate' disclosure is REFUSED — marked `failed` with a
 * clear note, and never handed to a publisher.
 *
 * Flags:
 *   --dry-run   Print exactly what WOULD be sent per post (platform, caption,
 *               image_url, disclosure check) and make NO network calls / writes.
 *
 * Usage:
 *   npm run social:send                 # real dispatch (skips w/o creds)
 *   npm run social:send -- --dry-run    # demo: show what would be sent
 */

import {
  listSocialPosts,
  updateSocialPost,
  hasDisclosure,
  PLATFORM_LABEL,
  SOCIAL_STORAGE_MODE,
  type SocialPost,
  type SocialPlatform,
} from "../src/lib/social.ts";
import { send as sendX } from "../src/lib/publishers/x.ts";
import { send as sendMeta } from "../src/lib/publishers/meta.ts";
import { send as sendLinkedIn } from "../src/lib/publishers/linkedin.ts";
import type { SendResult } from "../src/lib/publishers/types.ts";

const PER_RUN_CAP = 8;
const DELAY_MS = 400; // small, rate-limit-friendly gap between sends

function publisherFor(
  platform: SocialPlatform,
): (post: SocialPost) => Promise<SendResult> {
  if (platform === "x") return sendX;
  if (platform === "linkedin") return sendLinkedIn;
  // facebook + instagram share the Meta module
  return sendMeta;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes("--dry-run");
  const nowIso = new Date().toISOString();

  console.log(
    `social-send — ${nowIso} — store: ${SOCIAL_STORAGE_MODE}${dryRun ? " — DRY RUN (no network, no writes)" : ""}`,
  );

  const webhook = process.env.SOCIAL_WEBHOOK_URL;
  console.log(
    webhook
      ? `  SOCIAL_WEBHOOK_URL is set — posts route through the webhook fallback.`
      : `  No SOCIAL_WEBHOOK_URL; each platform falls back to its own token check.`,
  );

  const scheduled = await listSocialPosts({ status: "scheduled" });
  const due = scheduled
    .filter((p) => p.scheduled_at != null && p.scheduled_at <= nowIso)
    .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));

  console.log(
    `  ${scheduled.length} scheduled, ${due.length} due (scheduled_at <= now). Cap ${PER_RUN_CAP}/run.`,
  );

  if (due.length === 0) {
    console.log("\nNothing due. Done.");
    return;
  }

  const batch = due.slice(0, PER_RUN_CAP);
  const held = due.length - batch.length;

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const post of batch) {
    const label = PLATFORM_LABEL[post.platform];
    const discOk = !post.is_monetized_link || hasDisclosure(post.caption);

    console.log(
      `\n  → [${label}] ${post.content_type}:${post.content_slug}`,
    );

    // --- Compliance guard (runs in BOTH dry-run and real mode) -------------
    if (!discOk) {
      const note =
        "compliance refusal: monetized link with no '#ad'/'affiliate' disclosure in caption";
      console.log(`     ⛔ REFUSED — ${note}`);
      if (!dryRun) {
        await updateSocialPost(post.id, {
          status: "failed",
          result_note: note,
          sent_at: null,
        });
      }
      failed += 1;
      continue;
    }

    if (dryRun) {
      console.log(`     WOULD SEND:`);
      console.log(`       caption   : ${JSON.stringify(post.caption)}`);
      console.log(`       image_url : ${post.image_url}`);
      console.log(`       link      : ${post.content_url}`);
      console.log(
        `       disclosure: ${post.is_monetized_link ? (hasDisclosure(post.caption) ? "present ✅ (#ad/affiliate)" : "MISSING ❌") : "n/a (non-monetized)"}`,
      );
      continue;
    }

    // --- Real dispatch -----------------------------------------------------
    const publisher = publisherFor(post.platform);
    let result: SendResult;
    try {
      result = await publisher(post);
    } catch (err) {
      result = { ok: false, note: `publisher threw: ${(err as Error).message}` };
    }

    if (result.ok) {
      await updateSocialPost(post.id, {
        status: "sent",
        result_note: result.note,
        sent_at: new Date().toISOString(),
      });
      sent += 1;
      console.log(`     ✅ sent — ${result.note}`);
    } else if (result.skippedNoCredentials) {
      await updateSocialPost(post.id, {
        status: "skipped_no_credentials",
        result_note: result.note,
        sent_at: null,
      });
      skipped += 1;
      console.log(`     ⏭️  skipped_no_credentials — ${result.note}`);
    } else {
      await updateSocialPost(post.id, {
        status: "failed",
        result_note: result.note,
        sent_at: null,
      });
      failed += 1;
      console.log(`     ❌ failed — ${result.note}`);
    }

    await sleep(DELAY_MS);
  }

  if (held > 0) {
    console.log(
      `\n  Per-run cap reached — ${held} due post(s) held as scheduled for a later run.`,
    );
  }

  if (dryRun) {
    console.log(
      `\nDry run complete. ${batch.length} post(s) inspected, no network calls made, no statuses changed.`,
    );
  } else {
    console.log(
      `\nDone. sent=${sent}, skipped_no_credentials=${skipped}, failed=${failed}.`,
    );
  }
}

main().catch((err) => {
  console.error("social-send failed:", err);
  process.exit(1);
});
