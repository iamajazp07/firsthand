import Link from "next/link";

/**
 * Compact, always-visible affiliate disclosure banner for monetized pages.
 * Place ABOVE the fold on any page containing affiliate links. Intentionally
 * not dismissible and never hidden behind a toggle (FTC clear-and-conspicuous
 * standard).
 */
export default function AffiliateDisclosure({
  className = "",
}: {
  className?: string;
}) {
  return (
    <aside
      aria-label="Affiliate disclosure"
      className={`border-l-4 border-brand-navy bg-brand-mist px-4 py-3 text-sm leading-relaxed text-brand-ink/90 ${className}`}
    >
      Vivahale is reader-supported. We earn a commission if you buy through
      links on this page — at no extra cost to you. Commissions never influence
      our rankings.{" "}
      <Link
        href="/affiliate-disclosure"
        className="font-semibold text-brand-blue hover:underline"
      >
        Learn how we make money.
      </Link>
    </aside>
  );
}
