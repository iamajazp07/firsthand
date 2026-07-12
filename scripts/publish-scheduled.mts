/**
 * scripts/publish-scheduled.ts — the "scheduler" (no external cron service).
 *
 * Finds queue items with status `scheduled` whose `scheduled_at` is now or in
 * the past, and transitions them to `published` (stamping `published_at`).
 *
 * Run it with either:
 *   npm run queue:publish
 *   node --experimental-strip-types scripts/publish-scheduled.mts
 *
 * Published article-type items (education | reddit_roundup | news) become live
 * immediately at /articles/[slug] — that route reads the dual-mode queue store
 * on every request, so no rebuild is needed.
 *
 * VOLUME CAP (Google scaled-content-abuse guardrail): at most PUBLISH_DAILY_CAP
 * items are published per run (default 2/day). Excess DUE items stay
 * `scheduled` with a printed notice and publish on a later run. Override for
 * demos with env PUBLISH_DAILY_CAP=<n>; the default remains 2/day.
 *
 * Uses the same dual-mode store as the app (Supabase when configured, else
 * data/queue.local.json), via src/lib/queue.ts.
 */

import {
  listQueueItems,
  transitionStatus,
  type QueueItem,
} from "../src/lib/queue.ts";

const DEFAULT_PUBLISH_CAP = 2;

async function main(): Promise<void> {
  const nowIso = new Date().toISOString();
  const scheduled = await listQueueItems("scheduled");

  const due: QueueItem[] = scheduled
    .filter((i) => i.scheduled_at != null && i.scheduled_at <= nowIso)
    // Oldest-scheduled first so the cap publishes the longest-waiting items.
    .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));

  const capEnv = process.env.PUBLISH_DAILY_CAP;
  const cap =
    capEnv !== undefined && !Number.isNaN(Number.parseInt(capEnv, 10))
      ? Number.parseInt(capEnv, 10)
      : DEFAULT_PUBLISH_CAP;

  console.log(`publish-scheduled — ${nowIso}`);
  console.log(
    `  ${scheduled.length} scheduled item(s), ${due.length} due for publishing. Cap ${cap}/run.`,
  );

  let published = 0;
  const rows: { title: string; result: string }[] = [];

  for (const item of due) {
    if (published >= cap) {
      rows.push({
        title: item.title,
        result: "held (daily cap)",
      });
      continue;
    }
    const res = await transitionStatus(item.id, "published");
    if (res.ok) {
      published += 1;
      rows.push({ title: item.title, result: "published" });
    } else {
      rows.push({ title: item.title, result: `skipped: ${res.error}` });
    }
  }

  const held = rows.filter((r) => r.result === "held (daily cap)").length;
  if (held > 0) {
    console.log(
      `  Daily publish cap reached (${cap}/day) — ${held} due item(s) held as scheduled for a later run.`,
    );
  }

  if (rows.length > 0) {
    console.log("\n  Results:");
    for (const r of rows) {
      console.log(`   - ${r.result.padEnd(22)} ${r.title}`);
    }
  }

  console.log(`\nDone. ${published} item(s) published.`);
}

main().catch((err) => {
  console.error("publish-scheduled failed:", err);
  process.exit(1);
});
