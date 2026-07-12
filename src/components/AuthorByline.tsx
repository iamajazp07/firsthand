import Link from "next/link";
import InitialsAvatar from "@/components/InitialsAvatar";
import type { Author } from "@/lib/types";

/**
 * Compact author byline for article pages: small avatar + "By {name}"
 * linking to the author's bio page at /authors/[slug].
 */
export default function AuthorByline({
  author,
  className = "",
}: {
  author: Author;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <InitialsAvatar name={author.name} size={28} className="shrink-0" />
      <span className="text-sm text-brand-ink/80">
        By{" "}
        <Link
          href={`/authors/${author.slug}`}
          className="font-semibold text-brand-navy hover:text-brand-blue hover:underline"
        >
          {author.name}
        </Link>
      </span>
    </div>
  );
}
