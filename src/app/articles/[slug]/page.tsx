import type { Metadata } from "next";
import { notFound } from "next/navigation";

import AuthorByline from "@/components/AuthorByline";
import EmailSignup from "@/components/EmailSignup";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
import MedicalReviewerBadge from "@/components/MedicalReviewerBadge";
import PrimarySourceNote from "@/components/PrimarySourceNote";
import AnswerBlock from "@/components/review/AnswerBlock";
import Breadcrumbs from "@/components/review/Breadcrumbs";
import JsonLd from "@/components/review/JsonLd";
import LastUpdated from "@/components/review/LastUpdated";
import {
  getAuthorBySlug,
  getCategoryBySlug,
  getReviewerBySlug,
} from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { getPublishedArticleBySlug } from "@/lib/queue";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { ogImageUrl } from "@/lib/social";

/**
 * Live rendering of PUBLISHED queue articles (education | reddit_roundup |
 * news). Because items become published at runtime (via `npm run
 * queue:publish`, not at build time), this route is fully dynamic — it reads
 * the dual-mode queue store on every request so a newly published item is
 * live immediately with no rebuild. Unknown slugs, non-published items, and
 * non-article types 404.
 */
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  education: "Education",
  reddit_roundup: "Community Roundup",
  news: "Health News",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.answer_block.slice(0, 155),
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.answer_block.slice(0, 155),
      type: "article",
      url: `${SITE_URL}/articles/${article.slug}`,
      images: [
        {
          url: ogImageUrl(article.title, "article"),
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.answer_block.slice(0, 155),
      images: [ogImageUrl(article.title, "article")],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();

  const [category, author, reviewer] = await Promise.all([
    getCategoryBySlug(article.category_slug),
    getAuthorBySlug(article.author_slug || "health-research-analyst"),
    article.reviewer_slug
      ? getReviewerBySlug(article.reviewer_slug)
      : Promise.resolve(null),
  ]);

  const pageUrl = `${SITE_URL}/articles/${article.slug}`;
  // Prefer published_at for the visible/JSON-LD dates; fall back to updated_at.
  const publishedIso = article.published_at ?? article.updated_at;
  const modifiedIso = article.updated_at ?? publishedIso;
  const bodyHtml = renderMarkdown(article.body_md);

  const httpSources = article.sources.filter((s) =>
    /^https?:\/\//i.test((s.url ?? "").trim()),
  );

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.answer_block.slice(0, 250),
    url: pageUrl,
    datePublished: publishedIso,
    dateModified: modifiedIso,
    author: author
      ? {
          "@type": "Person",
          name: author.name,
          url: `${SITE_URL}/authors/${author.slug}`,
        }
      : undefined,
    reviewedBy: reviewer
      ? { "@type": "Person", name: reviewer.name }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    citation: httpSources.map((s) => ({
      "@type": "CreativeWork",
      name: s.name,
      url: s.url,
    })),
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <JsonLd data={articleJsonLd} />

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          ...(category
            ? [{ name: category.name, href: `/category/${category.slug}` }]
            : []),
          { name: article.title, href: `/articles/${article.slug}` },
        ]}
      />

      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand-blue">
        {TYPE_LABEL[article.type] ?? "Article"}
      </p>
      <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-brand-navy sm:text-4xl">
        {article.title}
      </h1>

      {/* Byline / reviewer / updated row */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-brand-mist pb-4">
        {author && <AuthorByline author={author} />}
        {reviewer && <MedicalReviewerBadge reviewer={reviewer} />}
        <LastUpdated date={publishedIso} />
      </div>

      {/* Neutral paraphrase note for community roundups. */}
      {article.type === "reddit_roundup" && (
        <p className="mt-4 rounded border border-brand-mist bg-brand-mist/50 px-4 py-2.5 text-sm text-brand-ink/80">
          This article summarizes public discussion themes; comments are
          paraphrased, not medical advice.
        </p>
      )}

      {/* Primary-source contract for news analysis (leads with the first source,
          which the news brief instructs authors to make the trigger source). */}
      {article.type === "news" && (
        <PrimarySourceNote source={httpSources[0] ?? null} className="mt-4" />
      )}

      {article.answer_block.trim() !== "" && (
        <AnswerBlock text={article.answer_block} className="mt-6" />
      )}

      {/* Rendered markdown body */}
      <div
        className="mt-6"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />

      {/* Sources — EvidenceList-style linked list */}
      {httpSources.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl font-bold text-brand-navy">
            Sources
          </h2>
          <ol className="mt-4 space-y-3">
            {httpSources.map((s, i) => (
              <li
                key={`${s.url}-${i}`}
                className="border-l-2 border-brand-blue pl-4 text-sm leading-relaxed text-brand-ink/90"
              >
                <span className="mr-1 font-semibold text-brand-ink/60">
                  {i + 1}.
                </span>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener nofollow"
                  className="font-semibold text-brand-blue hover:underline"
                >
                  {s.name || s.url}
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Newsletter capture (source 'article') */}
      <section
        aria-label="Newsletter signup"
        className="mt-12 rounded-lg border border-brand-mist bg-brand-mist/50 px-5 py-6 sm:px-6"
      >
        <h2 className="font-serif text-lg font-bold text-brand-navy">
          Get evidence-based health picks in your inbox — no hype.
        </h2>
        <p className="mt-1 text-sm text-brand-ink/75">
          Join The Vivahale Brief for a weekly, research-first read.
        </p>
        <EmailSignup source="article" variant="compact" className="mt-4" />
      </section>

      <MedicalDisclaimer className="mt-10" />
    </article>
  );
}
