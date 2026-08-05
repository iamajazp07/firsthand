/**
 * Firsthand data layer — DUAL MODE (Supabase OR local JSON seed).
 *
 * HOW IT WORKS
 * ------------
 * 1. If BOTH `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
 *    in the environment, every accessor below queries Supabase (Postgres) via
 *    `@supabase/supabase-js`. The tables are defined in
 *    `supabase/migrations/0001_init.sql`.
 *
 * 2. If either env var is missing (e.g. local dev before a Supabase project
 *    exists, or CI builds), the accessors TRANSPARENTLY fall back to committed
 *    seed JSON. Those seeds are stored per-vertical under `src/data/<vertical>/`
 *    and selected for the active vertical by the compile-time registry in
 *    `@/lib/seeds` (getActiveSeeds). Pages never need to know which mode is
 *    active — the return types are identical.
 *
 * This module is server-only (it may hold the service-role key). Do not import
 * it from client components.
 */

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSeedsFor } from "@/lib/seeds";

import type {
  Article,
  Author,
  Category,
  EmailSubscriber,
  Hub,
  Product,
  Reviewer,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Mode detection
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** True when real Supabase credentials are present in the environment. */
export const isSupabaseConfigured: boolean = Boolean(
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY,
);

/**
 * Active vertical key (from NEXT_PUBLIC_VERTICAL, default "health"). Every
 * Supabase read below is scoped to it via `.eq("vertical", vertical)`
 * against the `vertical` column added in supabase/migrations/0004_verticals.sql.
 * Local-JSON mode is already vertical-scoped by the seed registry (@/lib/seeds),
 * so no equivalent filter is needed on the fallback branches. `email_subscribers`
 * is deliberately unscoped (single cross-vertical newsletter list).
 */

let cachedClient: SupabaseClient | null = null;

/** Lazily create the Supabase client (only when configured). */
function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  if (!cachedClient) {
    cachedClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return cachedClient;
}

// ---------------------------------------------------------------------------
// Local seed data (fallback mode)
// ---------------------------------------------------------------------------

// The active vertical's committed seeds, chosen per REQUEST from the
// compile-time registry in @/lib/seeds. These were module constants while one
// build served one vertical; they are now accessor functions so a single build
// can serve /health and /money concurrently without cross-contamination.
const localCategories = (vertical: string) => getSeedsFor(vertical).categories;
const localAuthors = (vertical: string) => getSeedsFor(vertical).authors;
// EDITORIAL FACT-CHECK reviewer (not a licensed physician). "Firsthand
// Editorial Team" in src/data/health/reviewers.json has is_placeholder: false
// and is presented honestly as an editorial fact-check, never as medical
// review. If a real licensed reviewer is retained later, add them as a separate
// record.
const localReviewers = (vertical: string) => getSeedsFor(vertical).reviewers;
const localArticles = (vertical: string) => getSeedsFor(vertical).articles;
// Researched Phase-1 review content (sleep, weight-loss, GLP-1 telehealth,
// dental). Monetized items keep the literal FIRSTHAND_AFFILIATE_PLACEHOLDER
// string until real affiliate links are wired in a later step.
const localProducts = (vertical: string) => getSeedsFor(vertical).products;
const localHubs = (vertical: string) => getSeedsFor(vertical).hubs;

// ---------------------------------------------------------------------------
// Accessors — identical signatures in both modes
// ---------------------------------------------------------------------------

export async function getCategories(vertical: string): Promise<Category[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("categories")
      .select("*")
      .eq("vertical", vertical)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data as Category[];
  }
  // Fallback: local JSON seed
  return [...localCategories(vertical)].sort((a, b) => a.sort_order - b.sort_order);
}

export async function getCategoryBySlug(
  vertical: string,
  slug: string,
): Promise<Category | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("categories")
      .select("*")
      .eq("vertical", vertical)
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return (data as Category) ?? null;
  }
  return localCategories(vertical).find((c) => c.slug === slug) ?? null;
}

export async function getAuthors(vertical: string): Promise<Author[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("authors")
      .select("*")
      .eq("vertical", vertical);
    if (error) throw error;
    return data as Author[];
  }
  return localAuthors(vertical);
}

export async function getAuthorBySlug(
  vertical: string,
  slug: string,
): Promise<Author | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("authors")
      .select("*")
      .eq("vertical", vertical)
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return (data as Author) ?? null;
  }
  return localAuthors(vertical).find((a) => a.slug === slug) ?? null;
}

export async function getReviewers(vertical: string): Promise<Reviewer[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("reviewers")
      .select("*")
      .eq("vertical", vertical);
    if (error) throw error;
    return data as Reviewer[];
  }
  return localReviewers(vertical);
}

export async function getReviewerBySlug(
  vertical: string,
  slug: string,
): Promise<Reviewer | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("reviewers")
      .select("*")
      .eq("vertical", vertical)
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return (data as Reviewer) ?? null;
  }
  return localReviewers(vertical).find((r) => r.slug === slug) ?? null;
}

export async function getArticles(vertical: string): Promise<Article[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("articles")
      .select("*")
      .eq("vertical", vertical)
      .order("published_at", { ascending: false });
    if (error) throw error;
    return data as Article[];
  }
  return [...localArticles(vertical)].sort((a, b) =>
    (b.published_at ?? "").localeCompare(a.published_at ?? ""),
  );
}

