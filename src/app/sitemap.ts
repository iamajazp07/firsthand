import type { MetadataRoute } from "next";
import { activeCategorySlugs } from "@/lib/active-categories";
import {
  getAuthors,
  getCategories,
  getHubs,
  getProducts,
  getReviewers,
} from "@/lib/db";
import { listPublishedArticles } from "@/lib/queue";
import { listNews } from "@/lib/news";
import { headers } from "next/headers";
import { APEX_HOST, SITE_URL, hasOwnHost, verticalUrl } from "@/lib/site";
import { VERTICALS, verticalHasTool, isContentVertical } from "@/lib/verticals";

/**
 * Per-HOST sitemap.
 *
 * A sitemap may only list URLs on the host that serves it, so this route reads
 * the request Host and emits the matching set:
 *   health.readfirsthand.com/sitemap.xml → only Health URLs
 *   readfirsthand.com/sitemap.xml        → portal, shared pages, and every
 *                                          vertical still living on the apex
 * Reading headers() also keeps this handler dynamic, which it already was.
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

/** Most recent announcements per vertical to list in the sitemap. */
const SITEMAP_NEWS_LIMIT = 500;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = ((await headers()).get("host") ?? APEX_HOST)
    .split(":")[0]
    .trim()
    .toLowerCase();
  const isApex = host === APEX_HOST || host === `www.${APEX_HOST}`;

  // The portal and the shared legal pages belong to the apex sitemap only.
  const entries: MetadataRoute.Sitemap = isApex
    ? [
        { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
        ...SHARED_PAGES.map((path) => ({
          url: `${SITE_URL}${path}`,
          changeFrequency: "monthly" as const,
          priority: 0.5,
        })),
      ]
    : [];

  for (const vertical of Object.values(VERTICALS)) {
    if (!isContentVertical(vertical)) continue;
    // Only list verticals served by THIS host.
    const servedHere = hasOwnHost(vertical.key)
      ? vertical.host.toLowerCase() === host
      : isApex;
    if (!servedHere) continue;

    const key = vertical.key;
    const url = (path: string) => verticalUrl(key, path);

    const [allCategories, authors, reviewers, hubs, products, articles, news, active] =
      await Promise.all([
        getCategories(key),
        getAuthors(key),
        getReviewers(key),
        getHubs(key),
        getProducts(key),
        listPublishedArticles(key),
        // Capped: the tracker holds thousands and the index page links onward
        // to the rest. A sitemap stuffed with every record buries the pages
        // that actually earn rankings.
        listNews(key, { limit: SITEMAP_NEWS_LIMIT }),
        activeCategorySlugs(key),
      ]);
    const categories = allCategories.filter((c) => active.has(c.slug));

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
      // Primary-source announcements tracker.
      {
        url: url("/news"),
        changeFrequency: "hourly" as const,
        priority: 0.9,
      },
      ...news.map((n) => ({
        url: url(`/news/${n.slug}`),
        lastModified: n.published_at,
        changeFrequency: "monthly" as const,
        priority: 0.5,
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
