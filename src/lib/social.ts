/**
 * Vivahale SOCIAL post store — DUAL MODE (Supabase OR local JSON), step 9.
 *
 * Platform-native social drafts (X / Facebook / Instagram / LinkedIn) generated
 * from published content. Posts move through a small status machine
 * (draft → approved → scheduled → sent | failed | skipped_no_credentials, and
 * anything back to draft). Nothing is ever auto-sent: generation lands DRAFTS,
 * a human approves + schedules in /admin/social, and scripts/social-send.mts
 * dispatches due posts.
 *
 * HOW STORAGE WORKS (mirrors src/lib/queue.ts + src/lib/db.ts):
 *   1. If BOTH `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are
 *      set, every accessor reads/writes the `social_posts` table defined in
 *      supabase/migrations/0003_social.sql.
 *   2. Otherwise the accessors TRANSPARENTLY fall back to a gitignored local
 *      JSON file at `data/social.local.json` (auto-created on first write).
 *
 * IMPORTANT — runtime portability (same doctrine as src/lib/queue.ts):
 *   This module is imported BOTH by the Next.js app (via `@/lib/social`) AND by
 *   the standalone Node scripts in scripts/ (via `../src/lib/social.ts`, run
 *   with `node --experimental-strip-types`). To stay runnable under Node's
 *   type-stripping loader it:
 *     - imports ONLY Node builtins and `@supabase/supabase-js`,
 *     - defines all types locally (no cross-file value imports),
 *     - avoids TS enums / namespaces / parameter properties,
 *     - inlines SITE_URL (mirrors src/lib/site.ts) instead of importing it.
 *
 * Server-only: may hold the service-role key. Never import from a client
 * component.
 */

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SocialPlatform = "x" | "facebook" | "instagram" | "linkedin";

export type SocialContentType = "article" | "hub" | "review";

export type SocialStatus =
  | "draft"
  | "approved"
  | "scheduled"
  | "sent"
  | "failed"
  | "skipped_no_credentials";

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  content_type: SocialContentType;
  content_slug: string;
  /** Absolute canonical URL of the content this post promotes. */
  content_url: string;
  caption: string;
  hashtags: string[];
  /** Absolute OG image URL (see /api/og). */
  image_url: string;
  /** True when the promoted content earns commission → disclosure required. */
  is_monetized_link: boolean;
  status: SocialStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  result_note: string;
  created_at: string;
  updated_at: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "x",
  "facebook",
  "instagram",
  "linkedin",
];

export const SOCIAL_STATUSES: SocialStatus[] = [
  "draft",
  "approved",
  "scheduled",
  "sent",
  "failed",
  "skipped_no_credentials",
];

/** Human-facing platform labels (UI badges, script output). */
export const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  x: "X",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

// ---------------------------------------------------------------------------
// Site base URL — inlined to keep this module Node-script-safe (mirror of
// src/lib/site.ts SITE_URL). If the domain changes, update both.
// ---------------------------------------------------------------------------

export const SITE_URL = "https://vivahale.com";

/** Map a social content_type to the live route base for that content. */
export function contentRouteBase(type: SocialContentType): string {
  if (type === "hub") return "/best";
  if (type === "review") return "/reviews";
  return "/articles";
}

/** Absolute canonical URL for a piece of content. */
export function contentUrl(type: SocialContentType, slug: string): string {
  return `${SITE_URL}${contentRouteBase(type)}/${slug}`;
}

/** OG-card "kind" label per content type (matches the /api/og route). */
export function ogKind(type: SocialContentType): "article" | "hub" | "review" {
  return type;
}

/**
 * Absolute URL of the dynamic OG image for a piece of content. Used both to
 * wire `openGraph.images` on pages and to stamp each social post's image_url.
 */
