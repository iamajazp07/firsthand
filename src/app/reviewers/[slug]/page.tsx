import type { Metadata } from "next";
import { notFound } from "next/navigation";

import InitialsAvatar from "@/components/InitialsAvatar";
import { getReviewerBySlug, getReviewers } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

/** Prerender every reviewer page at build time from the data layer. */
export async function generateStaticParams() {
  const reviewers = await getReviewers();
  return reviewers.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const reviewer = await getReviewerBySlug(slug);
  if (!reviewer) return {};
  return {
    title: reviewer.name,
    description: reviewer.bio,
    alternates: { canonical: `/reviewers/${reviewer.slug}` },
  };
}

export default async function ReviewerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const reviewer = await getReviewerBySlug(slug);
  if (!reviewer) notFound();

  // PLACEHOLDER REVIEWER — swap name/credential before publishing money pages.
  const showPlaceholderWarning =
    reviewer.is_placeholder && process.env.NODE_ENV !== "production";

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: reviewer.name,
    description: reviewer.bio,
    url: `${SITE_URL}/reviewers/${reviewer.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(orgJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          {showPlaceholderWarning && (
            <p
              role="alert"
              className="mb-6 rounded border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800"
            >
              PLACEHOLDER REVIEWER — attach real reviewer before publishing
            </p>
          )}

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <InitialsAvatar
              name={reviewer.name}
              size={96}
              className="shrink-0"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
                Editorial Fact-Check
              </p>
              <h1 className="mt-1 font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
                {reviewer.name}
              </h1>
              <p className="mt-2 text-sm font-semibold text-brand-ink/70">
                Fact-checks health content against cited primary sources
              </p>
            </div>
          </div>

          <div className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-brand-ink/90">
            <p>
              The {reviewer.name} fact-checks Vivahale health content for
              accuracy. Before a health-related money page is published, it is
              checked against the cited primary sources: that claims match the
              evidence, that safety information and known risks are represented
              fairly, and that nothing reads as a promise of diagnosis,
              treatment, or cure.
            </p>
            <p>
              This editorial fact-check is a verification step, not medical
              advice and not authorship of the rankings. The team has no
              financial stake in the products covered. Its role is to catch
              inaccuracies before publication — the content is still
              informational only and is never a substitute for advice from a
              licensed healthcare professional. Vivahale does not currently
              retain a licensed physician reviewer, and we do not claim medical
              review we don&apos;t perform.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
