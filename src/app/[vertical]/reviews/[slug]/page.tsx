import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import AffiliateDisclosure from "@/components/AffiliateDisclosure";
import ArticleNewsletterCta from "@/components/ArticleNewsletterCta";
import AuthorByline from "@/components/AuthorByline";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
import MedicalReviewerBadge from "@/components/MedicalReviewerBadge";
import AffiliateCta from "@/components/review/AffiliateCta";
import AnswerBlock from "@/components/review/AnswerBlock";
import Breadcrumbs from "@/components/review/Breadcrumbs";
import EvidenceList from "@/components/review/EvidenceList";
import FaqSection from "@/components/review/FaqSection";
import JsonLd from "@/components/review/JsonLd";
import LastUpdated from "@/components/review/LastUpdated";
import PricingTable from "@/components/review/PricingTable";
import ProsCons from "@/components/review/ProsCons";
import RatingBadge, { RatingBreakdown } from "@/components/review/RatingBadge";
import {
  getAuthorBySlug,
  getCategoryBySlug,
  getHubsByCategory,
  getProductBySlug,
  getProducts,
  getProductsByCategory,
  getReviewerBySlug,
} from "@/lib/db";
import { SITE_URL, vHref, verticalUrl } from "@/lib/site";
import { ogImageUrl } from "@/lib/social";
import { getVertical } from "@/lib/verticals";

