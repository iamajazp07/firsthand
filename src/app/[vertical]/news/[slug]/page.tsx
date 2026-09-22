import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { countryLabel, getNewsItem, listNews } from "@/lib/news";
import { renderMarkdown } from "@/lib/markdown";
import { getVertical, isVerticalKey } from "@/lib/verticals";
import { vHref, verticalUrl, NETWORK_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string; slug: string }>;
}): Promise<Metadata> {
  const { vertical: verticalKey, slug } = await params;
  if (!isVerticalKey(verticalKey)) return {};
  const item = await getNewsItem(verticalKey, slug);
  if (!item) return {};
  const description =
    item.analysis?.answer_block.slice(0, 180) ||
    item.summary.slice(0, 180) ||
    `Announcement issued by ${item.source_name}.`;
  return {
    // Layout template already prefixes the brand; the source is in the page.
    title: item.analysis?.title ?? item.title,
    description,
    alternates: { canonical: verticalUrl(verticalKey, `/news/${item.slug}`) },
    openGraph: {
      title: item.title,
      description,
      type: "article",
      publishedTime: item.published_at,
    },
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      });
}

export default async function NewsItemPage({
  params,
}: {
  params: Promise<{ vertical: string; slug: string }>;
}) {
  const { vertical: verticalKey, slug } = await params;
  if (!isVerticalKey(verticalKey) || verticalKey === "portal") notFound();

  const item = await getNewsItem(verticalKey, slug);
  if (!item) notFound();

  const vertical = getVertical(verticalKey);
  const analysis = item.analysis;
  const bodyHtml = analysis ? renderMarkdown(analysis.body_md) : "";
  const related = (await listNews(verticalKey, { limit: 200 }))
    .filter((i) => i.source_id === item.source_id && i.slug !== item.slug)
    .slice(0, 5);

  // NewsArticle, not Article. These are dated announcement records, and the
  // type is what makes them eligible for news surfaces.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: analysis?.title ?? item.title,
    datePublished: item.published_at,
    dateModified: analysis?.written_at ?? item.published_at,
    url: verticalUrl(verticalKey, `/news/${item.slug}`),
    description: item.summary || undefined,
    publisher: { "@type": "Organization", name: NETWORK_NAME },
    // The announcement itself is the authority here, not us. isBasedOn points
    // at the document we are recording.
    isBasedOn: { "@type": "CreativeWork", url: item.link, name: item.source_name },
    sourceOrganization: { "@type": "Organization", name: item.source_name },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <nav className="text-xs text-brand-ink/60">
          <Link href={vHref(verticalKey, "/news")} className="hover:text-brand-blue">
            Announcements tracker
          </Link>
          <span className="px-1.5">/</span>
          <span>{item.source_name}</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="font-semibold uppercase tracking-wider text-brand-blue">
            {item.source_name}
          </span>
          <span className="rounded bg-brand-mist px-2 py-0.5 font-medium text-brand-ink/70">
            {countryLabel(item.country)}
          </span>
          <span className="text-brand-ink/50">{formatDate(item.published_at)}</span>
        </div>

        <h1 className="mt-2 font-serif text-2xl font-bold leading-tight text-brand-navy sm:text-3xl">
          {analysis?.title ?? item.title}
        </h1>

        {analysis && (
          <>
            <p className="mt-5 text-lg leading-relaxed text-brand-ink">
              {analysis.answer_block}
            </p>
            <div className="mt-6" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          </>
        )}

        {/* The honesty box. A reader must never mistake the official wording
            for ours, and must never think a person wrote what a model wrote:
            the role bylines elsewhere on the site would otherwise imply a human
            analyst, which Azaj's own rules forbid. */}
        <div className="mt-8 rounded border-l-4 border-brand-blue bg-brand-mist/60 p-4">
          {analysis ? (
            <>
              <p className="text-sm font-semibold text-brand-navy">
                How this was written
              </p>
              <p className="mt-1 text-sm leading-relaxed text-brand-ink/80">
                This analysis was written with AI from the official announcement
                below, using only facts that announcement states. The quoted
                wording is {item.source_name}&rsquo;s own. Always check the
                original before acting on anything here.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-brand-navy">
                This is an official announcement record
              </p>
              <p className="mt-1 text-sm leading-relaxed text-brand-ink/80">
                {NETWORK_NAME} records what {item.source_name} announced and
                links to the original. The wording below is theirs, not ours.
              </p>
            </>
          )}
        </div>

        {item.summary && (
          <blockquote className="mt-6 border-l-2 border-brand-mist pl-4 text-base leading-relaxed text-brand-ink/90">
            {item.summary}
            <footer className="mt-2 text-sm text-brand-ink/60">
              — {item.source_name}
            </footer>
          </blockquote>
        )}

        <div className="mt-8 rounded border border-brand-mist p-5 text-center">
          <a
            href={item.link}
            target="_blank"
            rel="noopener"
            className="inline-block rounded bg-brand-blue px-5 py-2.5 font-semibold text-white transition hover:bg-brand-navy"
          >
            Read the official announcement
          </a>
          <p className="mt-2 text-xs text-brand-ink/60">
            Opens {new URL(item.link).hostname}
          </p>
        </div>

        {related.length > 0 && (
          <section className="mt-12 border-t border-brand-mist pt-6">
            <h2 className="font-serif text-lg font-bold text-brand-navy">
              More from {item.source_name}
            </h2>
            <ul className="mt-3 space-y-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={vHref(verticalKey, `/news/${r.slug}`)}
                    className="text-sm text-brand-blue hover:underline"
                  >
                    {r.title}
                  </Link>
                  <span className="ml-2 text-xs text-brand-ink/50">
                    {formatDate(r.published_at)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-10 text-xs leading-relaxed text-brand-ink/60">
          {vertical.contentDisclaimer}
        </p>
      </article>
    </>
  );
}
