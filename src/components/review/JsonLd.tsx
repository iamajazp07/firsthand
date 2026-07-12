/**
 * Renders a JSON-LD structured-data <script> tag. Escapes "<" to prevent
 * XSS via JSON.stringify (per the Next.js JSON-LD guide).
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
