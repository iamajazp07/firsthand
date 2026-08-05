import type { MetadataRoute } from "next";
import {
  getAuthors,
  getCategories,
  getHubs,
  getProducts,
  getReviewers,
} from "@/lib/db";
import { listPublishedArticles } from "@/lib/queue";
import { SITE_URL, verticalUrl } from "@/lib/site";
import { VERTICALS, verticalHasTool, isContentVertical } from "@/lib/verticals";

/**
 * ONE sitemap for the whole network.
 *
 * Verticals used to be separate subdomain deployments, so each build emitted
 * its own sitemap for its own origin. They are now paths on a single origin, so
 * this file lists the portal, the shared policy pages, and every URL of all
 * five content verticals together.
 *
 * This route has no vertical of its own, so it walks the registry and passes
 * each vertical explicitly to the data layer. Uses the normal `@/lib/db` +
 * `@/lib/queue` accessors so newly PUBLISHED queue articles still reach the
 * sitemap without a rebuild, exactly as before.
 */
export const dynamic = "force-dynamic";

/** Network-wide trust/legal pages — one copy, shared by every vertical. */
const SHARED_PAGES = [
  "/about",
  "/editorial-policy",
  "/affiliate-disclosure",
  "/contact",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    // Apex brand portal.
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...SHARED_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  for (const vertical of Object.values(VERTICALS)) {
    if (!isContentVertical(vertical)) continue;

    const key = vertical.key;
    const url = (path: string) => verticalUrl(key, path);

    const [categories, authors, reviewers, hubs, products, articles] =
      await Promise.all([
        getCategories(key),
        getAuthors(key),
        getReviewers(key),
        getHubs(key),
        getProducts(key),
        listPublishedArticles(key),
      ]);

    entries.push(
      // Vertical homepage.
      { url: verticalUrl(key), changeFrequency: "daily", priority: 0.9 },
      // "Best X" hubs — highest-priority content after the homepage.
      ...hubs.map((h) => ({
        url: url(`/best/${h.slug}`),
        lastModified: h.last_updated,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      })),
      // Review spokes.
      ...products.map((p) => ({
        url: url(`/reviews/${p.slug}`),
        lastModified: p.last_updated,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      // Published editorial articles.
      ...articles.map((a) => ({
        url: url(`/articles/${a.slug}`),
        lastModified: a.updated_at ?? a.published_at ?? undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...categories.map((c) => ({
        url: url(`/category/${c.slug}`),
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
      // Each vertical publishes its own rating methodology.
      {
        url: url("/methodology"),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      },
      // Interactive tools — only where the vertical config exposes them
      // (Health lists /quiz/sleep; Money does not, so it is omitted and 404s).
      ...(verticalHasTool(vertical, "/quiz/sleep")
        ? [
            {
              url: url("/quiz/sleep"),
              changeFrequency: "monthly" as const,
              priority: 0.6,
            },
          ]
        : []),
      ...authors.map((a) => ({
        url: url(`/authors/${a.slug}`),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
      ...reviewers.map((r) => ({
        url: url(`/reviewers/${r.slug}`),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
    );
  }

  return entries;
}
