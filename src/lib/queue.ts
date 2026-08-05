/**
 * Firsthand content QUEUE — DUAL MODE (Supabase OR local JSON), step 6.
 *
 * This is the admin-side draft/review pipeline, kept SEPARATE from the live,
 * seeded content in src/data/. Items here move through a validated status
 * machine (draft → in_review → approved → scheduled → published) with an
 * enforced pre-publish compliance checklist.
 *
 * HOW STORAGE WORKS (mirrors src/lib/db.ts):
 *   1. If BOTH `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are
 *      set, every accessor reads/writes the `queue_items` table defined in
 *      supabase/migrations/0002_queue.sql.
 *   2. Otherwise the accessors TRANSPARENTLY fall back to a gitignored local
 *      JSON file at `data/queue.local.json` (auto-created on first write).
 *
 * IMPORTANT — runtime portability:
 *   This file is imported BOTH by the Next.js app (via the `@/lib/queue`
 *   alias) AND by the standalone Node scripts in scripts/ (via a relative
 *   `../src/lib/queue.ts` path, run with `node --experimental-strip-types`).
 *   To stay runnable under Node's type-stripping loader, this module:
 *     - imports ONLY Node builtins and `@supabase/supabase-js` at runtime,
 *     - defines all of its types locally (no cross-file value imports),
 *     - avoids TS enums / namespaces / parameter properties.
 *   `next/headers`, the `@/` alias, and seed-JSON imports live in the admin
 *   UI / auth modules, never here.
 *
 * Server-only: may hold the service-role key. Never import from a client
 * component.
 */

import { promises as fs } from "fs";
import path from "path";
import { randomUUID, createHash } from "crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QueueItemType =
  | "review"
  | "hub_update"
  | "education"
  | "reddit_roundup"
  | "news";

export type QueueStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "scheduled"
  | "published";

export interface QueueSource {
  name: string;
  url: string;
}

/** Manual, human-confirmed compliance checkboxes (stored on the item). */
export interface QueueCompliance {
  affiliate_disclosure: boolean;
  cons_red_flags: boolean;
  pricing_verified: boolean;
  no_fabricated_testimonials: boolean;
}

export interface QueueItem {
  id: string;
  /**
   * Owning vertical (health, money, …). New items are stamped with the active
   * vertical (NEXT_PUBLIC_VERTICAL, default "health"); legacy rows written
   * before multi-vertical lack the field and are read as "health".
   */
  vertical: string;
  type: QueueItemType;
  title: string;
  slug: string;
  category_slug: string;
  body_md: string;
  answer_block: string;
  sources: QueueSource[];
  author_slug: string;
  reviewer_slug: string | null;
  status: QueueStatus;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  compliance: QueueCompliance;
  notes: string;
}

export const QUEUE_TYPES: QueueItemType[] = [
  "review",
  "hub_update",
  "education",
  "reddit_roundup",
  "news",
];

export const QUEUE_STATUSES: QueueStatus[] = [
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "published",
];

export const DEFAULT_COMPLIANCE: QueueCompliance = {
  affiliate_disclosure: false,
  cons_red_flags: false,
  pricing_verified: false,
  no_fabricated_testimonials: false,
};

/** Labels for the four manual compliance checkboxes (UI + error messages). */
export const MANUAL_COMPLIANCE_LABELS: Record<keyof QueueCompliance, string> = {
  affiliate_disclosure: "Affiliate disclosure will be present on rendered page",
  cons_red_flags: "Cons/red flags included",
  pricing_verified: "Pricing verified current",
  no_fabricated_testimonials: "No fabricated testimonials",
};

// ---------------------------------------------------------------------------
// Mode detection (same rule as src/lib/db.ts)
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Active vertical, read INLINE from NEXT_PUBLIC_VERTICAL (default "health").
 * Read directly from the env — NOT via @/lib/verticals — to keep this module
 * Node-script-safe (Node builtins + supabase-js only, no @/ aliases). New queue
 * items are stamped with this; legacy rows without the field read as "health".
 */
const ACTIVE_VERTICAL: string = process.env.NEXT_PUBLIC_VERTICAL || "health";

export const isSupabaseConfigured: boolean = Boolean(
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY,
);

/** Human-readable storage mode, surfaced in the admin UI. */
export const QUEUE_STORAGE_MODE: "supabase" | "local-json" =
  isSupabaseConfigured ? "supabase" : "local-json";

let cachedClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured for the queue.");
  }
  if (!cachedClient) {
    cachedClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return cachedClient;
}

