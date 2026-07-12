import Link from "next/link";
import type { CriterionRatings } from "@/lib/types";
import { getActiveVertical } from "@/lib/verticals";

/**
 * Score displays for reviewed products.
 *
 * - Default export `RatingBadge`: circular (lg) or pill (sm) overall score,
 *   e.g. "8.6/10", in brand navy.
 * - Named export `RatingBreakdown`: the per-criterion variant — lists the
 *   ACTIVE vertical's methodology criteria (from `getActiveVertical().criteria`)
 *   with weight labels and bar indicators, linking to /methodology. This is a
 *   server component, so it reads the active vertical directly rather than
 *   taking the criteria as a prop.
 */
export default function RatingBadge({
  score,
  size = "md",
  className = "",
}: {
  /** Overall rating 0–10, one decimal. */
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const label = `Rated ${score.toFixed(1)} out of 10`;

  if (size === "lg") {
    return (
      <div
        role="img"
        aria-label={label}
        className={`flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 border-brand-blue bg-brand-navy text-white ${className}`}
      >
        <span className="font-serif text-3xl font-bold leading-none">
          {score.toFixed(1)}
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">
          / 10
        </span>
      </div>
    );
  }

  const sizing =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-flex items-center gap-1 rounded-full bg-brand-navy font-semibold text-white ${sizing} ${className}`}
    >
      {score.toFixed(1)}
      <span className="font-normal text-white/70">/10</span>
    </span>
  );
}

export function RatingBreakdown({
  ratings,
  className = "",
}: {
  ratings: CriterionRatings;
  className?: string;
}) {
  // Drive the breakdown from the active vertical's criteria (key order = weight
  // order). Weights are fractional (0.3) and rendered as whole-percent labels
  // ("30%") — matching the previous hardcoded strings exactly for Health.
  const criteria = getActiveVertical().criteria;
  return (
    <div className={`rounded-lg border border-brand-mist bg-white p-4 ${className}`}>
      <h3 className="font-serif text-sm font-bold text-brand-navy">
        Score breakdown
      </h3>
      <ul className="mt-3 space-y-2.5">
        {criteria.map(({ key, label, weight: weightFraction }) => {
          const weight = `${Math.round(weightFraction * 100)}%`;
          const value = ratings[key];
          return (
            <li key={key}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-semibold text-brand-ink">
                  {label}{" "}
                  <span className="font-normal text-brand-ink/60">
                    ({weight})
                  </span>
                </span>
                <span className="font-semibold text-brand-navy">
                  {value.toFixed(1)}/10
                </span>
              </div>
              <div
                role="img"
                aria-label={`${label}: ${value.toFixed(1)} out of 10`}
                className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-brand-mist"
              >
                <div
                  className="h-full rounded-full bg-brand-blue"
                  style={{ width: `${Math.max(0, Math.min(10, value)) * 10}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-brand-ink/70">
        Scored per{" "}
        <Link
          href="/methodology"
          className="font-semibold text-brand-blue hover:underline"
        >
          our review methodology
        </Link>
        .
      </p>
    </div>
  );
}
