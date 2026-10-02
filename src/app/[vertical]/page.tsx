import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import RankingCard from "@/components/RankingCard";
import NewsletterBand from "@/components/NewsletterBand";
import { getArticles, getAuthors, getCategories } from "@/lib/db";
import { brandFor, vHref } from "@/lib/site";
import { listNews } from "@/lib/news";
import { getVertical, isVerticalKey } from "@/lib/verticals";
import { notFound } from "next/navigation";

// News is read from the mounted volume at request time, so the home stays
// current between deploys.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  const { vertical: key } = await params;
  // brandFor throws on an unknown key, and metadata runs before the component
  // has a chance to 404, so the guard has to be here too.
  if (!isVerticalKey(key) || key === "portal") return {};
  const brand = brandFor(key);
  return { title: { absolute: `${brand.name} — ${brand.tagline}` } };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  // Pages render in parallel with layouts, so each scopes itself rather than
  // relying on the [vertical] layout having run first.
  const { vertical: verticalKey } = await params;

  // Reject unknown segments before touching the data layer. The layout does the
  // same check, but layouts and pages render in parallel, so relying on the
  // layout to have 404'd first is a race: getVertical throws, and a thrown
  // error is a 500 where this should be a 404.
  if (!isVerticalKey(verticalKey) || verticalKey === "portal") notFound();

  // Homepage static content (hero fallback, trust bullets, top rankings,
  // placeholders, browse-all link) is per-vertical config. For Health these
  // values are copied verbatim from the previous hardcoded literals, so the
  // Health homepage renders identically; Money supplies its own so no
  // health-specific string (or broken link to a health-only hub) ever appears.
  const home = getVertical(verticalKey).homepage;

  const [allArticles, categories, authors, news] = await Promise.all([
    getArticles(verticalKey),
    getCategories(verticalKey),
    getAuthors(verticalKey),
    listNews(verticalKey, { limit: 6 }),
  ]);
  // Drafts never appear on the home page; their own pages 404.
  const articles = allArticles.filter((a) => a.status === "published");

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "Health";
  const authorName = (id: string) =>
    authors.find((a) => a.id === id)?.name ?? "Firsthand Staff";

  const [featured, ...rest] = articles;

  return (
    <>
      {/* Hero / featured */}
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-5 lg:py-16">
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
              Featured analysis
            </p>
            <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-brand-navy sm:text-4xl lg:text-5xl">
              {featured
                ? featured.title
                : home?.heroFallbackTitle ??
                  "Health decisions deserve better evidence."}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-ink/80">
              {featured
                ? featured.body_mdx
                : home?.heroFallbackBody ??
                  "Firsthand analyzes clinical research to rank supplements, telehealth providers, and health products — clearly and without hype."}
            </p>
            {featured && (
              <p className="mt-4 text-sm text-slate-500">
                By {authorName(featured.author_id)} ·{" "}
                {categoryName(featured.category_id)}
              </p>
            )}
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-brand-navy/10 bg-white p-6">
              <h2 className="font-serif text-lg font-bold text-brand-navy">
                {home?.trustHeading ?? "Why trust Firsthand"}
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-brand-ink/80">
                {(
                  home?.trustPoints ?? [
                    "Rankings built from published clinical research, not sponsorships.",
                    "Clear methodology on every comparison page.",
                    "Every health claim fact-checked against its cited source.",
                  ]
                ).map((point) => (
                  <li key={point}>{`• ${point}`}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Top Rankings */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl font-bold text-brand-navy">
            Top Rankings
          </h2>
          <span className="text-sm font-semibold text-brand-blue">
            {home?.rankingsLabel ?? "2026 editions"}
          </span>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {(
            home?.rankings ?? [
              {
                title: "Best Sleep Supplements 2026",
                category: "Sleep",
                blurb:
                  "We scored the most-searched sleep supplements against published clinical evidence, dosing transparency, and third-party testing.",
                href: "/best/best-sleep-supplements",
              },
              {
                title: "Top GLP-1 Telehealth Providers 2026",
                category: "Weight Loss",
                blurb:
                  "A side-by-side comparison of telehealth GLP-1 providers on clinical oversight, pricing clarity, and what your monthly fee actually includes.",
                href: "/best/best-glp1-telehealth-providers",
              },
              {
                title: "Best Whitening & Oral Health Picks 2026",
                category: "Dental & Oral Health",
                blurb:
                  "Whitening kits and oral-care picks that hold up to dental research — and the popular ones that don't.",
                href: "/best/best-teeth-whitening-products",
              },
            ]
          ).map((r) => (
            <RankingCard key={r.title} {...r} />
          ))}
        </div>
      </section>

      {/* Latest analysis (published articles) and official announcements */}
      <section className="bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          {rest.length > 0 && (
            <>
              <h2 className="font-serif text-2xl font-bold text-brand-navy">
                Latest Analysis
              </h2>
              <div className="mt-6 mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((a) => (
                  <ArticleCard
                    key={a.id}
                    title={a.title}
                    category={categoryName(a.category_id)}
                    excerpt={a.body_mdx}
                    byline={authorName(a.author_id)}
                    href={vHref(verticalKey, `/articles/${a.slug}`)}
                  />
                ))}
              </div>
            </>
          )}
          <h2 className="font-serif text-2xl font-bold text-brand-navy">
            Latest official announcements
          </h2>
          <p className="mt-2 text-sm text-brand-ink/70">
            Straight from the bodies that issue them, in their own words, with a
            link to the original.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
              <ArticleCard
                key={n.id}
                title={n.title}
                category={n.source_name}
                excerpt={n.summary}
                byline={new Date(n.published_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                href={vHref(verticalKey, `/news/${n.slug}`)}
              />
            ))}
          </div>
          <div className="mt-8">
            <Link
              href={vHref(verticalKey, "/news")}
              className="text-sm font-semibold text-brand-blue hover:underline"
            >
              All announcements →
            </Link>
          </div>
        </div>
      </section>

      <NewsletterBand verticalKey={verticalKey} />
    </>
  );
}
