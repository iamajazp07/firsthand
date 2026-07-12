import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

/**
 * Vivahale wordmark — text-based logo.
 * "Viva" in brand navy + "hale" in link blue, set in the serif headline face.
 *
 * Phase B: when the active vertical brands as "Vivahale <Suffix>" (e.g.
 * "Vivahale Health"), the suffix renders as a lighter companion word after the
 * wordmark, so the header reads naturally as "Vivahale Health". The apex portal
 * (SITE_NAME "Vivahale") shows the bare wordmark with no suffix.
 */
const BRAND_SUFFIX = SITE_NAME.replace(/^Vivahale\s*/i, "").trim();

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${SITE_NAME} home`}
      className={`flex items-baseline gap-1.5 font-serif text-2xl font-bold tracking-tight ${className}`}
    >
      <span>
        <span className="text-brand-navy">Viva</span>
        <span className="text-brand-blue">hale</span>
      </span>
      {BRAND_SUFFIX && (
        <span className="text-lg font-semibold text-brand-ink/70">
          {BRAND_SUFFIX}
        </span>
      )}
    </Link>
  );
}
