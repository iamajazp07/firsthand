/**
 * scripts/social-autopilot.mts — hands-off DAILY promoter (the missing step
 * between `social:generate` and `social:send`).
 *
 * The normal pipeline is: generate → a human approves + schedules in
 * /admin/social → send. This script automates that middle step so a cron can
 * post without a human in the loop:
 *
 *   draft  ──approve──▶  approved  ──schedule(now)──▶  scheduled
 *
 * It promotes the posts for ONE piece of content per run (all its platform
 * drafts together), choosing the content whose oldest draft was created first
 * (FIFO) so a backlog drains one topic per day — matching "one post per day".
 * scripts/social-send.mts then dispatches the now-due `scheduled` posts.
 *
 * SAFETY / COMPLIANCE:
 *   - Promotion goes through transitionSocialStatus(), so the FTC disclosure
 *     gate is enforced: a monetized caption missing '#ad'/'affiliate' is
 *     REFUSED and left as a draft (never silently scheduled).
 *   - This script NEVER sends. It only schedules. Sending is social-send.mts,
 *     which with no platform tokens marks posts `skipped_no_credentials`.
 *
 * Flags / env:
 *   --dry-run                 Show the plan; write nothing.
 *   SOCIAL_TOPICS_PER_RUN=1   How many content units (slugs) to promote per run.
 *
 * Usage:
 *   npm run social:autopilot                 # promote today's topic
 *   npm run social:autopilot -- --dry-run    # preview only
 */

import {
  listSocialPosts,
  transitionSocialStatus,
  hasDisclosure,
  PLATFORM_LABEL,
  SOCIAL_STORAGE_MODE,
  type SocialPost,
} from "../src/lib/social.ts";

function topicsPerRun(): number {
  const raw = process.env.SOCIAL_TOPICS_PER_RUN;
  const n = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Group draft posts by content_slug, ordered by each group's oldest draft. */
function groupByContent(drafts: SocialPost[]): Map<string, SocialPost[]> {
  const groups = new Map<string, SocialPost[]>();
  for (const p of drafts) {
    const arr = groups.get(p.content_slug) ?? [];
    arr.push(p);
    groups.set(p.content_slug, arr);
  }
  // Order groups FIFO by the oldest created_at within each group.
  const ordered = [...groups.entries()].sort((a, b) => {
    const oldestA = a[1].reduce((m, p) => (p.created_at < m ? p.created_at : m), a[1][0].created_at);
    const oldestB = b[1].reduce((m, p) => (p.created_at < m ? p.created_at : m), b[1][0].created_at);
    return oldestA.localeCompare(oldestB);
  });
  return new Map(ordered);
}

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes("--dry-run");
  const cap = topicsPerRun();
  const nowIso = new Date().toISOString();

  console.log(
    `social-autopilot — ${nowIso} — store: ${SOCIAL_STORAGE_MODE}` +
      `${dryRun ? " — DRY RUN (no writes)" : ""} — up to ${cap} topic(s)/run`,
  );

  const drafts = await listSocialPosts({ status: "draft" });
  if (drafts.length === 0) {
    console.log(
      "\nNo draft posts to promote. Run `npm run social:generate -- --latest` " +
        "(or publish new content) first. Nothing to do.",
    );
    return;
  }

  const groups = groupByContent(drafts);
  const chosen = [...groups.entries()].slice(0, cap);
  const heldTopics = groups.size - chosen.length;

  let scheduled = 0;
  let refused = 0;

  for (const [slug, posts] of chosen) {
    console.log(`\n  TOPIC "${slug}" — ${posts.length} platform draft(s)`);
    for (const post of posts) {
      const label = PLATFORM_LABEL[post.platform];

      // Mirror the FTC gate transitionSocialStatus() enforces, for a clear log.
      if (post.is_monetized_link && !hasDisclosure(post.caption)) {
        console.log(`     ⛔ [${label}] refused — monetized caption missing #ad/affiliate`);
        refused += 1;
        continue;
      }

      if (dryRun) {
        console.log(`     ▶ [${label}] WOULD schedule now (${post.caption.length} chars)`);
        scheduled += 1;
        continue;
      }

      const approve = await transitionSocialStatus(post.id, "approved");
      if (!approve.ok) {
        console.log(`     ⛔ [${label}] approve blocked — ${approve.error}`);
        refused += 1;
        continue;
      }
      const sched = await transitionSocialStatus(post.id, "scheduled", {
        scheduled_at: nowIso,
      });
      if (!sched.ok) {
        console.log(`     ⛔ [${label}] schedule blocked — ${sched.error}`);
        refused += 1;
        continue;
      }
      console.log(`     ✅ [${label}] scheduled for ${nowIso}`);
      scheduled += 1;
    }
  }

  if (heldTopics > 0) {
    console.log(
      `\n  ${heldTopics} more topic(s) held as drafts for a later run ` +
        `(SOCIAL_TOPICS_PER_RUN=${cap}).`,
    );
  }

  console.log(
    dryRun
      ? `\nDry run complete. ${scheduled} post(s) would be scheduled, ${refused} refused. No writes.`
      : `\nDone. ${scheduled} post(s) scheduled (due now), ${refused} refused. ` +
          `Run \`npm run social:send\` to dispatch.`,
  );
}

main().catch((err) => {
  console.error("social-autopilot failed:", err);
  process.exit(1);
});
