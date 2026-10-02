import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import AffiliateDisclosure from "@/components/AffiliateDisclosure";
import ArticleNewsletterCta from "@/components/ArticleNewsletterCta";
import AuthorByline from "@/components/AuthorByline";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
import SleepQuizCallout from "@/components/SleepQuizCallout";
import MedicalReviewerBadge from "@/components/MedicalReviewerBadge";
import AffiliateCta from "@/components/review/AffiliateCta";
import AnswerBlock from "@/components/review/AnswerBlock";
import Breadcrumbs from "@/components/review/Breadcrumbs";
import ComparisonTable from "@/components/review/ComparisonTable";
import FaqSection from "@/components/review/FaqSection";
import JsonLd from "@/components/review/JsonLd";
import LastUpdated from "@/components/review/LastUpdated";
import RatingBadge from "@/components/review/RatingBadge";
import {
  getAuthorBySlug,
  getCategoryBySlug,
  getHubBySlug,
  getHubs,
  getProductBySlug,
  getReviewerBySlug,
} from "@/lib/db";
import { SITE_URL, vHref, verticalUrl } from "@/lib/site";
import { ogImageUrl } from "@/lib/social";
import { getVertical } from "@/lib/verticals";

/** Prerender every hub page at build time from the data layer. */
export async function generateStaticParams({
  params,
}: {
  params: { vertical: string };
}) {
  // Runs BEFORE any layout, once per parent vertical — so it must scope itself.
  const verticalKey = params.vertical;
  const hubs = await getHubs(verticalKey);
  return hubs.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string; slug: string }>;
}): Promise<Metadata> {
  const { vertical: verticalKey, slug } = await params;
  const hub = await getHubBySlug(verticalKey, slug);
  if (!hub) return {};
  return {
    title: hub.title,
    description: hub.answer_block.slice(0, 155),
    alternates: { canonical: verticalUrl(verticalKey, `/best/${hub.slug}`) },
    openGraph: {
      title: hub.title,
      description: hub.answer_block.slice(0, 155),
      url: verticalUrl(verticalKey, `/best/${hub.slug}`),
      images: [
        {
          url: ogImageUrl(hub.title, "hub"),
          width: 1200,
          height: 630,
          alt: hub.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: hub.title,
      description: hub.answer_block.slice(0, 155),
      images: [ogImageUrl(hub.title, "hub")],
    },
  };
}

export default async function HubPage({
  params,
}: {
  params: Promise<{ vertical: string; slug: string }>;
}) {
  const { vertical: verticalKey, slug } = await params;
  const hub = await getHubBySlug(verticalKey, slug);
  if (!hub) notFound();

  const vertical = getVertical(verticalKey);
  const [category, author, reviewer, maybeProducts] = await Promise.all([
    getCategoryBySlug(verticalKey, hub.category_slug),
    getAuthorBySlug(verticalKey, vertical.defaultAuthorSlug ?? "health-research-analyst"),
    getReviewerBySlug(verticalKey, vertical.defaultReviewerSlug ?? "editorial-team"),
    // Preserves the hub's editorial rank order.
    Promise.all(hub.product_slugs.map((s) => getProductBySlug(verticalKey, s))),
  ]);
  // Drop any slugs missing from the data layer.
  const products = maybeProducts.filter((p) => p !== null);

  const pageUrl = `${SITE_URL}/best/${hub.slug}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: hub.title,
    description: hub.answer_block.slice(0, 155),
    url: pageUrl,
    dateModified: hub.last_updated,
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
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: hub.title,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${SITE_URL}/reviews/${p.slug}`,
    })),
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={itemListJsonLd} />

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          ...(category
            ? [{ name: category.name, href: `/category/${category.slug}` }]
            : []),
          { name: hub.title, href: `/best/${hub.slug}` },
        ]}
      />

      <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-brand-navy sm:text-4xl">
        {hub.title}
      </h1>

      {/* Byline / reviewer / updated row */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-brand-mist pb-4">
        {author && <AuthorByline author={author} verticalKey={verticalKey} />}
        {reviewer && <MedicalReviewerBadge reviewer={reviewer} verticalKey={verticalKey} />}
        <LastUpdated date={hub.last_updated} />
      </div>

      {/* Above the fold, always on hubs */}
      <AffiliateDisclosure className="mt-4" verticalKey={verticalKey} />

      <AnswerBlock text={hub.answer_block} className="mt-6" />

      {hub.slug === "best-sleep-supplements" && (
        <SleepQuizCallout className="mt-6" verticalKey={verticalKey} />
      )}

      <p className="mt-6 text-base leading-relaxed text-brand-ink/80">
        {hub.intro_mdx_or_text}
      </p>

      {/* Methodology summary. Health renders its original copy verbatim; Money
          and Tech each state their own weighted criteria and disclosure
          language, so the summary is factually correct in each vertical. */}
      {vertical.key === "money" ? (
        <p className="mt-4 text-sm leading-relaxed text-brand-ink/70">
          <strong className="font-semibold text-brand-navy">
            How we scored:
          </strong>{" "}
          every product below was rated 0–10 on five weighted criteria — Fees
          (25%), Value &amp; Returns (25%), Transparency (20%), Security &amp;
          Trust (15%), and Support (15%). Advertiser compensation never affects
          scores or rank order; rates and fees are cited to each provider&apos;s
          official disclosures with an as-of date.{" "}
          <Link
            href={vHref(verticalKey, `/methodology`)}
            className="font-semibold text-brand-blue hover:underline"
          >
            Read our full methodology.
          </Link>
        </p>
      ) : vertical.key === "tech" ? (
        <p className="mt-4 text-sm leading-relaxed text-brand-ink/70">
          <strong className="font-semibold text-brand-navy">
            How we scored:
          </strong>{" "}
          every product below was rated 0–10 on five weighted criteria —
          Performance (30%), Value (25%), Reliability &amp; Security (20%), Ease
          of Use (15%), and Support (10%). Firsthand does not run a lab: ratings
          analyze manufacturer-published specifications and official
          documentation, not independent benchmarks, and each figure is cited to
          a primary source with an as-of date. Affiliate commissions never affect
          scores or rank order.{" "}
          <Link
            href={vHref(verticalKey, `/methodology`)}
            className="font-semibold text-brand-blue hover:underline"
          >
            Read our full methodology.
          </Link>
        </p>
      ) : vertical.key === "education" ? (
        <p className="mt-4 text-sm leading-relaxed text-brand-ink/70">
          <strong className="font-semibold text-brand-navy">
            How we scored:
          </strong>{" "}
          every program below was rated 0–10 on five weighted criteria —
          Outcomes (30%), Cost &amp; Value (25%), Academics (20%), Support
          Services (15%), and Flexibility (10%). Firsthand does not audit schools
          or survey students: ratings analyze officially published data and each
          provider&apos;s own documentation, and each figure is cited to a
          primary source with an as-of date; self-reported outcomes are labeled
          as such. Affiliate commissions never affect scores or rank order.{" "}
          <Link
            href={vHref(verticalKey, `/methodology`)}
            className="font-semibold text-brand-blue hover:underline"
          >
            Read our full methodology.
          </Link>
        </p>
      ) : vertical.key === "travel" ? (
        <p className="mt-4 text-sm leading-relaxed text-brand-ink/70">
          <strong className="font-semibold text-brand-navy">
            How we scored:
          </strong>{" "}
          every product below was rated 0–10 on five weighted criteria — Value
          (30%), Experience (25%), Flexibility (20%), Transparency (15%), and
          Service (10%). Firsthand does not take trips, file claims, or lab-test
          gear: ratings analyze official published documentation (plan wording,
          spec sheets, warranty and policy terms), each verifiable figure is
          cited to a primary source with an as-of date, and quote-based pricing
          is compared on published plan structure. Affiliate commissions never
          affect scores or rank order.{" "}
          <Link
            href={vHref(verticalKey, `/methodology`)}
            className="font-semibold text-brand-blue hover:underline"
          >
            Read our full methodology.
          </Link>
        </p>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-brand-ink/70">
          <strong className="font-semibold text-brand-navy">
            How we scored:
          </strong>{" "}
          every product below was rated 0–10 on five weighted criteria — Safety
          (30%), Evidence (30%), Cost &amp; Value (20%), Transparency (10%), and
          Support (10%). Commissions never affect scores or rank order.{" "}
          <Link
            href={vHref(verticalKey, `/methodology`)}
            className="font-semibold text-brand-blue hover:underline"
          >
            Read our full methodology.
          </Link>
        </p>
      )}

      {/* Ranked comparison table */}
      <h2 className="mt-10 font-serif text-2xl font-bold text-brand-navy">
        {new Date(hub.last_updated).getUTCFullYear()} rankings at a glance
      </h2>
      <ComparisonTable products={products} className="mt-4" verticalKey={verticalKey} />

      {/* Per-product blurbs */}
      <div className="mt-12 space-y-10">
        {products.map((p, i) => {
          const topPro = p.pros[0];
          const topCon = p.cons[0];
          return (
            <section
              key={p.id}
              id={p.slug}
              className="border-t border-brand-mist pt-8"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-serif text-2xl font-bold text-brand-blue">
                  {i + 1}.
                </span>
                <h3 className="font-serif text-xl font-bold text-brand-navy">
                  {p.name}
                </h3>
                <RatingBadge score={p.rating_overall} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-brand-ink/85">
                {p.summary}
              </p>
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed">
                {topPro && (
                  <li className="flex gap-2">
                    <span aria-hidden="true" className="font-bold text-brand-blue">
                      +
                    </span>
                    <span className="text-brand-ink/90">{topPro}</span>
                  </li>
                )}
                {topCon && (
                  <li className="flex gap-2">
                    <span aria-hidden="true" className="font-bold text-amber-600">
                      ⚑
                    </span>
                    <span className="text-brand-ink/90">{topCon}</span>
                  </li>
                )}
              </ul>
              <p className="mt-3">
                <Link
                  href={vHref(verticalKey, `/reviews/${p.slug}`)}
                  className="text-sm font-semibold text-brand-blue hover:underline"
                >
                  Read full review →
                </Link>
              </p>
              {p.is_monetized && (
                <AffiliateCta
                  name={p.name}
                  affiliateUrl={p.affiliate_url}
                  className="mt-4"
                />
              )}
            </section>
          );
        })}
      </div>

      <FaqSection items={hub.faq} className="mt-12" />

      <ArticleNewsletterCta className="mt-12" verticalKey={verticalKey} />

      <MedicalDisclaimer className="mt-10" verticalKey={verticalKey} />
    </article>
  );
}
