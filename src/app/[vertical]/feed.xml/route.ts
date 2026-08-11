import { getHubs, getProducts } from "@/lib/db";
import { listPublishedArticles } from "@/lib/queue";
import { verticalUrl } from "@/lib/site";
import { getVertical, isVerticalKey } from "@/lib/verticals";

/** Dynamic so newly PUBLISHED queue articles append without a rebuild. */
export const dynamic = "force-dynamic";

/**
 * RSS 2.0 feed generated dynamically from the data layer: all "Best X" hubs
 * plus every review spoke. Served at /feed.xml with
 * `Content-Type: application/rss+xml`.
 */

/** Escape the five XML predefined entities for safe inclusion in text nodes. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Trim a summary/answer to a tidy excerpt for the RSS <description>. */
function excerpt(text: string, max = 300): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

/** Convert an ISO date to an RFC-822 pubDate; falls back to now if invalid. */
function toPubDate(iso: string): string {
  const d = new Date(iso);
  return (Number.isNaN(d.getTime()) ? new Date() : d).toUTCString();
}

interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vertical: string }> },
): Promise<Response> {
  // Route handlers render outside the [vertical] layout, so the request-scoped
  // store is not populated for us — set it from our own param before any db read.
  const { vertical: key } = await params;
  const verticalKey = key;
  if (!isVerticalKey(key) || key === "portal") {
    return new Response("Not found", { status: 404 });
  }

  const vertical = getVertical(key);
  const base = verticalUrl(key);

  const [hubs, products, articles] = await Promise.all([
    getHubs(verticalKey),
    getProducts(verticalKey),
    listPublishedArticles(verticalKey),
  ]);

  const hubItems: FeedItem[] = hubs.map((h) => ({
    title: h.title,
    link: verticalUrl(verticalKey, `/best/${h.slug}`),
    description: excerpt(h.answer_block),
    pubDate: toPubDate(h.last_updated),
    guid: verticalUrl(verticalKey, `/best/${h.slug}`),
  }));

  const productItems: FeedItem[] = products.map((p) => ({
    title: `${p.name} Review`,
    link: verticalUrl(verticalKey, `/reviews/${p.slug}`),
    description: excerpt(p.summary),
    pubDate: toPubDate(p.last_updated),
    guid: verticalUrl(verticalKey, `/reviews/${p.slug}`),
  }));

  // Published editorial articles (education | reddit_roundup | news), appended
  // to the existing hub + spoke items, newest-published first.
  const articleItems: FeedItem[] = articles.map((a) => ({
    title: a.title,
    link: verticalUrl(verticalKey, `/articles/${a.slug}`),
    description: excerpt(a.answer_block),
    pubDate: toPubDate(a.published_at ?? a.updated_at),
    guid: verticalUrl(verticalKey, `/articles/${a.slug}`),
  }));

  // Hubs first, then spokes newest-updated first, then editorial articles.
  const items = [
    ...hubItems,
    ...productItems.sort(
      (a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate),
    ),
    ...articleItems.sort(
      (a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate),
    ),
  ];

  const lastBuildDate = new Date().toUTCString();

  const itemsXml = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${item.pubDate}</pubDate>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(vertical.name)}</title>
    <link>${escapeXml(base)}</link>
    <atom:link href="${escapeXml(verticalUrl(verticalKey, `/feed.xml`))}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(vertical.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${itemsXml}
  </channel>
</rss>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
