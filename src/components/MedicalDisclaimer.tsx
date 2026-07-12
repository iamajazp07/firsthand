/**
 * Standard medical disclaimer for the bottom of health articles.
 */
export default function MedicalDisclaimer({
  className = "",
}: {
  className?: string;
}) {
  return (
    <aside
      aria-label="Medical disclaimer"
      className={`rounded-lg border border-brand-mist bg-brand-mist/50 px-4 py-3 text-sm leading-relaxed text-brand-ink/80 ${className}`}
    >
      <strong className="font-semibold text-brand-navy">
        Medical disclaimer:
      </strong>{" "}
      This content is for informational purposes only and is not medical
      advice. It is not intended to diagnose, treat, cure, or prevent any
      disease. Consult a healthcare professional before starting any
      supplement, treatment, or program — especially if you are pregnant,
      nursing, taking medication, or managing a health condition.
    </aside>
  );
}
