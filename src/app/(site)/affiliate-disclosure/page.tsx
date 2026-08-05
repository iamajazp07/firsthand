import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description:
    "How Firsthand makes money: affiliate commissions from programs like ClickBank and telehealth partner programs — disclosed plainly, with rankings that commissions never influence.",
  alternates: { canonical: "/affiliate-disclosure" },
};

export default function AffiliateDisclosurePage() {
  return (
    <>
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            Disclosure
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
            Affiliate Disclosure
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-brand-ink/80">
            How Firsthand makes money, in plain English.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-4 text-base leading-relaxed text-brand-ink/90">
          <p>
            Firsthand is reader-supported. When you click certain links on this
            site and buy a product or sign up for a service, we may earn a
            commission from the seller. You never pay more because of this —
            the commission comes out of the seller&apos;s side of the
            transaction, not yours.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Where our commissions come from
          </h2>
          <p>
            Our affiliate relationships currently include, and may in the
            future include:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="font-semibold">Affiliate networks</strong>{" "}
              such as ClickBank, which handle tracking and payment for many
              supplement and wellness product makers.
            </li>
            <li>
              <strong className="font-semibold">
                Telehealth partner programs
              </strong>{" "}
              run directly by telehealth providers, which pay a referral fee
              when a reader signs up for their service through our links.
            </li>
            <li>
              <strong className="font-semibold">
                Direct brand partnerships
              </strong>{" "}
              with individual product makers, on the same terms: a commission
              on purchases made through our links.
            </li>
          </ul>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            What commissions do — and don&apos;t — affect
          </h2>
          <p>
            Commissions pay for the research time, editorial work, and medical
            review behind this site. They do not buy placement. Specifically:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Our{" "}
              <Link
                href="/health/methodology"
                className="font-semibold text-brand-blue hover:underline"
              >
                published methodology
              </Link>{" "}
              scores every product on the same five criteria, and scoring is
              finished before monetization is considered.
            </li>
            <li>
              We rank and review products we earn nothing from. If a
              non-partner product is the best in its category, it ranks first.
            </li>
            <li>
              No company can pay to change a score, remove a con, or suppress a
              red flag.
            </li>
            <li>
              Losing (or gaining) an affiliate relationship does not move a
              product up or down a ranking.
            </li>
          </ul>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            How you&apos;ll know
          </h2>
          <p>
            In line with the FTC&apos;s endorsement guides, every page that
            contains affiliate links carries a clear disclosure banner near the
            top of the page — before the links themselves — so you know the
            relationship exists before you click. We don&apos;t hide
            disclosures in footers, tooltips, or collapsed sections.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Questions
          </h2>
          <p>
            If anything about how we make money is unclear, ask us directly via
            our{" "}
            <Link
              href="/contact"
              className="font-semibold text-brand-blue hover:underline"
            >
              contact page
            </Link>
            . We&apos;d rather over-explain than leave doubt.
          </p>
        </div>
      </section>
    </>
  );
}
