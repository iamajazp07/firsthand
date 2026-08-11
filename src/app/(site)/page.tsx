import type { Metadata } from "next";
import Link from "next/link";
import LogoMark from "@/components/LogoMark";
import { VERTICALS, contentVerticals } from "@/lib/verticals";
import { SITE_URL, verticalEntryHref, verticalUrl } from "@/lib/site";

/**
 * The readfirsthand.com brand portal — a lightweight hub that introduces the Firsthand
 * brand and links out to each live vertical (currently just Firsthand Health).
 *
 * Verticals are PATHS on this same origin now (`/health`, `/money`, …), not
 * separate subdomain deployments — so the cards below are plain internal links
 * and there is no local-preview port map to thread through any more.
 *
 * Adding a future vertical card is just adding a config entry to the VERTICALS
 * registry — the grid below is driven off `contentVerticals()`.
 */

const portal = VERTICALS.portal;
const PORTAL_URL = SITE_URL;

export const metadata: Metadata = {
  title: { absolute: `${portal.name} — ${portal.tagline}` },
  description: portal.description,
  // Absolute canonical/OG so the values are correct even in a health-mode build
  // whose metadataBase points at the health host.
  alternates: { canonical: PORTAL_URL },
  openGraph: {
    siteName: portal.name,
    type: "website",
    url: PORTAL_URL,
    title: `${portal.name} — ${portal.tagline}`,
    description: portal.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${portal.name} — ${portal.tagline}`,
    description: portal.description,
  },
  robots: { index: true, follow: true },
};

/** WebSite JSON-LD scoped to the portal (its own @id/url, not a vertical's). */
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${PORTAL_URL}/#website`,
  name: portal.name,
  url: PORTAL_URL,
  description: portal.description,
};

/**
 * Card link for a vertical — a root-relative path on this origin.
 * The label shows the URL the reader will land on, e.g. "readfirsthand.com/health".
 */
function cardLink(key: string): { url: string; label: string } {
  return {
    url: verticalEntryHref(key),
    // Derive the label from the real URL so a vertical on its own subdomain
    // advertises "health.readfirsthand.com", not "readfirsthand.com/health".
    label: verticalUrl(key).replace(/^https?:\/\//, ""),
  };
}

export default function PortalPage() {
  const verticals = contentVerticals();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* Hero */}
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:py-28">
          <LogoMark className="mx-auto mb-6 h-14 w-14" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue">
            The Firsthand network
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight text-brand-navy sm:text-5xl lg:text-6xl">
            Independent, evidence-first reviews and rankings.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-brand-ink/80">
            {portal.description}
          </p>
        </div>
      </section>

      {/* Verticals */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="font-serif text-2xl font-bold text-brand-navy">
          Explore our sites
        </h2>
        <p className="mt-2 text-sm text-brand-ink/70">
          Each Firsthand site applies the same evidence-first standards to its own
          field.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {verticals.map((v) => {
            const { url, label } = cardLink(v.key);
            return (
              <Link
                key={v.key}
                href={url}
                className="group flex flex-col rounded-lg border border-brand-navy/10 bg-white p-6 shadow-sm transition hover:border-brand-blue/40 hover:shadow-md"
              >
                <h3 className="font-serif text-xl font-bold text-brand-navy">
                  {v.name}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-ink/80">
                  {v.tagline}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue group-hover:underline">
                  Visit {label}
                  <span aria-hidden="true">→</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