// ---------------------------------------------------------------------------
// Local JSON store
// ---------------------------------------------------------------------------

/** Absolute path to the gitignored local-fallback queue store. */
export const QUEUE_FILE = path.join(
  process.cwd(),
  "data",
  "queue.local.json",
);

async function readLocalQueue(): Promise<QueueItem[]> {
  try {
    const raw = await fs.readFile(QUEUE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueueItem[]).map(normalize) : [];
  } catch {
    // File does not exist yet — start empty (auto-created on first write).
    return [];
  }
}

async function writeLocalQueue(items: QueueItem[]): Promise<void> {
  await fs.mkdir(path.dirname(QUEUE_FILE), { recursive: true });
  await fs.writeFile(QUEUE_FILE, JSON.stringify(items, null, 2) + "\n");
}

/** Fill in any missing fields so older/partial rows stay well-typed. */
function normalize(row: Partial<QueueItem>): QueueItem {
  return {
    id: row.id ?? randomUUID(),
    // Legacy rows predate multi-vertical → treated as "health".
    vertical: row.vertical ?? "health",
    type: (row.type ?? "education") as QueueItemType,
    title: row.title ?? "",
    slug: row.slug ?? "",
    category_slug: row.category_slug ?? "",
    body_md: row.body_md ?? "",
    answer_block: row.answer_block ?? "",
    sources: Array.isArray(row.sources) ? row.sources : [],
    author_slug: row.author_slug ?? "",
    reviewer_slug: row.reviewer_slug ?? null,
    status: (row.status ?? "draft") as QueueStatus,
    scheduled_at: row.scheduled_at ?? null,
    published_at: row.published_at ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    compliance: { ...DEFAULT_COMPLIANCE, ...(row.compliance ?? {}) },
    notes: row.notes ?? "",
  };
}

// Map between the flat QueueItem shape and the Supabase `queue_items` row.
// The table stores the same field names 1:1; jsonb columns hold sources /
// compliance. (See supabase/migrations/0002_queue.sql.)
function fromRow(row: Record<string, unknown>): QueueItem {
  return normalize(row as Partial<QueueItem>);
}

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

/** List queue items, newest-updated first, optionally filtered by status. */
export async function listQueueItems(
  statusFilter?: QueueStatus,
  /** Vertical to scope to. Defaults to the env vertical (the admin console's
   *  view); vertical PAGES pass their own route param explicitly. */
  vertical: string = ACTIVE_VERTICAL,
): Promise<QueueItem[]> {
  if (isSupabaseConfigured) {
    let query = getSupabase()
      .from("queue_items")
      .select("*")
      // Partition by the active vertical so a money deployment never reads
      // another vertical's queued/published items (migration 0004 defaults the
      // column to 'health', so legacy rows read as health).
      .eq("vertical", vertical)
      .order("updated_at", { ascending: false });
    if (statusFilter) query = query.eq("status", statusFilter);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r) => fromRow(r as Record<string, unknown>));
  }
  const items = await readLocalQueue();
  const filtered = items.filter(
    // The local queue store is a single shared file; scope reads to the active
    // vertical (legacy rows normalize to "health") so money mode never surfaces
    // health articles in its sitemap/feed/routes, and vice versa. In health mode
    // legacy rows read as "health", so output is unchanged.
    (i) =>
      i.vertical === vertical &&
      (statusFilter ? i.status === statusFilter : true),
  );
  return filtered.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getQueueItem(id: string): Promise<QueueItem | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("queue_items")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromRow(data as Record<string, unknown>) : null;
  }
  const items = await readLocalQueue();
  return items.find((i) => i.id === id) ?? null;
}

export type NewQueueItem = Partial<QueueItem> &
  Pick<QueueItem, "type" | "title" | "slug" | "category_slug">;

export async function createQueueItem(input: NewQueueItem): Promise<QueueItem> {
  const now = new Date().toISOString();
  const item = normalize({
    ...input,
    id: input.id ?? randomUUID(),
    // Stamp NEW items with the active vertical (callers may override).
    vertical: input.vertical ?? ACTIVE_VERTICAL,
    status: input.status ?? "draft",
    created_at: input.created_at ?? now,
    updated_at: now,
  });

  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("queue_items")
      .insert(item)
      .select("*")
      .single();
    if (error) throw error;
    return fromRow(data as Record<string, unknown>);
  }

  const items = await readLocalQueue();
  items.push(item);
  await writeLocalQueue(items);
  return item;
}

