import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import RankingCard from "@/components/RankingCard";
import NewsletterBand from "@/components/NewsletterBand";
import { getArticles, getAuthors, getCategories } from "@/lib/db";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { getActiveVertical } from "@/lib/verticals";

export const metadata = {
  title: {
    absolute: `${SITE_NAME} — ${SITE_TAGLINE}`,
  },
};

export default async function HomePage() {
  // Homepage static content (hero fallback, trust bullets, top rankings,
  // placeholders, browse-all link) is per-vertical config. For Health these
  // values are copied verbatim from the previous hardcoded literals, so the
  // Health homepage renders identically; Money supplies its own so no
  // health-specific string (or broken link to a health-only hub) ever appears.
  const home = getActiveVertical().homepage;

  const [articles, categories, authors] = await Promise.all([
    getArticles(),
    getCategories(),
    getAuthors(),
  ]);

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "Health";
  const authorName = (id: string) =>
    authors.find((a) => a.id === id)?.name ?? "Vivahale Staff";

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
                  "Vivahale analyzes clinical research to rank supplements, telehealth providers, and health products — clearly and without hype."}
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
                {home?.trustHeading ?? "Why trust Vivahale"}
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-brand-ink/80">
                {(
                  home?.trustPoints ?? [
                    "Rankings built from published clinical research, not sponsorships.",
                    "Clear methodology on every comparison page.",
                    "Medical review before any health claim is published.",
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

      {/* Latest Analysis */}
      <section className="bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="font-serif text-2xl font-bold text-brand-navy">
            Latest Analysis
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(rest.length ? rest : articles).map((a) => (
              <ArticleCard
                key={a.id}
                title={a.title}
                category={categoryName(a.category_id)}
                excerpt={a.body_mdx}
                byline={authorName(a.author_id)}
              />
            ))}
            {/* Placeholder cards until more content exists (per-vertical) */}
            {(
              home?.latestPlaceholders ?? [
                {
                  title: "Magnesium for Sleep: Separating Signal from Noise",
                  category: "Nutrition & Supplements",
                  excerpt:
                    "Placeholder — a deep dive into the trial data behind magnesium's sleep claims arrives in a later step.",
                  byline: "Vivahale Staff",
                },
                {
                  title:
                    "OTC Hearing Aids in 2026: What Changed and Who Benefits",
                  category: "Hearing",
                  excerpt:
                    "Placeholder — our guide to the post-regulation OTC hearing-aid market arrives in a later step.",
                  byline: "Vivahale Staff",
                },
              ]
            ).map((p) => (
              <ArticleCard
                key={p.title}
                title={p.title}
                category={p.category}
                excerpt={p.excerpt}
                byline={p.byline}
              />
            ))}
          </div>
          <div className="mt-8">
            <Link
              href={home?.browseAllHref ?? "/category/health-news"}
              className="text-sm font-semibold text-brand-blue hover:underline"
            >
              {home?.browseAllLabel ?? "Browse all coverage →"}
            </Link>
          </div>
        </div>
      </section>

      <NewsletterBand />
    </>
  );
}
