import Link from "next/link";

/**
 * Vivahale wordmark — original text-based logo.
 * "Viva" in brand navy + "hale" in link blue, set in the serif headline face.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Vivahale home"
      className={`font-serif text-2xl font-bold tracking-tight ${className}`}
    >
      <span className="text-brand-navy">Viva</span>
      <span className="text-brand-blue">hale</span>
    </Link>
  );
}
