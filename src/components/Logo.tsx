import Link from "next/link";
import LogoMark from "@/components/LogoMark";

/**
 * Firsthand logo — the Ridgeline symbol followed by the wordmark.
 * "First" in brand navy + "hand" in link blue, set in the serif headline face.
 *
 * When the vertical brands as "Firsthand <Suffix>" (e.g. "Firsthand Health"),
 * the suffix renders as a lighter companion word after the wordmark, so the
 * header reads naturally as "Firsthand Health". The apex portal ("Firsthand")
 * shows the bare wordmark with no suffix.
 *
 * Branding arrives as a prop because a single build now serves every vertical —
 * it can no longer be read from a module constant. The logo links to the
 * vertical's own home (`/health`), not the network root.
 */
export default function Logo({
  brandName,
  verticalKey,
  className = "",
}: {
  brandName: string;
  verticalKey: string;
  className?: string;
}) {
  const suffix = brandName.replace(/^Firsthand\s*/i, "").trim();
  const href = verticalKey === "portal" ? "/" : `/${verticalKey}`;

  return (
    <Link
      href={href}
      aria-label={`${brandName} home`}
      className={`flex items-center gap-2 font-serif text-2xl font-bold tracking-tight ${className}`}
    >
      <LogoMark className="h-7 w-7 shrink-0" />
      <span>
        <span className="text-brand-navy">First</span>
        <span className="text-brand-blue">hand</span>
      </span>
      {suffix && (
        <span className="text-lg font-semibold text-brand-ink/70">
          {suffix}
        </span>
      )}
    </Link>
  );
}
