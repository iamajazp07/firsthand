import JsonLd from "@/components/review/JsonLd";
import type { FaqItem } from "@/lib/types";

/**
 * FAQ accordion (native <details>, no client JS) that also emits FAQPage
 * JSON-LD. Set emitJsonLd={false} on any additional FaqSection instances so
 * FAQPage structured data appears only ONCE per page.
 */
export default function FaqSection({
  items,
  title = "Frequently asked questions",
  emitJsonLd = true,
  className = "",
}: {
  items: FaqItem[];
  title?: string;
  /** Render FAQPage JSON-LD. Only one instance per page may emit it. */
  emitJsonLd?: boolean;
  className?: string;
}) {
  if (items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section aria-label={title} className={className}>
      {emitJsonLd && <JsonLd data={jsonLd} />}
      <h2 className="font-serif text-2xl font-bold text-brand-navy">{title}</h2>
      <div className="mt-4 divide-y divide-brand-mist rounded-lg border border-brand-mist bg-white">
        {items.map((item) => (
          <details key={item.question} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-brand-navy [&::-webkit-details-marker]:hidden">
              {item.question}
              <span
                aria-hidden="true"
                className="shrink-0 text-brand-blue transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brand-ink/80">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