export async function getArticlesByCategory(
  vertical: string,
  categoryId: string,
): Promise<Article[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("articles")
      .select("*")
      .eq("vertical", vertical)
      .eq("category_id", categoryId)
      .order("published_at", { ascending: false });
    if (error) throw error;
    return data as Article[];
  }
  return localArticles(vertical).filter((a) => a.category_id === categoryId);
}

export async function getArticlesByAuthor(
  vertical: string,
  authorId: string,
): Promise<Article[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("articles")
      .select("*")
      .eq("vertical", vertical)
      .eq("author_id", authorId)
      .order("published_at", { ascending: false });
    if (error) throw error;
    return data as Article[];
  }
  return localArticles(vertical)
    .filter((a) => a.author_id === authorId)
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
}

// ---------------------------------------------------------------------------
// Products / providers (spoke pages)
//
// Supabase mode queries a `products` table (rich review shape — added by a
// future migration; `supabase/migrations/0001_init.sql` currently only has
// the slimmer `products_providers` table). Fallback mode reads
// src/data/health/products.json, which is authoritative until that migration
// lands.
// ---------------------------------------------------------------------------

export async function getProducts(vertical: string): Promise<Product[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("products")
      .select("*")
      .eq("vertical", vertical)
      .order("rating_overall", { ascending: false });
    if (error) throw error;
    return data as Product[];
  }
  return [...localProducts(vertical)].sort((a, b) => b.rating_overall - a.rating_overall);
}

export async function getProductBySlug(
  vertical: string,
  slug: string,
): Promise<Product | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("products")
      .select("*")
      .eq("vertical", vertical)
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return (data as Product) ?? null;
  }
  return localProducts(vertical).find((p) => p.slug === slug) ?? null;
}

export async function getProductsByCategory(
  vertical: string,
  categorySlug: string,
): Promise<Product[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("products")
      .select("*")
      .eq("vertical", vertical)
      .eq("category_slug", categorySlug)
      .order("rating_overall", { ascending: false });
    if (error) throw error;
    return data as Product[];
  }
  return localProducts(vertical)
    .filter((p) => p.category_slug === categorySlug)
    .sort((a, b) => b.rating_overall - a.rating_overall);
}

// ---------------------------------------------------------------------------
// Hubs ("Best X of YYYY" ranked money pages)
// ---------------------------------------------------------------------------

export async function getHubs(vertical: string): Promise<Hub[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("hubs")
      .select("*")
      .eq("vertical", vertical);
    if (error) throw error;
    return data as Hub[];
  }
  return localHubs(vertical);
}

export async function getHubBySlug(
  vertical: string,
  slug: string,
): Promise<Hub | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("hubs")
      .select("*")
      .eq("vertical", vertical)
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return (data as Hub) ?? null;
  }
  return localHubs(vertical).find((h) => h.slug === slug) ?? null;
}

// ---------------------------------------------------------------------------
// Email subscribers (newsletter capture)
//
// Supabase mode upserts into the `email_subscribers` table (deduped on the
// unique `email` column). Fallback mode appends to a gitignored local JSON
// file at data/subscribers.local.json, deduping by email there too. Never
// imported from client components — this module may hold the service-role key.
// ---------------------------------------------------------------------------

/** Absolute path to the local-fallback subscribers store. */
const SUBSCRIBERS_FILE = path.join(
  process.cwd(),
  "data",
  "subscribers.local.json",
);

async function readLocalSubscribers(): Promise<EmailSubscriber[]> {
  try {
    const raw = await fs.readFile(SUBSCRIBERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EmailSubscriber[]) : [];
  } catch {
    // File does not exist yet (or is empty/corrupt) — start fresh.
    return [];
  }
}

export interface AddSubscriberResult {
  ok: boolean;
  /** True when the email was already present (no new row written). */
  duplicate: boolean;
}

/**
 * Persist a newsletter subscriber. Idempotent on email (case-insensitive):
 * a repeat submission returns `{ ok: true, duplicate: true }` without adding
 * a second record. `email` is expected to be pre-validated by the caller.
 */
export async function addSubscriber(
  email: string,
  source: string | null,
): Promise<AddSubscriberResult> {
  const normalized = email.trim().toLowerCase();

  if (isSupabaseConfigured) {
    // ignoreDuplicates => insert-or-ignore on the unique email constraint.
    const { error } = await getSupabase()
      .from("email_subscribers")
      .upsert(
        { email: normalized, source },
        { onConflict: "email", ignoreDuplicates: true },
      );
    if (error) throw error;
    return { ok: true, duplicate: false };
  }

  // Fallback: local JSON file
  const list = await readLocalSubscribers();
  if (list.some((s) => s.email.toLowerCase() === normalized)) {
    return { ok: true, duplicate: true };
  }
  list.push({
    id: randomUUID(),
    email: normalized,
    source,
    created_at: new Date().toISOString(),
  });
  await fs.mkdir(path.dirname(SUBSCRIBERS_FILE), { recursive: true });
  await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(list, null, 2) + "\n");
  return { ok: true, duplicate: false };
}

export async function getHubsByCategory(
  vertical: string,
  categorySlug: string,
): Promise<Hub[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("hubs")
      .select("*")
      .eq("vertical", vertical)
      .eq("category_slug", categorySlug);
    if (error) throw error;
    return data as Hub[];
  }
  return localHubs(vertical).filter((h) => h.category_slug === categorySlug);
}
