/**
 * GEO/AI-citation summary box: a visually distinct, self-contained answer
 * paragraph (target 130–170 words) placed at the top of hubs and major
 * sections so search engines and AI assistants can lift a complete answer.
 */
export default function AnswerBlock({
  text,
  title = "Quick answer",
  className = "",
}: {
  /** A 130–170 word self-contained answer paragraph. */
  text: string;
  title?: string;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={`border-t-4 border-brand-navy bg-brand-mist px-5 py-4 sm:px-6 sm:py-5 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
        {title}
      </p>
      <p className="mt-2 text-base leading-relaxed text-brand-ink">{text}</p>
    </section>
  );
}
