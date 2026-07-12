/**
 * "Last updated: {Month D, YYYY}" stamp for review/hub pages.
 * Formats in UTC so server and client always agree.
 */
export default function LastUpdated({
  date,
  className = "",
}: {
  /** ISO date string, e.g. "2026-07-10" */
  date: string;
  className?: string;
}) {
  const formatted = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  return (
    <span className={`text-sm text-brand-ink/70 ${className}`}>
      Last updated:{" "}
      <time dateTime={date} className="font-semibold text-brand-navy">
        {formatted}
      </time>
    </span>
  );
}
