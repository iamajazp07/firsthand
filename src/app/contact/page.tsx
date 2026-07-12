import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Vivahale — questions, corrections, partnership inquiries, or feedback on our health and wellness reviews.",
  alternates: { canonical: "/contact" },
};

// NOTE: hello@vivahale.com is a PLACEHOLDER address — swap it for the real
// inbox once email for the domain is set up. The form below is UI only and
// is not wired to a backend yet (wiring arrives in a later step).
const CONTACT_EMAIL = "hello@vivahale.com";

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            Contact
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
            Contact Vivahale
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-brand-ink/80">
            Questions about a review, a correction to report, or a partnership
            inquiry — we read everything.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-4 text-base leading-relaxed text-brand-ink/90">
          <h2 className="font-serif text-2xl font-bold text-brand-navy">
            Email us
          </h2>
          <p>
            The fastest way to reach us is email:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-brand-blue hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            . For corrections, please include the page URL and the specific
            claim you believe is wrong — we review every correction report
            under our editorial policy.
          </p>
        </div>

        <div className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-brand-navy">
            Or send a message
          </h2>
          {/* Form is intentionally not wired to a backend yet — UI only. */}
          <form className="mt-6 space-y-5" aria-label="Contact form">
            <div>
              <label
                htmlFor="contact-name"
                className="block text-sm font-semibold text-brand-navy"
              >
                Name
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                className="mt-1.5 w-full rounded-md border border-brand-mist bg-white px-3 py-2 text-sm text-brand-ink placeholder:text-brand-ink/40 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <div>
              <label
                htmlFor="contact-email"
                className="block text-sm font-semibold text-brand-navy"
              >
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-md border border-brand-mist bg-white px-3 py-2 text-sm text-brand-ink placeholder:text-brand-ink/40 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <div>
              <label
                htmlFor="contact-message"
                className="block text-sm font-semibold text-brand-navy"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={6}
                placeholder="How can we help?"
                className="mt-1.5 w-full rounded-md border border-brand-mist bg-white px-3 py-2 text-sm text-brand-ink placeholder:text-brand-ink/40 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <button
              type="button"
              disabled
              title="Form submission is not wired up yet"
              className="rounded-md bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white opacity-60"
            >
              Send message
            </button>
            <p className="text-xs text-brand-ink/60">
              This form isn&apos;t connected yet — please use the email address
              above for now.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
