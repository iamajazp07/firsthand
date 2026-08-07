import Link from "next/link";
import LogoMark from "@/components/LogoMark";
import { getVertical } from "@/lib/verticals";

/**
 * Network-wide policy pages — one copy, shared by every vertical, living at the
 * site root. (Before path-based routing these were per-subdomain, and the portal
 * had to deep-link into health.readfirsthand.com for them.)
 */
const LEGAL_LINKS = [
  { name: "Privacy", href: "/privacy" },
  { name: "Terms", href: "/terms" },
  { name: "Affiliate Disclosure", href: "/affiliate-disclosure" },
];

export default function Footer({ verticalKey }: { verticalKey: string }) {
  const vertical = getVertical(verticalKey);
  const isPortal = verticalKey === "portal";
  const base = isPortal ? "" : `/${verticalKey}`;
  const categories = vertical.navCategories;

  // Methodology documents THIS vertical's rating criteria, so it is
  // vertical-scoped; the rest are network-wide and live at the root.
  const companyLinks = [
    { name: "About", href: "/about" },
    { name: "Editorial Policy", href: "/editorial-policy" },
    ...(isPortal
      ? []
      : [{ name: "Methodology", href: `${base}/methodology` }]),
    { name: "Contact", href: "/contact" },
  ];

  return (
    <footer className="bg-brand-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* Brand line — reversed tone, since the footer sits on brand navy. */}
        <div className="mb-10 flex items-center gap-2">
          <LogoMark className="h-7 w-7 shrink-0" tone="reversed" />
          <span className="font-serif text-2xl font-bold tracking-tight text-white">
            First<span className="text-blue-300">hand</span>
          </span>
        </div>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Categories — omitted for verticals without a category nav (portal). */}
          {categories.length > 0 && (
            <div>
              <h2 className="mb-4 font-sans text-sm font-semibold uppercase tracking-wider text-white/70">
                Categories
              </h2>
              <ul className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-1 lg:grid-cols-2">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`${base}/category/${c.slug}`}
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
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
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
                    href={l.href}
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
            {isPortal ? (
              <>© 2026 {vertical.name}. Independent, evidence-first reviews and
              rankings.</>
            ) : (
              // Content-vertical disclaimer from the vertical config:
              // health → "…not medical advice."; money → "…not financial advice."
              <>© 2026 Firsthand. {vertical.footerDisclaimer}</>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
