import { AFFILIATE_REL, affiliateHref, isAffiliatePlaceholder } from "@/lib/affiliate";

/**
 * Prominent affiliate CTA block for spoke pages (and hub per-product blurbs).
 *
 * - href uses the product's affiliate_url with rel="sponsored nofollow noopener".
 * - Tiny inline "(affiliate link)" label — always visible (FTC clarity).
 * - If affiliate_url is still the VIVAHALE_AFFILIATE_PLACEHOLDER string, the
 *   button renders visually but points to "#", and non-production builds show
 *   an amber "AFFILIATE LINK PLACEHOLDER" note (same pattern as
 *   MedicalReviewerBadge's placeholder warning).
 */
export default function AffiliateCta({
  name,
  affiliateUrl,
  className = "",
}: {
  /** Product/provider display name. */
  name: string;
  affiliateUrl: string | null;
  className?: string;
}) {
  const placeholder = isAffiliatePlaceholder(affiliateUrl) || !affiliateUrl;
  // AFFILIATE PLACEHOLDER — wire the real link before publishing money pages.
  const showPlaceholderNote =
    placeholder && process.env.NODE_ENV !== "production";

  return (
    <div
      className={`rounded-lg border border-brand-navy/10 bg-brand-mist p-5 text-center ${className}`}
    >
      {showPlaceholderNote && (
        <p
          role="alert"
          className="mb-3 rounded border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800"
        >
          AFFILIATE LINK PLACEHOLDER — wire real affiliate URL before launch
        </p>
      )}
      <a
        href={affiliateHref(affiliateUrl)}
        target={placeholder ? undefined : "_blank"}
        rel={AFFILIATE_REL}
        className="inline-block rounded bg-brand-blue px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-navy"
      >
        Check price at {name}
      </a>
      <p className="mt-2 text-xs text-brand-ink/60">(affiliate link)</p>
    </div>
  );
}
