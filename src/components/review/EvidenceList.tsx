import type { EvidencePoint } from "@/lib/types";

/**
 * Inline-citation style evidence list: each claim is followed by a linked
 * source name (external links open in a new tab with rel="noopener").
 * Sources will be PubMed/NIH/FDA-grade in researched content.
 */
export default function EvidenceList({
  points,
  className = "",
}: {
  points: EvidencePoint[];
  className?: string;
}) {
  return (
    <ul className={`space-y-3 ${className}`}>
      {points.map((point) => (
        <li
          key={point.claim}
          className="border-l-2 border-brand-blue pl-4 text-sm leading-relaxed text-brand-ink/90"
        >
          {point.claim}{" "}
          <span className="whitespace-nowrap text-brand-ink/60">
            (
            <a
              href={point.source_url}
              target="_blank"
              rel="noopener"
              className="font-semibold text-brand-blue hover:underline"
            >
              {point.source_name}
            </a>
            )
          </span>
        </li>
      ))}
    </ul>
  );
}
