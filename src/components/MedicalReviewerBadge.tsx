import Link from "next/link";
import type { Reviewer } from "@/lib/types";
import { vHref } from "@/lib/site";

/**
 * "Fact-checked by …" badge for health content, with a shield-check
 * icon and a link to the reviewer's bio page at /reviewers/[slug].
 *
 * If the reviewer record is still a placeholder (is_placeholder: true), a
 * small amber warning banner is rendered in non-production builds so the
 * team can't miss it — production builds render the badge normally.
 */
export default function MedicalReviewerBadge({
  reviewer,
  className = "",
  verticalKey,
}: {
  reviewer: Reviewer;
  className?: string;
  /** Which vertical this renders inside — links and config come from it. */
  verticalKey: string;
}) {
  // PLACEHOLDER REVIEWER — swap name/credential before publishing money pages.
  const showPlaceholderWarning =
    reviewer.is_placeholder && process.env.NODE_ENV !== "production";

  return (
    <div className={className}>
      {showPlaceholderWarning && (
        <p
          role="alert"
          className="mb-2 rounded border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800"
        >
          PLACEHOLDER REVIEWER: attach real reviewer before publishing
        </p>
      )}
      <div className="flex items-center gap-2 text-sm text-brand-ink/80">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0 text-brand-blue"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span>
          Fact-checked by{" "}
          <Link
            href={vHref(verticalKey, `/reviewers/${reviewer.slug}`)}
            className="font-semibold text-brand-navy hover:text-brand-blue hover:underline"
          >
            {reviewer.name}
          </Link>
        </span>
      </div>
    </div>
  );
}
