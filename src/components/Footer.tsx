import Link from "next/link";
import LogoMark from "@/components/LogoMark";
import { getVertical } from "@/lib/verticals";
import { sharedHref, vHref } from "@/lib/site";

export default function Footer({
  verticalKey,
  categories: activeCategories,
}: {
  verticalKey: string;
  categories?: Array<{ name: string; slug: string }>;
}) {
  const vertical = getVertical(verticalKey);
  const isPortal = verticalKey === "portal";
  const base = isPortal ? "" : vHref(verticalKey).replace(/\/$/, "");
  const categories = activeCategories ?? vertical.navCategories;

  /**
   * Network-wide policy pages — one canonical copy each, on the apex. These
   * have to be built per-render rather than at module scope: a vertical on its
   * own subdomain (Health) needs them as absolute apex URLs, since a
   * root-relative `/privacy` would 404 on that host.
   */
  const legalLinks = [
    { name: "Privacy", href: sharedHref(verticalKey, "/privacy") },
    { name: "Terms", href: sharedHref(verticalKey, "/terms") },
    {
      name: "Affiliate Disclosure",
      href: sharedHref(verticalKey, "/affiliate-disclosure"),
    },
  ];

  // Methodology documents THIS vertical's rating criteria, so it is
  // vertical-scoped; the rest are network-wide and live at the root.
  const companyLinks = [
    { name: "About", href: sharedHref(verticalKey, "/about") },
    { name: "Editorial Policy", href: sharedHref(verticalKey, "/editorial-policy") },
    ...(isPortal
      ? []
      : [{ name: "Methodology", href: `${base}/methodology` }]),
    { name: "Contact", href: sharedHref(verticalKey, "/contact") },
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
              {legalLinks.map((l) => (
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
