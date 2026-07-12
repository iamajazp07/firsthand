/**
 * scripts/freshness-check.ts — the "freshness updater".
 *
 * Scans src/data/health/hubs.json and src/data/health/products.json for `last_updated` dates
 * older than N days (default 45; override with a CLI arg), and writes a
 * `hub_update` DRAFT into the content queue for each stale page:
 *   "Refresh pricing + re-verify sources for {title}".
 *
 * Deduped: an item is skipped if a hub_update DRAFT for the same slug already
 * exists, so re-running never creates duplicates. Prints a summary table.
 *
 * Run it with either:
 *   npm run freshness:check            # default 45 days
 *   npm run freshness:check -- 0       # flag everything (demo)
 *   node --experimental-strip-types scripts/freshness-check.mts 30
 *
 * Uses the same dual-mode store as the app (Supabase when configured, else
 * data/queue.local.json), via src/lib/queue.ts.
 */

import { promises as fs } from "fs";
import path from "path";

import {
  listQueueItems,
  createQueueItem,
  freshnessId,
} from "../src/lib/queue.ts";

interface HubRow {
  slug: string;
  title: string;
  category_slug: string;
  last_updated: string;
}
interface ProductRow {
  slug: string;
  name: string;
  category_slug: string;
  last_updated: string;
}

interface Candidate {
  kind: "hub" | "product";
  slug: string;
  title: string;
  category_slug: string;
  last_updated: string;
  ageDays: number;
}

async function readJson<T>(rel: string): Promise<T> {
  const raw = await fs.readFile(path.join(process.cwd(), rel), "utf8");
  return JSON.parse(raw) as T;
}

function ageInDays(dateStr: string, now: number): number {
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return Math.floor((now - t) / 86_400_000);
}

async function main(): Promise<void> {
  const arg = process.argv[2];
  const thresholdDays = arg !== undefined ? Number.parseInt(arg, 10) : 45;
  if (Number.isNaN(thresholdDays) || thresholdDays < 0) {
    console.error(`Invalid days argument: ${arg}`);
    process.exit(1);
  }

  const now = Date.now();
  const [hubs, products] = await Promise.all([
    readJson<HubRow[]>("src/data/health/hubs.json"),
    readJson<ProductRow[]>("src/data/health/products.json"),
  ]);

  const candidates: Candidate[] = [
    ...hubs.map((h) => ({
      kind: "hub" as const,
      slug: h.slug,
      title: h.title,
      category_slug: h.category_slug,
      last_updated: h.last_updated,
      ageDays: ageInDays(h.last_updated, now),
    })),
    ...products.map((p) => ({
      kind: "product" as const,
      slug: p.slug,
      title: p.name,
      category_slug: p.category_slug,
      last_updated: p.last_updated,
      ageDays: ageInDays(p.last_updated, now),
    })),
  ];

  const stale = candidates.filter((c) => c.ageDays >= thresholdDays);

  // Dedupe against existing hub_update DRAFTS (by slug) — covers both prior
  // runs and hand-seeded items.
  const existing = await listQueueItems();
  const existingSlugs = new Set(
    existing
      .filter((i) => i.type === "hub_update" && i.status === "draft")
      .map((i) => i.slug),
  );

  const rows: { kind: string; slug: string; age: number; action: string }[] =
    [];
  let created = 0;

  for (const c of stale) {
    if (existingSlugs.has(c.slug)) {
      rows.push({
        kind: c.kind,
        slug: c.slug,
        age: c.ageDays,
        action: "skip (draft exists)",
      });
      continue;
    }
    await createQueueItem({
      id: freshnessId(c.kind, c.slug),
      type: "hub_update",
      title: `Refresh pricing + re-verify sources for ${c.title}`,
      slug: c.slug,
      category_slug: c.category_slug,
      body_md: [
        `Automated freshness flag — \`${c.kind}\` page is ${c.ageDays} day(s) old (last updated ${c.last_updated}).`,
        "",
        "- Re-verify current pricing.",
        "- Re-check that cited sources still resolve.",
        "- Confirm affiliate disclosure renders.",
      ].join("\n"),
      author_slug: "health-research-analyst",
      reviewer_slug: "dr-elena-marsh",
      notes: `Created by freshness-check (threshold ${thresholdDays}d).`,
    });
    existingSlugs.add(c.slug); // avoid dupes within this run
    created += 1;
    rows.push({
      kind: c.kind,
      slug: c.slug,
      age: c.ageDays,
      action: "created draft",
    });
  }

  // Summary table
  console.log(
    `freshness-check — threshold ${thresholdDays} day(s), ${candidates.length} page(s) scanned, ${stale.length} stale.\n`,
  );
  const header = `  ${"KIND".padEnd(8)}${"AGE(d)".padEnd(8)}${"ACTION".padEnd(22)}SLUG`;
  console.log(header);
  console.log("  " + "-".repeat(header.length));
  if (rows.length === 0) {
    console.log("  (nothing stale)");
  } else {
    for (const r of rows) {
      console.log(
        `  ${r.kind.padEnd(8)}${String(r.age).padEnd(8)}${r.action.padEnd(22)}${r.slug}`,
      );
    }
  }
  console.log(`\nDone. ${created} hub_update draft(s) created.`);
}

main().catch((err) => {
  console.error("freshness-check failed:", err);
  process.exit(1);
});
