import Link from "next/link";

/**
 * News-style article card for "Latest Analysis" grids.
 * href is a placeholder route for now — article pages arrive in a later step.
 */
export default function ArticleCard({
  title,
  category,
  excerpt,
  byline,
  href = "#",
}: {
  title: string;
  category: string;
  excerpt: string;
  byline?: string;
  href?: string;
}) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-brand-mist bg-white p-5 transition-shadow hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
        {category}
      </p>
      <h3 className="mt-2 font-serif text-lg font-bold leading-snug text-brand-navy">
        <Link href={href} className="hover:underline">
          {title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-ink/80">
        {excerpt}
      </p>
      {byline && (
        <p className="mt-4 text-xs text-slate-500">By {byline}</p>
      )}
    </article>
  );
}