/** Patch mutable fields of a queue item. Status is NOT changed here — use
 *  transitionStatus() so the state machine and compliance gate always run. */
export async function updateQueueItem(
  id: string,
  patch: Partial<
    Omit<QueueItem, "id" | "created_at" | "status" | "published_at">
  >,
): Promise<QueueItem | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("queue_items")
      .update({ ...patch, updated_at: now })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? fromRow(data as Record<string, unknown>) : null;
  }

  const items = await readLocalQueue();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = normalize({ ...items[idx], ...patch, updated_at: now });
  await writeLocalQueue(items);
  return items[idx];
}

// ---------------------------------------------------------------------------
// Compliance checklist (auto + manual)
// ---------------------------------------------------------------------------

/** Disease-claim phrases we refuse to publish. Case-insensitive substring. */
export const BANNED_PHRASES = [
  "cures",
  "cure ",
  "treats ",
  "treatment for",
  "prevents disease",
  "melts fat",
  "miracle",
];

export type CheckStatus = "pass" | "warn" | "fail";

export interface ComplianceCheck {
  key: string;
  label: string;
  status: CheckStatus;
  /** Whether a failing status blocks Approve. Warns never block. */
  required: boolean;
  detail?: string;
}

export interface ComplianceResult {
  checks: ComplianceCheck[];
  /** True when every REQUIRED check passes (warns are allowed through). */
  passed: boolean;
  /** Human-readable messages for each blocking failure. */
  failures: string[];
}

export interface EvaluateOptions {
  /** Whether the attached reviewer has is_placeholder = true. */
  reviewerIsPlaceholder?: boolean;
  /** Defaults to NODE_ENV === "production". */
  isProduction?: boolean;
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Compute the full compliance checklist for an item.
 *
 * Auto checks:
 *   - reviewer attached (+ not placeholder). Placeholder reviewers WARN, and
 *     block Approve only when isProduction AND type is review|hub_update.
 *   - at least one http(s) source        (review | education | news)
 *   - answer_block is 130–170 words       (review | education)
 *   - body has no banned disease phrases  (all types)
 * Manual checks (stored booleans, required for ALL types):
 *   - affiliate disclosure / cons&red-flags / pricing verified / no fabricated
 */
export function evaluateCompliance(
  item: QueueItem,
  opts: EvaluateOptions = {},
): ComplianceResult {
  const isProduction =
    opts.isProduction ?? process.env.NODE_ENV === "production";
  const reviewerIsPlaceholder = opts.reviewerIsPlaceholder ?? false;
  const checks: ComplianceCheck[] = [];

  const needsReviewer = ["review", "education", "hub_update"].includes(
    item.type,
  );
  const needsSource = ["review", "education", "news"].includes(item.type);
  const needsAnswerLen = ["review", "education"].includes(item.type);
  const placeholderBlocks =
    isProduction && ["review", "hub_update"].includes(item.type);

  // (a1) reviewer attached
  if (!item.reviewer_slug) {
    checks.push({
      key: "reviewer_attached",
      label: "Medical reviewer attached",
      status: needsReviewer ? "fail" : "warn",
      required: needsReviewer,
      detail: "No reviewer selected for this item.",
    });
  } else if (reviewerIsPlaceholder) {
    checks.push({
      key: "reviewer_attached",
      label: "Medical reviewer attached (not a placeholder)",
      // Placeholder reviewer: WARN in dev, hard FAIL only in prod for
      // review/hub_update money pages.
      status: placeholderBlocks ? "fail" : "warn",
      required: placeholderBlocks,
      detail: placeholderBlocks
        ? "Placeholder reviewer blocks approval in production for this type."
        : "Placeholder reviewer — allowed in dev, blocks approval in production mode (review/hub_update).",
    });
  } else {
    checks.push({
      key: "reviewer_attached",
      label: "Medical reviewer attached (not a placeholder)",
      status: "pass",
      required: needsReviewer,
    });
  }

  // (a2) at least one http(s) source
  const httpSources = item.sources.filter((s) =>
    /^https?:\/\//i.test((s.url ?? "").trim()),
  );
  if (needsSource) {
    checks.push({
      key: "sources",
      label: "At least one source with an http(s) URL",
      status: httpSources.length >= 1 ? "pass" : "fail",
      required: true,
      detail:
        httpSources.length >= 1
          ? `${httpSources.length} valid source URL(s).`
          : "No source has a valid http(s) URL.",
    });
  } else {
    checks.push({
      key: "sources",
      label: "Sources present",
      status: httpSources.length >= 1 ? "pass" : "warn",
      required: false,
      detail: `${httpSources.length} valid source URL(s).`,
    });
  }

  // (a3) answer_block length 130–170 words
  const words = wordCount(item.answer_block);
  if (needsAnswerLen) {
    const ok = words >= 130 && words <= 170;
    checks.push({
      key: "answer_length",
      label: "Answer block is 130–170 words",
      status: ok ? "pass" : "fail",
      required: true,
      detail: `Answer block is ${words} words (need 130–170).`,
    });
  } else {
    checks.push({
      key: "answer_length",
      label: "Answer block length",
      status: "warn",
      required: false,
      detail: `Answer block is ${words} words (length rule not enforced for ${item.type}).`,
    });
  }

  // (a4) banned disease-claim phrases
  const haystack = `${item.body_md}`.toLowerCase();
  const matched = BANNED_PHRASES.filter((p) => haystack.includes(p));
  checks.push({
    key: "no_banned_phrases",
    label: "No banned disease-claim phrases in body",
    status: matched.length === 0 ? "pass" : "fail",
    required: true,
    detail:
      matched.length === 0
        ? "No banned phrases found."
        : `Matched banned phrase(s): ${matched
            .map((m) => `"${m.trim()}"`)
            .join(", ")}.`,
  });

  // (b) manual confirmations — required for all types
  (Object.keys(MANUAL_COMPLIANCE_LABELS) as (keyof QueueCompliance)[]).forEach(
    (k) => {
      const ok = item.compliance[k] === true;
      checks.push({
        key: `manual_${k}`,
        label: MANUAL_COMPLIANCE_LABELS[k],
        status: ok ? "pass" : "fail",
        required: true,
        detail: ok
          ? undefined
          : `Manual confirmation not checked: "${MANUAL_COMPLIANCE_LABELS[k]}".`,
      });
    },
  );

  const failures = checks
    .filter((c) => c.required && c.status === "fail")
    .map((c) => c.detail ?? c.label);

  return { checks, passed: failures.length === 0, failures };
}

// ---------------------------------------------------------------------------
// Status machine
// ---------------------------------------------------------------------------

/** Allowed FORWARD transitions. Any status may additionally return to draft. */
const FORWARD_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  draft: ["in_review"],
  in_review: ["approved"],
  approved: ["scheduled", "published"],
  scheduled: ["published"],
  published: [],
};