/** Prerender every review spoke at build time from the data layer. */
export async function generateStaticParams({
  params,
}: {
  params: { vertical: string };
}) {
  // Runs BEFORE any layout, once per parent vertical — so it must scope itself.
  const verticalKey = params.vertical;
  const products = await getProducts(verticalKey);
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string; slug: string }>;
}): Promise<Metadata> {
  const { vertical: verticalKey, slug } = await params;
  const product = await getProductBySlug(verticalKey, slug);
  if (!product) return {};
  const year = new Date(product.last_updated).getUTCFullYear();
  const ogTitle = `${product.name} Review ${year}`;
  return {
    title: ogTitle,
    description: product.verdict_summary.slice(0, 155),
    alternates: { canonical: verticalUrl(verticalKey, `/reviews/${product.slug}`) },
    openGraph: {
      title: ogTitle,
      description: product.verdict_summary.slice(0, 155),
      url: verticalUrl(verticalKey, `/reviews/${product.slug}`),
      images: [
        {
          url: ogImageUrl(ogTitle, "review"),
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: product.verdict_summary.slice(0, 155),
      images: [ogImageUrl(ogTitle, "review")],
    },
  };
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ vertical: string; slug: string }>;
}) {
  const { vertical: verticalKey, slug } = await params;
  const product = await getProductBySlug(verticalKey, slug);
  if (!product) notFound();

  const vertical = getVertical(verticalKey);
  const [category, author, reviewer, hubs, categoryProducts] =
    await Promise.all([
      getCategoryBySlug(verticalKey, product.category_slug),
      getAuthorBySlug(verticalKey, vertical.defaultAuthorSlug ?? "health-research-analyst"),
      getReviewerBySlug(verticalKey, vertical.defaultReviewerSlug ?? "editorial-team"),
      getHubsByCategory(verticalKey, product.category_slug),
      getProductsByCategory(verticalKey, product.category_slug),
    ]);

  const hub = hubs[0] ?? null;
  const alternatives = categoryProducts
    .filter((p) => p.slug !== product.slug)
    .slice(0, 2);

  const year = new Date(product.last_updated).getUTCFullYear();
  const pageUrl = `${SITE_URL}/reviews/${product.slug}`;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary,
    url: pageUrl,
    review: {
      "@type": "Review",
      name: `${product.name} Review ${year}`,
      datePublished: product.last_updated,
      author: author
        ? {
            "@type": "Organization",
            name: author.name,
            url: verticalUrl(verticalKey, `/authors/${author.slug}`),
          }
        : undefined,
      publisher: {
        "@type": "Organization",
        name: getVertical(verticalKey).name,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/brand/icon-512.png`,
          width: 512,
          height: 512,
        },
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: product.rating_overall,
        bestRating: 10,
        worstRating: 0,
      },
      positiveNotes: {
        "@type": "ItemList",
        itemListElement: product.pros.map((pro, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: pro,
        })),
      },
      negativeNotes: {
        "@type": "ItemList",
        itemListElement: product.cons.map((con, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: con,
        })),
      },
    },
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <JsonLd data={productJsonLd} />

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          ...(category
            ? [{ name: category.name, href: `/category/${category.slug}` }]
            : []),
          { name: `${product.name} Review`, href: `/reviews/${product.slug}` },
        ]}
      />

      <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-brand-navy sm:text-4xl">
        {product.name} Review {year}: {product.best_for}
      </h1>

      {/* Byline / reviewer / updated row */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-brand-mist pb-4">
        {author && <AuthorByline author={author} verticalKey={verticalKey} />}
        {reviewer && <MedicalReviewerBadge reviewer={reviewer} verticalKey={verticalKey} />}
        <LastUpdated date={product.last_updated} />
      </div>

      {/* Monetized: affiliate disclosure above the fold. Non-monetized: neutral note. */}
      {product.is_monetized ? (
        <AffiliateDisclosure className="mt-4" verticalKey={verticalKey} />
      ) : (
        <p className="mt-4 rounded border border-brand-mist bg-brand-mist/50 px-4 py-2.5 text-sm text-brand-ink/80">
          Firsthand does not earn a commission from this product. We include it
          because rankings limited to affiliate partners can&apos;t be trusted.
        </p>
      )}

      <AnswerBlock
        text={product.verdict_summary}
        title="Our verdict"
        className="mt-6"
      />

      {/* Rating */}
      <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <RatingBadge score={product.rating_overall} size="lg" />
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-ink/60">
            Overall score
          </span>
        </div>
        <RatingBreakdown ratings={product.ratings} className="flex-1"  verticalKey={verticalKey} />
      </div>

      {/* Who it's for */}
      <section className="mt-10">
        <h2 className="font-serif text-2xl font-bold text-brand-navy">
          Who it&apos;s for
        </h2>
        <p className="mt-3 text-base leading-relaxed text-brand-ink/85">
          <strong className="font-semibold text-brand-navy">Best for:</strong>{" "}
          {product.best_for}.
        </p>
      </section>

      {/* Pricing */}
      <section className="mt-10">
        <h2 className="font-serif text-2xl font-bold text-brand-navy">
          Pricing
        </h2>
        <p className="mt-2 text-sm text-brand-ink/70">
          {product.price_summary}
        </p>
        <PricingTable rows={product.pricing_table} className="mt-4" />
      </section>

      {/* Evidence */}
      <section className="mt-10">
        <h2 className="font-serif text-2xl font-bold text-brand-navy">
          What the evidence says
        </h2>
        <EvidenceList points={product.evidence_points} className="mt-4" />
      </section>

      {/* Pros / cons with red-flag styling */}
      <section className="mt-10">
        <h2 className="font-serif text-2xl font-bold text-brand-navy">
          Pros &amp; cons
        </h2>
        <ProsCons pros={product.pros} cons={product.cons} className="mt-4" />
      </section>

      {/* How it compares */}
      <section className="mt-10">
        <h2 className="font-serif text-2xl font-bold text-brand-navy">
          How it compares
        </h2>
        <p className="mt-3 text-base leading-relaxed text-brand-ink/85">
          {product.name} scores {product.rating_overall.toFixed(1)}/10 in our{" "}
          {category?.name.toLowerCase() ?? "category"} evaluation.
          {hub && (
            <>
              {" "}
              See where it lands in the full ranking:{" "}
              <Link
                href={vHref(verticalKey, `/best/${hub.slug}`)}
                className="font-semibold text-brand-blue hover:underline"
              >
                {hub.title}
              </Link>
              .
            </>
          )}
        </p>
        {alternatives.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-sm">
            {alternatives.map((alt) => (
              <li key={alt.id}>
                <Link
                  href={vHref(verticalKey, `/reviews/${alt.slug}`)}
                  className="font-semibold text-brand-blue hover:underline"
                >
                  {alt.name} review
                </Link>{" "}
                <span className="text-brand-ink/70">
                  — {alt.rating_overall.toFixed(1)}/10, {alt.best_for.toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FaqSection items={product.faq} className="mt-12" />

      {product.is_monetized && (
        <AffiliateCta
          name={product.name}
          affiliateUrl={product.affiliate_url}
          className="mt-10"
        />
      )}

      <ArticleNewsletterCta className="mt-12" verticalKey={verticalKey} />

      <MedicalDisclaimer className="mt-10" verticalKey={verticalKey} />
    </article>
  );
}
