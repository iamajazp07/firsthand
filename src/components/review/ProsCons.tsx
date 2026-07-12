/**
 * Two-column pros/cons (stacked on mobile) with a distinct "Cons & red flags"
 * treatment — amber accents, warning icons — so honest critique is visually
 * prominent, never buried.
 */
export default function ProsCons({
  pros,
  cons,
  className = "",
}: {
  pros: string[];
  cons: string[];
  className?: string;
}) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
      {/* Pros */}
      <section className="rounded-lg border border-brand-mist bg-white p-5">
        <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-brand-navy">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0 text-brand-blue"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          Pros
        </h3>
        <ul className="mt-3 space-y-2.5">
          {pros.map((pro) => (
            <li key={pro} className="flex gap-2 text-sm leading-relaxed text-brand-ink/90">
              <span aria-hidden="true" className="mt-0.5 font-bold text-brand-blue">
                +
              </span>
              {pro}
            </li>
          ))}
        </ul>
      </section>

      {/* Cons & red flags */}
      <section className="rounded-lg border border-amber-300 bg-amber-50/60 p-5">
        <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-amber-900">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0 text-amber-600"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          Cons &amp; red flags
        </h3>
        <ul className="mt-3 space-y-2.5">
          {cons.map((con) => {
            const isRedFlag = con.toLowerCase().startsWith("red flag");
            return (
              <li
                key={con}
                className="flex gap-2 text-sm leading-relaxed text-brand-ink/90"
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 font-bold ${isRedFlag ? "text-red-600" : "text-amber-600"}`}
                >
                  {isRedFlag ? "⚑" : "−"}
                </span>
                <span>
                  {isRedFlag ? (
                    <>
                      <strong className="font-semibold text-red-700">
                        Red flag:
                      </strong>{" "}
                      {con.replace(/^red flag:\s*/i, "")}
                    </>
                  ) : (
                    con
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