export function allowedTransitions(from: QueueStatus): QueueStatus[] {
  const set = new Set<QueueStatus>(FORWARD_TRANSITIONS[from]);
  if (from !== "draft") set.add("draft"); // any status can go back to draft
  return [...set];
}

export function isTransitionAllowed(
  from: QueueStatus,
  to: QueueStatus,
): boolean {
  if (to === from) return false;
  return allowedTransitions(from).includes(to);
}

export type TransitionResult =
  | { ok: true; item: QueueItem }
  | { ok: false; error: string; failures?: string[] };

/**
 * Validated status transition. Enforced rules:
 *   - only edges in the state machine (draft→in_review→approved→scheduled→
 *     published, plus any→draft) are permitted;
 *   - moving TO `approved` requires the compliance checklist to PASS
 *     (server-side, not just a disabled button);
 *   - moving TO `scheduled` requires a `scheduled_at` to be set;
 *   - `published` is reachable only FROM approved or scheduled, and stamps
 *     `published_at`.
 */
export async function transitionStatus(
  id: string,
  newStatus: QueueStatus,
  opts: EvaluateOptions = {},
): Promise<TransitionResult> {
  const item = await getQueueItem(id);
  if (!item) return { ok: false, error: `Queue item ${id} not found.` };

  if (!isTransitionAllowed(item.status, newStatus)) {
    return {
      ok: false,
      error: `Illegal transition ${item.status} → ${newStatus}.`,
    };
  }

  // Compliance gate on approval.
  if (newStatus === "approved") {
    const result = evaluateCompliance(item, opts);
    if (!result.passed) {
      return {
        ok: false,
        error: "Approval blocked: compliance checklist has failing checks.",
        failures: result.failures,
      };
    }
  }

  // Scheduling requires a scheduled_at.
  if (newStatus === "scheduled" && !item.scheduled_at) {
    return {
      ok: false,
      error: "Cannot schedule: set a schedule date/time first.",
    };
  }

  // Publish only from approved or scheduled (state machine already enforces
  // the edge, but assert explicitly for clarity).
  if (
    newStatus === "published" &&
    !["approved", "scheduled"].includes(item.status)
  ) {
    return {
      ok: false,
      error: "Publish requires status approved or scheduled.",
    };
  }

  const now = new Date().toISOString();
  const nextFields: Partial<QueueItem> = {
    status: newStatus,
    updated_at: now,
  };
  if (newStatus === "published") nextFields.published_at = now;
  // Returning to draft clears any pending schedule.
  if (newStatus === "draft") nextFields.scheduled_at = null;

  const updated = await writeStatus(id, item, nextFields);
  return { ok: true, item: updated };
}