export function ogImageUrl(title: string, kind: "article" | "hub" | "review"): string {
  const params = new URLSearchParams({ title, kind });
  return `${SITE_URL}/api/og?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// FTC disclosure helper (shared by generator, dispatcher, and admin approve)
// ---------------------------------------------------------------------------

/**
 * Whether a caption carries a clear affiliate disclosure token. We accept the
 * conventional "#ad" hashtag or the word "affiliate" (e.g. "(affiliate link)").
 * Case-insensitive.
 */
export function hasDisclosure(caption: string): boolean {
  const c = (caption ?? "").toLowerCase();
  return /#ad\b/.test(c) || c.includes("affiliate");
}

/** The disclosure token appended to monetized captions. */
export const DISCLOSURE_TOKEN = "#ad";

// ---------------------------------------------------------------------------
// Mode detection (same rule as src/lib/db.ts / src/lib/queue.ts)
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured: boolean = Boolean(
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY,
);

/** Human-readable storage mode, surfaced in the admin UI. */
export const SOCIAL_STORAGE_MODE: "supabase" | "local-json" =
  isSupabaseConfigured ? "supabase" : "local-json";

let cachedClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured for the social store.");
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

/** Absolute path to the gitignored local-fallback social store. */
export const SOCIAL_FILE = path.join(
  process.cwd(),
  "data",
  "social.local.json",
);

async function readLocal(): Promise<SocialPost[]> {
  try {
    const raw = await fs.readFile(SOCIAL_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SocialPost[]).map(normalize) : [];
  } catch {
    // File does not exist yet — start empty (auto-created on first write).
    return [];
  }
}

async function writeLocal(items: SocialPost[]): Promise<void> {
  await fs.mkdir(path.dirname(SOCIAL_FILE), { recursive: true });
  await fs.writeFile(SOCIAL_FILE, JSON.stringify(items, null, 2) + "\n");
}

/** Fill in any missing fields so older/partial rows stay well-typed. */
function normalize(row: Partial<SocialPost>): SocialPost {
  const now = new Date().toISOString();
  return {
    id: row.id ?? randomUUID(),
    platform: (row.platform ?? "x") as SocialPlatform,
    content_type: (row.content_type ?? "article") as SocialContentType,
    content_slug: row.content_slug ?? "",
    content_url: row.content_url ?? "",
    caption: row.caption ?? "",
    hashtags: Array.isArray(row.hashtags) ? row.hashtags : [],
    image_url: row.image_url ?? "",
    is_monetized_link: row.is_monetized_link === true,
    status: (row.status ?? "draft") as SocialStatus,
    scheduled_at: row.scheduled_at ?? null,
    sent_at: row.sent_at ?? null,
    result_note: row.result_note ?? "",
    created_at: row.created_at ?? now,
    updated_at: row.updated_at ?? now,
  };
}

function fromRow(row: Record<string, unknown>): SocialPost {
  return normalize(row as Partial<SocialPost>);
}

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

export interface SocialFilter {
  status?: SocialStatus;
  platform?: SocialPlatform;
  content_slug?: string;
}

/** List social posts, newest-updated first, optionally filtered. */
export async function listSocialPosts(
  filter: SocialFilter = {},
): Promise<SocialPost[]> {
  if (isSupabaseConfigured) {
    let query = getSupabase()
      .from("social_posts")
      .select("*")
      .order("updated_at", { ascending: false });
    if (filter.status) query = query.eq("status", filter.status);
    if (filter.platform) query = query.eq("platform", filter.platform);
    if (filter.content_slug)
      query = query.eq("content_slug", filter.content_slug);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r) => fromRow(r as Record<string, unknown>));
  }
  const items = await readLocal();
  const filtered = items.filter(
    (i) =>
      (!filter.status || i.status === filter.status) &&
      (!filter.platform || i.platform === filter.platform) &&
      (!filter.content_slug || i.content_slug === filter.content_slug),
  );
  return filtered.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getSocialPost(id: string): Promise<SocialPost | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("social_posts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromRow(data as Record<string, unknown>) : null;
  }
  const items = await readLocal();
  return items.find((i) => i.id === id) ?? null;
}

export type NewSocialPost = Partial<SocialPost> &
  Pick<
    SocialPost,
    "platform" | "content_type" | "content_slug" | "content_url" | "caption"
  >;

export async function createSocialPost(
  input: NewSocialPost,
): Promise<SocialPost> {
  const now = new Date().toISOString();
  const item = normalize({
    ...input,
    id: input.id ?? randomUUID(),
    status: input.status ?? "draft",
    created_at: input.created_at ?? now,
    updated_at: now,
  });

  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("social_posts")
      .insert(item)
      .select("*")
      .single();
    if (error) throw error;
    return fromRow(data as Record<string, unknown>);
  }

  const items = await readLocal();
  items.push(item);
  await writeLocal(items);
  return item;
}

/**
 * Patch a social post. Unlike the queue, status MAY be patched here (the
 * dispatcher stamps sent/failed/skipped_no_credentials + result_note + sent_at
 * in one write). Admin-driven forward moves should prefer transitionSocialStatus
 * so the small state machine is enforced.
 */
export async function updateSocialPost(
  id: string,
  patch: Partial<Omit<SocialPost, "id" | "created_at">>,
): Promise<SocialPost | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("social_posts")
      .update({ ...patch, updated_at: now })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? fromRow(data as Record<string, unknown>) : null;
  }

  const items = await readLocal();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = normalize({ ...items[idx], ...patch, updated_at: now });
  await writeLocal(items);
  return items[idx];
}

// ---------------------------------------------------------------------------
// Status machine
// ---------------------------------------------------------------------------

/** Allowed FORWARD transitions. Any non-draft status may also return to draft. */
const FORWARD_TRANSITIONS: Record<SocialStatus, SocialStatus[]> = {
  draft: ["approved"],
  approved: ["scheduled"],
  scheduled: ["sent", "failed", "skipped_no_credentials"],
  sent: [],
  failed: [],
  skipped_no_credentials: [],
};

export function allowedSocialTransitions(from: SocialStatus): SocialStatus[] {
  const set = new Set<SocialStatus>(FORWARD_TRANSITIONS[from]);
  if (from !== "draft") set.add("draft"); // anything can go back to draft
  return [...set];
}

export function isSocialTransitionAllowed(
  from: SocialStatus,
  to: SocialStatus,
): boolean {
  if (to === from) return false;
  return allowedSocialTransitions(from).includes(to);
}

export type SocialTransitionResult =
  | { ok: true; item: SocialPost }
  | { ok: false; error: string };

/**
 * Validated status transition for admin-driven moves. Enforced rules:
 *   - only edges in the state machine (draft→approved→scheduled→sent|failed|
 *     skipped, plus any→draft) are permitted;
 *   - moving TO `approved` REFUSES monetized posts whose caption lacks an FTC
 *     disclosure token ('#ad'/'affiliate') — the same guard the dispatcher runs;
 *   - moving TO `scheduled` requires a `scheduled_at` to be set;
 *   - returning to `draft` clears scheduled_at / sent_at / result_note.
 */
export async function transitionSocialStatus(
  id: string,
  newStatus: SocialStatus,
  patch: Partial<Pick<SocialPost, "caption" | "hashtags" | "scheduled_at">> = {},
): Promise<SocialTransitionResult> {
  const existing = await getSocialPost(id);
  if (!existing) return { ok: false, error: `Social post ${id} not found.` };

  // Merge any inline edits (e.g. caption + schedule) BEFORE validating.
  const item: SocialPost = { ...existing, ...patch };

  if (!isSocialTransitionAllowed(existing.status, newStatus)) {
    return {
      ok: false,
      error: `Illegal transition ${existing.status} → ${newStatus}.`,
    };
  }

  // FTC disclosure gate on approval (server-side, never trust the UI).
  if (newStatus === "approved" && item.is_monetized_link && !hasDisclosure(item.caption)) {
    return {
      ok: false,
      error:
        "Approval blocked: this is a monetized link but the caption is missing an FTC disclosure ('#ad' or 'affiliate').",
    };
  }

  // Scheduling requires a scheduled_at.
  if (newStatus === "scheduled" && !item.scheduled_at) {
    return {
      ok: false,
      error: "Cannot schedule: set a schedule date/time first.",
    };
  }

  const fields: Partial<SocialPost> = {
    ...patch,
    status: newStatus,
  };
  if (newStatus === "draft") {
    fields.scheduled_at = null;
    fields.sent_at = null;
    fields.result_note = "";
  }

  const updated = await updateSocialPost(id, fields);
  if (!updated) return { ok: false, error: "Update failed." };
  return { ok: true, item: updated };
}

// ---------------------------------------------------------------------------
// Dedupe helper (used by the generator's --latest picker)
// ---------------------------------------------------------------------------

/** Stable key for "one post per platform+content" dedupe. */
export function socialDedupeKey(
  platform: SocialPlatform,
  contentSlug: string,
): string {
  return `${platform}::${contentSlug}`;
}
