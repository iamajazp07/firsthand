import { getActiveVertical } from "@/lib/verticals";

/**
 * Content disclaimer for the bottom of articles / money pages. The label and
 * body are driven by the ACTIVE vertical config, so Health renders the medical
 * disclaimer ("Medical disclaimer: … not medical advice …") byte-identically to
 * before, while Money renders the not-financial-advice disclaimer instead.
 *
 * (The component keeps its historical name/import path so no page has to change;
 * it is the single content-disclaimer surface for every vertical.)
 */
export default function MedicalDisclaimer({
  className = "",
}: {
  className?: string;
}) {
  const { contentDisclaimer, contentDisclaimerLabel } = getActiveVertical();
  const label = contentDisclaimerLabel ?? "Disclaimer";
  return (
    <aside
      aria-label={label}
      className={`rounded-lg border border-brand-mist bg-brand-mist/50 px-4 py-3 text-sm leading-relaxed text-brand-ink/80 ${className}`}
    >
      <strong className="font-semibold text-brand-navy">{label}:</strong>{" "}
      {contentDisclaimer}
    </aside>
  );
}
