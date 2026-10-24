import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Firsthand's terms of use, including our not-medical-advice clause, intellectual property terms, and limitation of liability.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            Legal
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
            Terms of Use
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-brand-ink/80">
            Last updated: July 11, 2026
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-4 text-base leading-relaxed text-brand-ink/90">
          <p>
            By using readfirsthand.com (&quot;the Site&quot;), you agree to these
            terms. If you don&apos;t agree, please don&apos;t use the Site.
          </p>

          {/* Prominent not-medical-advice clause */}
          <div className="rounded-lg border-l-4 border-brand-navy bg-brand-mist px-5 py-4">
            <h2 className="font-serif text-xl font-bold text-brand-navy">
              Not medical advice
            </h2>
            <p className="mt-2">
              Firsthand content (including every ranking, review, comparison, and article) is provided for general informational purposes
              only. It is <strong className="font-semibold">not</strong>{" "}
              medical advice, and it is not a substitute for diagnosis,
              treatment, or guidance from a qualified healthcare professional.
              Never disregard professional medical advice, or delay seeking
              it, because of something you read on this Site. Always consult
              your physician or another qualified provider before starting a
              supplement, treatment, or health program. If you think you may
              have a medical emergency, call your doctor or emergency services
              immediately.
            </p>
          </div>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Use of the Site
          </h2>
          <p>
            You may use the Site for personal, non-commercial purposes. You
            agree not to scrape the Site at scale, misrepresent Firsthand
            content as your own, interfere with the Site&apos;s operation, or
            use the Site for anything unlawful.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Content and intellectual property
          </h2>
          <p>
            The Site&apos;s content (text, rankings, scores, graphics, and design) is owned by Firsthand and protected by copyright. You may
            quote brief excerpts with attribution and a link; republishing
            whole articles or rankings requires our written permission.
            Third-party trademarks and product names mentioned on the Site
            belong to their respective owners; mentioning them does not imply
            their endorsement of Firsthand.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Affiliate links and third-party sites
          </h2>
          <p>
            The Site contains links to third-party websites, some of which pay
            us a commission on purchases, as described in our{" "}
            <Link
              href="/affiliate-disclosure"
              className="font-semibold text-brand-blue hover:underline"
            >
              affiliate disclosure
            </Link>
            . We don&apos;t control third-party sites and aren&apos;t
            responsible for their content, products, pricing, or policies.
            Any purchase you make is a transaction between you and the seller.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            No warranties
          </h2>
          <p>
            We work hard to keep the Site accurate and current, but it is
            provided &quot;as is&quot; and &quot;as available,&quot; without
            warranties of any kind, express or implied. Research evolves,
            products reformulate, and prices change; we don&apos;t guarantee
            that any piece of content is complete, current, or error-free.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Limitation of liability
          </h2>
          <p>
            To the fullest extent permitted by law, Firsthand and its
            contributors are not liable for any damages arising from your use
            of the Site or reliance on its content, including decisions about
            products, services, or health made on the basis of information
            found here.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Changes to these terms
          </h2>
          <p>
            We may update these terms from time to time; the date at the top
            of this page reflects the latest revision. Continued use of the
            Site after changes take effect constitutes acceptance of the
            revised terms.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Contact
          </h2>
          <p>
            Questions about these terms? Reach us through our{" "}
            <Link
              href="/contact"
              className="font-semibold text-brand-blue hover:underline"
            >
              contact page
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
