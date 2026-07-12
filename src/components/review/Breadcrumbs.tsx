import Link from "next/link";
import JsonLd from "@/components/review/JsonLd";
import { SITE_URL } from "@/lib/site";

export interface Crumb {
  name: string;
  /** Site-relative path, e.g. "/category/sleep" */
  href: string;
}

/**
 * Visible breadcrumb trail + BreadcrumbList JSON-LD.
 * The final crumb is rendered as the current page (unlinked).
 */
export default function Breadcrumbs({
  items,
  className = "",
}: {
  items: Crumb[];
  className?: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <JsonLd data={jsonLd} />
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-brand-ink/60">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {i > 0 && (
                <span aria-hidden="true" className="text-brand-ink/40">
                  /
                </span>
              )}
              {isLast ? (
                <span aria-current="page" className="font-semibold text-brand-navy">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-brand-blue hover:underline"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
