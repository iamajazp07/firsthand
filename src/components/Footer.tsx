import Link from "next/link";
import { NAV_CATEGORIES, IS_PORTAL, SITE_NAME } from "@/lib/site";
import { VERTICALS } from "@/lib/verticals";

const COMPANY_LINKS = [
  { name: "About", href: "/about" },
  { name: "Editorial Policy", href: "/editorial-policy" },
  { name: "Methodology", href: "/methodology" },
  { name: "Contact", href: "/contact" },
];

const LEGAL_LINKS = [
  { name: "Privacy", href: "/privacy" },
  { name: "Terms", href: "/terms" },
  { name: "Affiliate Disclosure", href: "/affiliate-disclosure" },
];

/**
 * These pages are health-specific (medical disclaimers, health editorial
 * policy). In portal context there is no local copy, so link out to the Health
 * subdomain's versions. In a content vertical they stay relative (byte-identical
 * to before). `href` is used verbatim for relative links and prefixed with the
 * health origin for the portal.
 */
const HEALTH_ORIGIN = `https://${VERTICALS.health.host}`;
function chromeHref(href: string): string {
  return IS_PORTAL ? `${HEALTH_ORIGIN}${href}` : href;
}

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Categories — omitted for verticals without a category nav (portal). */}
          {NAV_CATEGORIES.length > 0 && (
            <div>
              <h2 className="mb-4 font-sans text-sm font-semibold uppercase tracking-wider text-white/70">
                Categories
              </h2>
              <ul className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-1 lg:grid-cols-2">
                {NAV_CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/category/${c.slug}`}
                      className="text-sm text-white/90 hover:text-white hover:underline"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Company */}
          <div>
            <h2 className="mb-4 font-sans text-sm font-semibold uppercase tracking-wider text-white/70">
              Company
            </h2>
            <ul className="space-y-2">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={chromeHref(l.href)}
                    className="text-sm text-white/90 hover:text-white hover:underline"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h2 className="mb-4 font-sans text-sm font-semibold uppercase tracking-wider text-white/70">
              Legal
            </h2>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={chromeHref(l.href)}
                    className="text-sm text-white/90 hover:text-white hover:underline"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/20 pt-6">
          <p className="text-sm text-white/70">
            {IS_PORTAL ? (
              <>© 2026 {SITE_NAME}. Independent, evidence-first reviews and
              rankings.</>
            ) : (
              <>© 2026 Vivahale. Vivahale content is for informational
              purposes only and is not medical advice.</>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
