import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import RankingCard from "@/components/RankingCard";
import SleepQuizCallout from "@/components/SleepQuizCallout";
import RatingBadge from "@/components/review/RatingBadge";
import {
  getArticlesByCategory,
  getCategories,
  getCategoryBySlug,
  getHubsByCategory,
  getProductsByCategory,
} from "@/lib/db";
import { listPublishedArticlesByCategory } from "@/lib/queue";
import { listNews } from "@/lib/news";
import { activeCategorySlugs } from "@/lib/active-categories";
import { getVertical } from "@/lib/verticals";
import { vHref, verticalUrl } from "@/lib/site";

/**
 * Category pages are dynamic so newly PUBLISHED queue articles (which appear
 * at runtime via `npm run queue:publish`, not at build time) surface in the
 * article list without a rebuild.
 */
export const dynamic = "force-dynamic";

export async function generateStaticParams({
  params,
}: {
  params: { vertical: string };
}) {
  // Runs BEFORE any layout, once per parent vertical — so it must scope itself.
  const verticalKey = params.vertical;
  const categories = await getCategories(verticalKey);
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string; slug: string }>;
}): Promise<Metadata> {
  const { vertical: verticalKey, slug } = await params;
  const category = await getCategoryBySlug(verticalKey, slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: verticalUrl(verticalKey, `/category/${category.slug}`) },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ vertical: string; slug: string }>;
}) {
  const { vertical: verticalKey, slug } = await params;
  const category = await getCategoryBySlug(verticalKey, slug);
  if (!category) notFound();

  const [articles, publishedArticles, hubs, products, news, active] = await Promise.all([
    getArticlesByCategory(verticalKey, category.id),
    listPublishedArticlesByCategory(verticalKey, category.slug),
    getHubsByCategory(verticalKey, category.slug),
    getProductsByCategory(verticalKey, category.slug),
    listNews(verticalKey, { category_slug: category.slug, limit: 30 }),
    activeCategorySlugs(verticalKey),
  ]);
  // Nothing to show yet: 404 rather than publish an empty page.
  if (!active.has(category.slug)) notFound();

  // The timely "news" layer: original analysis of primary-source announcements.
  // Config-driven per vertical (health: health-news/health-tech-ai;
  // money: money-news) rather than a hardcoded health-only set.
  const NEWS_CATEGORIES = new Set(getVertical(verticalKey).newsCategorySlugs ?? []);
  const isNewsCategory = NEWS_CATEGORIES.has(category.slug);

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? ""
      : d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "UTC",
        });
  };
  const oneLine = (s: string) =>
    s.length > 160 ? s.slice(0, 160).replace(/\s+\S*$/, "") + "…" : s;

  return (
    <>
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            Category
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
            {category.name}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-brand-ink/80">
            {category.description}
          </p>
        </div>
      </section>

      {category.slug === "sleep" && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <SleepQuizCallout verticalKey={verticalKey} />
        </section>
      )}

      {/* Rankings (hub pages) */}
      {hubs.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <h2 className="font-serif text-2xl font-bold text-brand-navy">
            Rankings
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {hubs.map((h) => (
              <RankingCard
                key={h.id}
                title={h.title}
                category={category.name}
                blurb={h.intro_mdx_or_text.split(". ").slice(0, 2).join(". ") + "."}
                href={vHref(verticalKey, `/best/${h.slug}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Reviews (spoke pages) */}
      {products.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <h2 className="font-serif text-2xl font-bold text-brand-navy">
            Reviews
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <article
                key={p.id}
                className="flex h-full flex-col rounded-lg border border-brand-mist bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-lg font-bold leading-snug text-brand-navy">
                    <Link
                      href={vHref(verticalKey, `/reviews/${p.slug}`)}
                      className="hover:underline"
                    >
                      {p.name} Review
                    </Link>
                  </h3>
                  <RatingBadge score={p.rating_overall} size="sm" />
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-ink/80">
                  {p.summary}
                </p>
                <p className="mt-4 text-sm font-semibold text-brand-blue">
                  Read the review →
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {news.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <h2 className="font-serif text-2xl font-bold text-brand-navy">
            Latest official announcements
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-brand-ink/70">
            Straight from the bodies that issue them, in their own words, with a
            link to the original.
          </p>
          <ul className="mt-6 divide-y divide-brand-mist border-t border-brand-mist">
            {news.map((n) => (
              <li key={n.id} className="py-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-serif text-lg font-bold leading-snug text-brand-navy">
                    <Link
                      href={vHref(verticalKey, `/news/${n.slug}`)}
                      className="hover:underline"
                    >
                      {n.title}
                    </Link>
                  </h3>
                  {formatDate(n.published_at) && (
                    <time
                      dateTime={n.published_at}
                      className="text-xs font-semibold uppercase tracking-wider text-brand-ink/50"
                    >
                      {formatDate(n.published_at)}
                    </time>
                  )}
                </div>
                <p className="mt-1 text-xs text-brand-ink/60">{n.source_name}</p>
                {n.summary && (
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-ink/80">
                    {oneLine(n.summary)}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm font-semibold text-brand-blue">
            <Link href={vHref(verticalKey, "/news")}>All announcements →</Link>
          </p>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {publishedArticles.length > 0 &&
          (isNewsCategory ? (
            // News-style list: headline, date, one-line excerpt.
            <>
              <h2 className="font-serif text-2xl font-bold text-brand-navy">
                Latest analysis
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-brand-ink/70">
                Original commentary on primary-source announcements, not
                aggregated headlines.
              </p>
              <ul className="mt-6 divide-y divide-brand-mist border-t border-brand-mist">
                {publishedArticles.map((a) => (
                  <li key={a.id} className="py-5">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-serif text-xl font-bold leading-snug text-brand-navy">
                        <Link
                          href={vHref(verticalKey, `/articles/${a.slug}`)}
                          className="hover:underline"
                        >
                          {a.title}
                        </Link>
                      </h3>
                      {formatDate(a.published_at) && (
                        <time
                          dateTime={a.published_at ?? undefined}
                          className="text-xs font-semibold uppercase tracking-wider text-brand-ink/50"
                        >
                          {formatDate(a.published_at)}
                        </time>
                      )}
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-ink/80">
                      {oneLine(a.answer_block)}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-brand-blue">
                      <Link href={vHref(verticalKey, `/articles/${a.slug}`)}>Read the analysis →</Link>
                    </p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2 className="font-serif text-2xl font-bold text-brand-navy">
                Analysis &amp; explainers
              </h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {publishedArticles.map((a) => (
                  <ArticleCard
                    key={a.id}
                    title={a.title}
                    category={category.name}
                    excerpt={
                      a.answer_block.length > 180
                        ? a.answer_block.slice(0, 180).replace(/\s+\S*$/, "") +
                          "…"
                        : a.answer_block
                    }
                    href={vHref(verticalKey, `/articles/${a.slug}`)}
                  />
                ))}
              </div>
            </>
          ))}

        {articles.length > 0 ? (
          <div
            className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${
              publishedArticles.length > 0 ? "mt-6" : ""
            }`}
          >
            {articles.map((a) => (
              <ArticleCard
                key={a.id}
                title={a.title}
                category={category.name}
                excerpt={a.body_mdx}
              />
            ))}
          </div>
        ) : publishedArticles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-brand-mist bg-brand-mist/40 p-10 text-center">
            <p className="font-serif text-lg font-bold text-brand-navy">
              {isNewsCategory
                ? "Original analysis coming soon"
                : "Coverage coming soon"}
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm text-brand-ink/70">
              {isNewsCategory
                ? "This section publishes original, data-analyst commentary on primary-source announcements: NIH and CDC studies, FDA clearances and safety actions, and peer-reviewed journals. We analyze the source and its limitations; we don't aggregate headlines. New analysis is on the way."
                : `Our ${category.name.toLowerCase()} rankings and analysis are in progress. Check back shortly.`}
            </p>
          </div>
        ) : null}
      </section>
    </>
  );
}
