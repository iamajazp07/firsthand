import type { MetadataRoute } from "next";
import {
  getAuthors,
  getCategories,
  getHubs,
  getProducts,
  getReviewers,
} from "@/lib/db";
import { listPublishedArticles } from "@/lib/queue";
import { SITE_URL } from "@/lib/site";

/**
 * Kept dynamic (not cached at build) so newly PUBLISHED queue articles appear
 * in the sitemap without a rebuild.
 */
export const dynamic = "force-dynamic";

/** Static trust/legal pages added in the E-E-A-T scaffold step. */
const STATIC_PAGES = [
  "/about",
  "/methodology",
  "/editorial-policy",
  "/affiliate-disclosure",
  "/contact",
  "/privacy",
  "/terms",
];

/**
 * Sitemap generated dynamically from the data layer (Supabase or local seed).
 * Published article URLs will be added here in a later step once article
 * routes exist. The private /admin console is intentionally NOT listed here
 * (and is Disallowed in robots.ts).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, authors, reviewers, hubs, products, articles] =
    await Promise.all([
      getCategories(),
      getAuthors(),
      getReviewers(),
      getHubs(),
      getProducts(),
      listPublishedArticles(),
    ]);

  return [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    // Hub (money) pages — highest-priority content after the homepage.
    ...hubs.map((h) => ({
      url: `${SITE_URL}/best/${h.slug}`,
      lastModified: h.last_updated,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    // Review spokes
    ...products.map((p) => ({
      url: `${SITE_URL}/reviews/${p.slug}`,
      lastModified: p.last_updated,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    // Published editorial articles (education | reddit_roundup | news)
    ...articles.map((a) => ({
      url: `${SITE_URL}/articles/${a.slug}`,
      lastModified: a.updated_at ?? a.published_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...categories.map((c) => ({
      url: `${SITE_URL}/category/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    // Interactive quiz funnel
    {
      url: `${SITE_URL}/quiz/sleep`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    ...STATIC_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...authors.map((a) => ({
      url: `${SITE_URL}/authors/${a.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...reviewers.map((r) => ({
      url: `${SITE_URL}/reviewers/${r.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
