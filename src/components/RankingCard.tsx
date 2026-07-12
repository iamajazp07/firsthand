import Link from "next/link";

/**
 * "Top Rankings" card — placeholder for ranked money pages (later steps).
 */
export default function RankingCard({
  title,
  category,
  blurb,
  href = "#",
}: {
  title: string;
  category: string;
  blurb: string;
  href?: string;
}) {
  return (
    <article className="flex h-full flex-col rounded-lg bg-brand-mist p-6 transition-shadow hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
        {category}
      </p>
      <h3 className="mt-2 font-serif text-xl font-bold leading-snug text-brand-navy">
        <Link href={href} className="hover:underline">
          {title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-ink/80">
        {blurb}
      </p>
      <p className="mt-4 text-sm font-semibold text-brand-blue">
        See the rankings →
      </p>
    </article>
  );
}
