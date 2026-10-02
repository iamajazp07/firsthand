import { getHubs, getProducts } from "@/lib/db";
import { readNews } from "@/lib/news";
import { listPublishedArticles } from "@/lib/queue";

/**
 * Category slugs in a vertical that have something to show: a ranking, a
 * review, a published article or an official announcement. Categories with
 * none stay out of menus, the footer and the sitemap, and their pages 404,
 * so readers never land on an empty page. They return on their own as soon
 * as content is added.
 */
export async function activeCategorySlugs(vertical: string): Promise<Set<string>> {
  const [hubs, products, articles, news] = await Promise.all([
    getHubs(vertical),
    getProducts(vertical),
    listPublishedArticles(vertical),
    readNews(vertical),
  ]);
  return new Set(
    [...hubs, ...products, ...articles, ...news]
      .map((x) => x.category_slug)
      .filter(Boolean),
  );
}
