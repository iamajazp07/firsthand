/**
 * PrimarySourceNote — a mist box rendered near the top of `type: news`
 * articles at /articles/[slug]. It makes the editorial contract explicit:
 * Firsthand news pieces are ORIGINAL analysis of a primary-source announcement,
 * and the reader should always read the source themselves.
 *
 * It links the trigger primary source prominently. The trigger is, by
 * convention, the FIRST source on the article (the news brief instructs authors
 * to lead with it), with a graceful fallback to a generic note when no source
 * has a usable http(s) URL.
 */
export default function PrimarySourceNote({
  source,
  className = "",
}: {
  /** The trigger primary source (name + url). */
  source?: { name: string; url: string } | null;
  className?: string;
}) {
  const hasLink =
    source && /^https?:\/\//i.test((source.url ?? "").trim());

  return (
    <aside
      aria-label="Primary source note"
      className={`rounded border border-brand-mist bg-brand-mist/60 px-4 py-3 text-sm leading-relaxed text-brand-ink/85 ${className}`}
    >
      <span className="font-semibold text-brand-navy">Primary source:</span>{" "}
      {hasLink ? (
        <a
          href={source!.url}
          target="_blank"
          rel="noopener nofollow"
          className="font-semibold text-brand-blue hover:underline"
        >
          {source!.name || source!.url}
        </a>
      ) : (
        <span className="italic">see the linked sources below</span>
      )}{" "}
      — Firsthand analysis is original commentary; always read the source.
    </aside>
  );
}
