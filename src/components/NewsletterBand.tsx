import EmailSignup from "@/components/EmailSignup";
import { getActiveVertical } from "@/lib/verticals";

/**
 * Homepage newsletter signup band. The `id="newsletter"` anchor is the scroll
 * target for the header "Subscribe" button (/#newsletter). Form submission is
 * handled by the reusable <EmailSignup> client component (POST /api/subscribe).
 *
 * Brand name + blurb come from the active vertical config so Money shows
 * "The Vivahale Money Brief" with money copy; Health output is byte-identical.
 */
export default function NewsletterBand() {
  const { newsletter } = getActiveVertical();
  return (
    <section id="newsletter" className="scroll-mt-20 bg-brand-navy">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:justify-between">
        <div className="text-center lg:text-left">
          <h2 className="font-serif text-2xl font-bold text-white">
            {newsletter?.brandName ?? "The Vivahale Brief"}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-white/80">
            {newsletter?.bandBlurb ??
              "One weekly email: what the newest health research actually says, and which products hold up. No hype, no spam."}
          </p>
        </div>
        <EmailSignup source="homepage" variant="band" className="w-full max-w-md" />
      </div>
    </section>
  );
}
