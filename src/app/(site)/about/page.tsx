import type { Metadata } from "next";
import Link from "next/link";

import InitialsAvatar from "@/components/InitialsAvatar";
import { getAuthors, getReviewers } from "@/lib/db";

export const metadata: Metadata = {
  title: "About",
  description:
    "Firsthand is an independent health & wellness review directory. Evidence-based analysis, honest cons, medical review — and a published methodology behind every ranking.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  // This page's editorial copy is health-specific ("Health Research Analyst",
  // "Health content is fact-checked…") and now sits at the NETWORK root rather
  // than per-subdomain, so it reads the health vertical explicitly. If
  // per-vertical About pages are added later, move this file under [vertical].
  const [authors, reviewers] = await Promise.all([
    getAuthors("health"),
    getReviewers("health"),
  ]);
  const author = authors[0];
  const reviewer = reviewers[0];

  return (
    <>
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            About
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
            About Firsthand
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-brand-ink/80">
            An independent health &amp; wellness review directory built on
            clinical evidence, not hype.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-4 text-base leading-relaxed text-brand-ink/90">
          <h2 className="font-serif text-2xl font-bold text-brand-navy">
            What Firsthand is
          </h2>
          <p>
            Firsthand is an independent review directory for health and
            wellness products and services — supplements, telehealth
            providers, sleep aids, dental and hearing products, and more. The
            health market is crowded with bold claims and thin evidence, and
            most &quot;review&quot; sites simply repeat whatever the
            manufacturer says. We built Firsthand to do the opposite: read the
            actual research, publish the scoring rules, and tell you what
            doesn&apos;t work as plainly as what does.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Who&apos;s behind it
          </h2>
          <p>
            Firsthand&apos;s analysis is produced by a{" "}
            {author ? (
              <Link
                href={`/health/authors/${author.slug}`}
                className="font-semibold text-brand-blue hover:underline"
              >
                Health Research Analyst
              </Link>
            ) : (
              "Health Research Analyst"
            )}{" "}
            — a data scientist (MSc) who evaluates clinical evidence from
            PubMed, NIH trial registries, and regulatory sources. The analyst
            is not a physician and doesn&apos;t give medical advice; their job
            is to weigh studies honestly and translate them into clear
            comparisons. Health content is then fact-checked against its cited
            sources by our editorial team
            {reviewer ? (
              <>
                {" "}
                (
                <Link
                  href={`/health/reviewers/${reviewer.slug}`}
                  className="font-semibold text-brand-blue hover:underline"
                >
                  {reviewer.name}
                </Link>
                )
              </>
            ) : null}{" "}
            before it reaches the pages where buying decisions happen.
          </p>
          {author && (
            <div className="mt-6 flex items-center gap-4 rounded-lg border border-brand-mist bg-brand-mist/40 p-4">
              <InitialsAvatar name={author.name} size={56} className="shrink-0" />
              <div>
                <Link
                  href={`/health/authors/${author.slug}`}
                  className="font-serif text-lg font-bold text-brand-navy hover:text-brand-blue hover:underline"
                >
                  {author.name}
                </Link>
                <p className="text-sm text-brand-ink/70">
                  {author.credentials} — analyzes clinical research on
                  supplements and telehealth
                </p>
              </div>
            </div>
          )}

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            The mission
          </h2>
          <p>
            Every ranking on Firsthand follows three commitments:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="font-semibold">Evidence-based.</strong>{" "}
              Recommendations trace back to peer-reviewed research, with
              randomized controlled trials weighted highest. Our{" "}
              <Link
                href="/health/methodology"
                className="font-semibold text-brand-blue hover:underline"
              >
                scoring methodology
              </Link>{" "}
              is published in full.
            </li>
            <li>
              <strong className="font-semibold">Honest cons.</strong> Every
              product page lists drawbacks, side effects, and red flags — even
              for products we recommend, and even when a commission is at
              stake. How we make money is explained in our{" "}
              <Link
                href="/affiliate-disclosure"
                className="font-semibold text-brand-blue hover:underline"
              >
                affiliate disclosure
              </Link>
              .
            </li>
            <li>
              <strong className="font-semibold">Editorially fact-checked.</strong>{" "}
              Health money pages are checked against their cited sources by our
              editorial team before publication, under the standards in our{" "}
              <Link
                href="/editorial-policy"
                className="font-semibold text-brand-blue hover:underline"
              >
                editorial policy
              </Link>
              .
            </li>
          </ul>

          <p className="pt-4">
            Firsthand content is informational only and is never a substitute
            for advice from your own healthcare professional. Questions,
            corrections, or feedback?{" "}
            <Link
              href="/contact"
              className="font-semibold text-brand-blue hover:underline"
            >
              Get in touch
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
