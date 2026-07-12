import EmailSignup from "@/components/EmailSignup";

/**
 * Compact newsletter call-to-action placed above the footer on hub and spoke
 * pages. Uses the reusable <EmailSignup> with source "article".
 */
export default function ArticleNewsletterCta({
  className = "",
}: {
  className?: string;
}) {
  return (
    <section
      aria-label="Newsletter signup"
      className={`rounded-lg border border-brand-mist bg-brand-mist/50 px-5 py-6 sm:px-6 ${className}`}
    >
      <h2 className="font-serif text-lg font-bold text-brand-navy">
        Get evidence-based health picks in your inbox — no hype.
      </h2>
      <p className="mt-1 text-sm text-brand-ink/75">
        Join The Vivahale Brief for a weekly, research-first read.
      </p>
      <EmailSignup source="article" variant="compact" className="mt-4" />
    </section>
  );
}
