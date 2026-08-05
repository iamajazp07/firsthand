import Link from "next/link";

/**
 * Tasteful callout card linking to the sleep-supplement quiz. Shown on the
 * Sleep category page and the sleep supplements hub.
 */
export default function SleepQuizCallout({
  className = "",
  verticalKey,
}: {
  className?: string;
  /** Which vertical this renders inside — links and config come from it. */
  verticalKey: string;
}) {
  return (
    <div
      className={`flex flex-col items-start justify-between gap-4 rounded-lg border border-brand-blue/25 bg-brand-blue/5 px-5 py-5 sm:flex-row sm:items-center sm:px-6 ${className}`}
    >
      <div>
        <p className="font-serif text-lg font-bold text-brand-navy">
          Not sure where to start?
        </p>
        <p className="mt-1 text-sm text-brand-ink/75">
          Take the 60-second sleep quiz and get a research-backed pick for your
          situation.
        </p>
      </div>
      <Link
        href={`/${verticalKey}/quiz/sleep`}
        className="shrink-0 rounded-md bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue"
      >
        Take the sleep quiz →
      </Link>
    </div>
  );
}
