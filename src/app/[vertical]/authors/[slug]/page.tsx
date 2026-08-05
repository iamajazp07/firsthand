import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ArticleCard from "@/components/ArticleCard";
import InitialsAvatar from "@/components/InitialsAvatar";
import {
  getArticlesByAuthor,
  getAuthorBySlug,
  getAuthors,
  getCategories,
} from "@/lib/db";
import { SITE_URL } from "@/lib/site";

/** Prerender every author page at build time from the data layer. */
export async function generateStaticParams({
  params,
}: {
  params: { vertical: string };
}) {
  // Runs BEFORE any layout, once per parent vertical — so it must scope itself.
  const verticalKey = params.vertical;
  const authors = await getAuthors(verticalKey);
  return authors.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string; slug: string }>;
}): Promise<Metadata> {
  const { vertical: verticalKey, slug } = await params;
  const author = await getAuthorBySlug(verticalKey, slug);
  if (!author) return {};
  return {
    title: author.name,
    description: author.bio,
    alternates: { canonical: `/authors/${author.slug}` },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ vertical: string; slug: string }>;
}) {
  const { vertical: verticalKey, slug } = await params;
  const author = await getAuthorBySlug(verticalKey, slug);
  if (!author) notFound();

  const [articles, categories] = await Promise.all([
    getArticlesByAuthor(verticalKey, author.id),
    getCategories(verticalKey),
  ]);
  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "Health";

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    jobTitle: "Health Research Analyst",
    description: author.bio,
    url: `${SITE_URL}/authors/${author.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <InitialsAvatar name={author.name} size={96} className="shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
                Author
              </p>
              <h1 className="mt-1 font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
                {author.name}
              </h1>
              <p className="mt-2 text-sm font-semibold text-brand-ink/70">
                Health Research Analyst, MSc — Data Science
              </p>
            </div>
          </div>

          <div className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-brand-ink/90">
            <p>
              The Health Research Analyst behind Firsthand is a data scientist
              (MSc) who evaluates clinical evidence — not a physician, and not
              a marketer. Their work centers on reading the primary research
              directly: peer-reviewed studies indexed on PubMed, trial data
              from NIH registries, and safety communications from regulators.
              Randomized controlled trials are weighted above observational
              studies, and observational studies above anecdotes, in every
              analysis published on this site.
            </p>
            <p>
              That analyst&apos;s lens shapes how Firsthand covers supplements,
              telehealth providers, and health products: claims are traced back
              to the studies behind them, effect sizes are put in plain
              language, and weak or missing evidence is called out rather than
              papered over. Nothing written here is medical advice — health
              content is checked by a medical reviewer before it reaches money
              pages, and readers are always pointed to their own clinicians for
              decisions about their care.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="font-serif text-2xl font-bold text-brand-navy">
          Articles by {author.name}
        </h2>
        {articles.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard
                key={a.id}
                title={a.title}
                category={categoryName(a.category_id)}
                excerpt={a.body_mdx}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-brand-ink/70">
            No published articles yet.
          </p>
        )}
      </section>
    </>
  );
}
