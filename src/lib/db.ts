/**
 * Vivahale data layer — DUAL MODE (Supabase OR local JSON seed).
 *
 * HOW IT WORKS
 * ------------
 * 1. If BOTH `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
 *    in the environment, every accessor below queries Supabase (Postgres) via
 *    `@supabase/supabase-js`. The tables are defined in
 *    `supabase/migrations/0001_init.sql`.
 *
 * 2. If either env var is missing (e.g. local dev before a Supabase project
 *    exists, or CI builds), the accessors TRANSPARENTLY fall back to the seed
 *    JSON files in `src/data/` (categories.json, authors.json, reviewers.json,
 *    articles.json). Pages never need to know which mode is active — the
 *    return types are identical.
 *
 * This module is server-only (it may hold the service-role key). Do not import
 * it from client components.
 */

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import categoriesSeed from "@/data/categories.json";
import authorsSeed from "@/data/authors.json";
import reviewersSeed from "@/data/reviewers.json";
import articlesSeed from "@/data/articles.json";
import productsSeed from "@/data/products.json";
import hubsSeed from "@/data/hubs.json";

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

const localCategories = categoriesSeed as Category[];
const localAuthors = authorsSeed as Author[];
// EDITORIAL FACT-CHECK reviewer (not a licensed physician). "Vivahale
// Editorial Team" in src/data/reviewers.json has is_placeholder: false and is
// presented honestly as an editorial fact-check, never as medical review. If a
// real licensed reviewer is retained later, add them as a separate record.
const localReviewers = reviewersSeed as Reviewer[];
const localArticles = articlesSeed as Article[];
// Researched Phase-1 review content (sleep, weight-loss, GLP-1 telehealth,
// dental). Monetized items keep the literal VIVAHALE_AFFILIATE_PLACEHOLDER
// string until real affiliate links are wired in a later step.
const localProducts = productsSeed as Product[];
const localHubs = hubsSeed as Hub[];

// ---------------------------------------------------------------------------
// Accessors — identical signatures in both modes
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data as Category[];
  }
  // Fallback: local JSON seed
  return [...localCategories].sort((a, b) => a.sort_order - b.sort_order);
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return (data as Category) ?? null;
  }
  return localCategories.find((c) => c.slug === slug) ?? null;
}

export async function getAuthors(): Promise<Author[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase().from("authors").select("*");
    if (error) throw error;
    return data as Author[];
  }
  return localAuthors;
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("authors")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return (data as Author) ?? null;
  }
  return localAuthors.find((a) => a.slug === slug) ?? null;
}

export async function getReviewers(): Promise<Reviewer[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase().from("reviewers").select("*");
    if (error) throw error;
    return data as Reviewer[];
  }
  return localReviewers;
}

export async function getReviewerBySlug(
  slug: string,
): Promise<Reviewer | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("reviewers")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return (data as Reviewer) ?? null;
  }
  return localReviewers.find((r) => r.slug === slug) ?? null;
}

export async function getArticles(): Promise<Article[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return data as Article[];
  }
  return [...localArticles].sort((a, b) =>
    (b.published_at ?? "").localeCompare(a.published_at ?? ""),
  );
}

export async function getArticlesByCategory(
  categoryId: string,
): Promise<Article[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("articles")
      .select("*")
      .eq("category_id", categoryId)
      .order("published_at", { ascending: false });
    if (error) throw error;
    return data as Article[];
  }
  return localArticles.filter((a) => a.category_id === categoryId);
}

export async function getArticlesByAuthor(
  authorId: string,
): Promise<Article[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("articles")
      .select("*")
      .eq("author_id", authorId)
      .order("published_at", { ascending: false });
    if (error) throw error;
    return data as Article[];
  }
  return localArticles
    .filter((a) => a.author_id === authorId)
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
}

// ---------------------------------------------------------------------------
// Products / providers (spoke pages)
//
// Supabase mode queries a `products` table (rich review shape — added by a
// future migration; `supabase/migrations/0001_init.sql` currently only has
// the slimmer `products_providers` table). Fallback mode reads
// src/data/products.json, which is authoritative until that migration lands.
// ---------------------------------------------------------------------------

export async function getProducts(): Promise<Product[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("products")
      .select("*")
      .order("rating_overall", { ascending: false });
    if (error) throw error;
    return data as Product[];
  }
  return [...localProducts].sort((a, b) => b.rating_overall - a.rating_overall);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return (data as Product) ?? null;
  }
  return localProducts.find((p) => p.slug === slug) ?? null;
}

export async function getProductsByCategory(
  categorySlug: string,
): Promise<Product[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("products")
      .select("*")
      .eq("category_slug", categorySlug)
      .order("rating_overall", { ascending: false });
    if (error) throw error;
    return data as Product[];
  }
  return localProducts
    .filter((p) => p.category_slug === categorySlug)
    .sort((a, b) => b.rating_overall - a.rating_overall);
}

// ---------------------------------------------------------------------------
// Hubs ("Best X of YYYY" ranked money pages)
// ---------------------------------------------------------------------------

export async function getHubs(): Promise<Hub[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase().from("hubs").select("*");
    if (error) throw error;
    return data as Hub[];
  }
  return localHubs;
}

export async function getHubBySlug(slug: string): Promise<Hub | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("hubs")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return (data as Hub) ?? null;
  }
  return localHubs.find((h) => h.slug === slug) ?? null;
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

export async function getHubsByCategory(categorySlug: string): Promise<Hub[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from("hubs")
      .select("*")
      .eq("category_slug", categorySlug);
    if (error) throw error;
    return data as Hub[];
  }
  return localHubs.filter((h) => h.category_slug === categorySlug);
}
