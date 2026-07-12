import EmailSignup from "@/components/EmailSignup";
import { getActiveVertical } from "@/lib/verticals";

/**
 * Compact newsletter call-to-action placed above the footer on hub and spoke
 * pages. Uses the reusable <EmailSignup> with source "article". Heading + blurb
 * come from the active vertical config (Health output byte-identical).
 */
export default function ArticleNewsletterCta({
  className = "",
}: {
  className?: string;
}) {
  const { newsletter } = getActiveVertical();
  return (
    <section
      aria-label="Newsletter signup"
      className={`rounded-lg border border-brand-mist bg-brand-mist/50 px-5 py-6 sm:px-6 ${className}`}
    >
      <h2 className="font-serif text-lg font-bold text-brand-navy">
        {newsletter?.ctaHeading ??
          "Get evidence-based health picks in your inbox — no hype."}
      </h2>
      <p className="mt-1 text-sm text-brand-ink/75">
        {newsletter?.ctaBlurb ??
          "Join The Vivahale Brief for a weekly, research-first read."}
      </p>
      <EmailSignup source="article" variant="compact" className="mt-4" />
    </section>
  );
}
