import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Vivahale's privacy policy: what we collect (analytics, email newsletter signups, cookies), how we use it, and the choices you have.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            Legal
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-brand-ink/80">
            Last updated: July 11, 2026
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-4 text-base leading-relaxed text-brand-ink/90">
          <p>
            This policy explains what information Vivahale
            (&quot;we,&quot; &quot;us&quot;) collects when you use
            vivahale.com, how we use it, and the choices you have. We keep it
            short because we collect little.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            What we collect
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="font-semibold">Analytics data.</strong> We use
              website analytics to understand which pages are read and how
              visitors find us — page views, referring sites, approximate
              (city-level) location, device and browser type. This data is
              aggregated; we don&apos;t use it to identify you personally.
            </li>
            <li>
              <strong className="font-semibold">Email address</strong> — only
              if you choose to join our newsletter. We record the address you
              provide and where on the site you signed up.
            </li>
            <li>
              <strong className="font-semibold">
                Messages you send us
              </strong>{" "}
              — if you contact us, we keep the message and your email so we can
              reply.
            </li>
          </ul>
          <p>
            We do not collect health information, and we do not ask for
            payment details — purchases made through links on this site happen
            on the seller&apos;s website under the seller&apos;s privacy
            policy.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Cookies
          </h2>
          <p>
            Vivahale uses a small number of cookies and similar technologies:
            analytics cookies that help us count visits, and affiliate-tracking
            parameters that let a seller credit a purchase to a link on this
            site (that&apos;s how we&apos;re paid — see our{" "}
            <Link
              href="/affiliate-disclosure"
              className="font-semibold text-brand-blue hover:underline"
            >
              affiliate disclosure
            </Link>
            ). You can block or delete cookies in your browser settings; the
            site works without them.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            How we use your information
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>To operate and improve the site.</li>
            <li>
              To send the newsletter you subscribed to. Every email includes a
              one-click unsubscribe link, and unsubscribing takes effect
              immediately.
            </li>
            <li>To respond when you contact us.</li>
          </ul>
          <p>
            We do not sell your personal information, and we do not share your
            email address with advertisers or affiliate partners.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Third-party services
          </h2>
          <p>
            We rely on a small set of service providers to run the site —
            hosting, analytics, and email delivery. They process data on our
            behalf under their own contractual and legal obligations. Links on
            Vivahale lead to third-party sites we don&apos;t control; their
            privacy practices are their own.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Your choices and rights
          </h2>
          <p>
            You can unsubscribe from emails at any time, browse with cookies
            blocked, and ask us to access or delete the personal information we
            hold about you (your newsletter email and any messages you&apos;ve
            sent). Depending on where you live, you may have additional rights
            under local privacy law — we honor deletion and access requests
            regardless of jurisdiction. To exercise any of these, use our{" "}
            <Link
              href="/contact"
              className="font-semibold text-brand-blue hover:underline"
            >
              contact page
            </Link>
            .
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Children
          </h2>
          <p>
            Vivahale is not directed at children under 13, and we do not
            knowingly collect their information.
          </p>

          <h2 className="pt-6 font-serif text-2xl font-bold text-brand-navy">
            Changes to this policy
          </h2>
          <p>
            If we change this policy, we&apos;ll update the date at the top of
            this page. Material changes will be noted prominently on the site.
          </p>
        </div>
      </section>
    </>
  );
}
