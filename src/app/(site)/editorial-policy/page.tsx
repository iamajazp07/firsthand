import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description:
    "Firsthand's editorial standards: primary-source research (PubMed, NIH, FDA), no disease-cure claims, a corrections policy, human review before publishing, and mandatory medical review for health money pages.",
  alternates: { canonical: "/editorial-policy" },
};

export default function EditorialPolicyPage() {
  return (
    <>
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            Editorial
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
            Editorial Policy
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-brand-ink/80">
            The standards every piece of Firsthand content must meet before it
            is published.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-4 text-base leading-relaxed text-brand-ink/90">
          <h2 className="font-serif text-2xl font-bold text-brand-navy">
            Sourcing standards
          </h2>
          <p>
            Health claims on Firsthand must trace to primary sources. In order
            of preference, we cite:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="font-semibold">
                Peer-reviewed research indexed on PubMed
              </strong>{" "}
              — randomized controlled trials and systematic reviews first,
              then observational studies.
            </li>
            <li>
              <strong className="font-semibold">
                NIH resources and trial registries
              </strong>{" "}
              — including ClinicalTrials.gov and the NIH Office of Dietary
              Supplements fact sheets.
            </li>
            <li>
              <strong className="font-semibold">FDA materials</strong> —
              approvals, warning letters, recalls, and safety communications.
            </li>
          </ul>
          <p>
            Manufacturer websites, press releases, and influencer content are
            never used as evidence for a health claim. When a study is funded
            by the product&apos;s maker, we disclose that in the article.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            No disease-cure claims
          </h2>
          <p>
            Firsthand never states or implies that a supplement or wellness
            product diagnoses, treats, cures, or prevents any disease. We
            describe what published research found — including its limits —
            and nothing more. Content that can&apos;t meet this standard
            doesn&apos;t get published.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Human review before publishing
          </h2>
          <p>
            Every article is reviewed by a human editor before publication —
            no piece of content goes live automatically. Editors check claims
            against the cited sources, verify links, and confirm the article
            meets this policy.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Editorial fact-check for health money pages
          </h2>
          <p>
            Any monetized page that makes health-related claims — product
            rankings, reviews, and comparisons — must additionally be
            fact-checked by our editorial team before publication. The team
            checks that claims match the cited evidence, that safety
            information is complete and fairly presented, and that the page
            contains no implied medical advice. Pages that haven&apos;t passed
            this fact-check don&apos;t carry the &quot;fact-checked&quot; badge,
            and money pages aren&apos;t published without it. We do not employ a
            licensed medical reviewer, and we do not describe our editorial
            fact-check as medical review or medical advice.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Sponsored relationships
          </h2>
          <p>
            Firsthand earns affiliate commissions, disclosed prominently on
            every page that contains affiliate links and explained in full in
            our{" "}
            <Link
              href="/affiliate-disclosure"
              className="font-semibold text-brand-blue hover:underline"
            >
              affiliate disclosure
            </Link>
            . Sponsors and affiliate partners have no access to content before
            publication, no input into scores or rankings, and no ability to
            request removal of unfavorable information. We do not publish
            paid-placement &quot;reviews.&quot; If we ever run clearly-labeled
            sponsored content, it will be visually distinct from editorial
            content and excluded from rankings.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Corrections policy
          </h2>
          <p>
            When we get something wrong, we fix it quickly and visibly.
            Material errors — a wrong dose, a misread study, an outdated
            safety warning — are corrected in the article, and the page&apos;s
            last-updated date reflects the change. Significant corrections are
            noted in the article itself. To report an error, use our{" "}
            <Link
              href="/contact"
              className="font-semibold text-brand-blue hover:underline"
            >
              contact page
            </Link>
            ; we review every report.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Keeping content current
          </h2>
          <p>
            Health evidence moves. Rankings and reviews display a last-updated
            date, and we re-examine pages when new trials publish, products
            reformulate, prices change materially, or regulators act. Our
            scoring rubric is published on the{" "}
            <Link
              href="/health/methodology"
              className="font-semibold text-brand-blue hover:underline"
            >
              methodology page
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
