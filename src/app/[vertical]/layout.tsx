import type { Metadata } from "next";
import { activeCategorySlugs } from "@/lib/active-categories";
import { notFound } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { VERTICALS, isVerticalKey, getVertical } from "@/lib/verticals";
import { SITE_URL, verticalUrl } from "@/lib/site";

/**
 * Layout for every content vertical (`/health`, `/money`, `/tech`, …).
 *
 * Two jobs:
 *  1. Validate the `[vertical]` segment — an unknown key 404s rather than
 *     silently falling back, so junk URLs can't render a half-branded page.
 *  2. Render vertical-branded chrome (Header/Footer) from the route param.
 *
 * There is no implicit "active vertical" state: pages, metadata, and
 * generateStaticParams all resolve the vertical from their own params and pass
 * it explicitly to the data layer. Next renders layouts and pages in PARALLEL,
 * so anything relying on this layout running first would be a race.
 */

/** Pre-render all five vertical shells; unknown segments 404 via notFound(). */
export function generateStaticParams() {
  return Object.keys(VERTICALS)
    .filter((key) => key !== "portal")
    .map((vertical) => ({ vertical }));
}

/**
 * Unknown segments are handled by this layout's own notFound() call, not by the
 * router refusing to render them.
 *
 * With dynamicParams = false the router rejected any segment missing from
 * generateStaticParams before rendering started, and threw NoFallbackError to
 * do it. The visitor still got a 404, but the throw was logged as an internal
 * error on every junk URL, which on a site that gets scanned constantly meant
 * hundreds of errors a week and a real 404 was indistinguishable from a fault.
 * It also made the notFound() below unreachable for the exact case it was
 * written for.
 */
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string }>;
}): Promise<Metadata> {
  const { vertical: key } = await params;
  if (!isVerticalKey(key) || key === "portal") return {};

  const v = getVertical(key);
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      template: `${v.name} — %s`,
      default: `${v.name} — ${v.tagline}`,
    },
    description: v.description,
    alternates: {
      canonical: verticalUrl(key),
      types: {
        "application/rss+xml": `${verticalUrl(key)}/feed.xml`,
      },
    },
    openGraph: {
      siteName: v.name,
      type: "website",
      url: verticalUrl(key),
    },
  };
}

export default async function VerticalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ vertical: string }>;
}) {
  const { vertical: key } = await params;

  // "portal" is the apex hub at `/`, not a path segment — reject it here so
  // /portal doesn't become a second, unbranded copy of the homepage.
  if (!isVerticalKey(key) || key === "portal") notFound();

  const v = getVertical(key);
  const active = await activeCategorySlugs(key);
  const categories = v.navCategories.filter((c) => active.has(c.slug));

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: v.name,
    url: verticalUrl(key),
    description: v.description,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Header
        verticalKey={key}
        brandName={v.name}
        categories={categories}
        primaryCount={v.navPrimaryCount}
      />
      <main className="flex-1">{children}</main>
      <Footer verticalKey={key} categories={categories} />
    </>
  );
}
