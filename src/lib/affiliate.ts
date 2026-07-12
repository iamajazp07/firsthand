/**
 * Affiliate-link helpers.
 *
 * Monetized products carry the literal placeholder string below in
 * `affiliate_url` until real affiliate programs are wired (a later step).
 * NEVER ship a real link from this file's constants.
 */

export const AFFILIATE_PLACEHOLDER = "VIVAHALE_AFFILIATE_PLACEHOLDER";

/** Attribute value required on every monetized outbound CTA. */
export const AFFILIATE_REL = "sponsored nofollow noopener";

export function isAffiliatePlaceholder(url: string | null): boolean {
  return url === AFFILIATE_PLACEHOLDER;
}

/**
 * Resolve the href for a monetized CTA. Placeholder (or missing) URLs render
 * as "#" so the button exists visually without linking anywhere real.
 */
export function affiliateHref(url: string | null): string {
  if (!url || isAffiliatePlaceholder(url)) return "#";
  return url;
}
