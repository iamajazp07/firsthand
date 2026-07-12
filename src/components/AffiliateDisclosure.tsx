import Link from "next/link";
import { getActiveVertical } from "@/lib/verticals";

/**
 * Compact, always-visible monetization disclosure banner for monetized pages.
 * Place ABOVE the fold on any page containing affiliate/partner links.
 * Intentionally not dismissible and never hidden behind a toggle (FTC
 * clear-and-conspicuous standard).
 *
 * The label + body come from the ACTIVE vertical config so each vertical shows
 * the right copy: Health → "Affiliate disclosure" (reader-supported commission
 * language); Money → "Advertiser Disclosure" (advertiser-compensation language
 * that never affects rankings). Health output is byte-identical to before.
 */
export default function AffiliateDisclosure({
  className = "",
}: {
  className?: string;
}) {
  const { disclosureLabel, disclosureBody } = getActiveVertical();
  return (
    <aside
      aria-label={disclosureLabel}
      className={`border-l-4 border-brand-navy bg-brand-mist px-4 py-3 text-sm leading-relaxed text-brand-ink/90 ${className}`}
    >
      {disclosureBody}{" "}
      <Link
        href="/affiliate-disclosure"
        className="font-semibold text-brand-blue hover:underline"
      >
        Learn how we make money.
      </Link>
    </aside>
  );
}