/** Low-level status writer (bypasses updateQueueItem's status guard). */
async function writeStatus(
  id: string,
  current: QueueItem,
  fields: Partial<QueueItem>,
): Promise<QueueItem> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("queue_items")
      .update(fields)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return fromRow(data as Record<string, unknown>);
  }
  const items = await readLocalQueue();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return normalize({ ...current, ...fields });
  items[idx] = normalize({ ...items[idx], ...fields });
  await writeLocalQueue(items);
  return items[idx];
}

// ---------------------------------------------------------------------------
// Helpers shared by scripts
// ---------------------------------------------------------------------------

/** Deterministic id for a freshness hub_update, so re-runs dedupe cleanly. */
export function freshnessId(kind: string, slug: string): string {
  return `freshness-${kind}-${createHash("sha1")
    .update(`${kind}:${slug}`)
    .digest("hex")
    .slice(0, 12)}`;
}

// ---------------------------------------------------------------------------
// Published-article helpers (live rendering at /articles/[slug])
// ---------------------------------------------------------------------------

/**
 * Queue item types that render as LIVE editorial articles at /articles/[slug]
 * once published. `review` and `hub_update` are intentionally excluded — those
 * feed the money-page workflow (src/data), not the standalone article route.
 */
export const PUBLISHED_ARTICLE_TYPES: QueueItemType[] = [
  "education",
  "reddit_roundup",
  "news",
];

function isPublishedArticle(item: QueueItem): boolean {
  return (
    item.status === "published" &&
    PUBLISHED_ARTICLE_TYPES.includes(item.type)
  );
}

/**
 * All published, article-type queue items, newest-published first. Used by the
 * category pages, sitemap, and RSS feed so newly published items surface
 * without a rebuild (callers are dynamic / revalidated).
 */
export async function listPublishedArticles(
  vertical: string,
): Promise<QueueItem[]> {
  const published = await listQueueItems("published", vertical);
  return published
    .filter((i) => PUBLISHED_ARTICLE_TYPES.includes(i.type))
    .sort((a, b) =>
      (b.published_at ?? b.updated_at).localeCompare(
        a.published_at ?? a.updated_at,
      ),
    );
}

/** Published article-type queue items in a single category (by slug). */
export async function listPublishedArticlesByCategory(
  vertical: string,
  categorySlug: string,
): Promise<QueueItem[]> {
  const all = await listPublishedArticles(vertical);
  return all.filter((i) => i.category_slug === categorySlug);
}

/**
 * Look up a single published article by slug. Returns null for unknown slugs,
 * non-published items, or types that don't render as articles — so the route
 * can 404 correctly.
 */
export async function getPublishedArticleBySlug(
  vertical: string,
  slug: string,
): Promise<QueueItem | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("queue_items")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      // Scope to the active vertical so a money deployment can't render another
      // vertical's article at /articles/[slug] (legacy rows default to health).
      .eq("vertical", vertical)
      .in("type", PUBLISHED_ARTICLE_TYPES)
      .maybeSingle();
    if (error) throw error;
    return data ? fromRow(data as Record<string, unknown>) : null;
  }
  const items = await readLocalQueue();
  // Same vertical scoping in local mode (legacy rows normalize to "health").
  const match = items.find(
    (i) =>
      i.slug === slug &&
      isPublishedArticle(i) &&
      i.vertical === vertical,
  );
  return match ?? null;
}

/**
 * Count queue items whose `created_at` falls on the given UTC date
 * (YYYY-MM-DD). Site-wide, across every type/status. Powers the ingest-side
 * "scaled content abuse" volume cap.
 */
export async function countItemsCreatedOn(dateUtc: string): Promise<number> {
  const all = await listQueueItems();
  return all.filter((i) => (i.created_at ?? "").slice(0, 10) === dateUtc)
    .length;
}
