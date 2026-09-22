import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { countryLabel, listNews, newsCountries } from "@/lib/news";
import { getVertical, isVerticalKey } from "@/lib/verticals";
import { vHref, verticalUrl } from "@/lib/site";

/**
 * The primary-source tracker index.
 *
 * Dynamic because the fetcher rewrites the store every 15 minutes and this
 * page must reflect that without a rebuild — the same reason the category
 * pages are force-dynamic for runtime-published queue articles.
 */
export const dynamic = "force-dynamic";

const PAGE_SIZE = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string }>;
}): Promise<Metadata> {
  const { vertical: verticalKey } = await params;
  if (!isVerticalKey(verticalKey)) return {};
  const vertical = getVertical(verticalKey);
  // The vertical layout applies the template `${v.name} — %s`, so naming the
  // vertical here too produced "Firsthand Money — Firsthand Money — ...".
  const title = "Official announcements tracker";
  const description =
    `Every official announcement we track for ${vertical.name.toLowerCase()}, ` +
    `from the regulators and agencies that issue them, with a link to each ` +
    `primary source. Updated continuously.`;
  return {
    title,
    description,
    alternates: { canonical: verticalUrl(verticalKey, "/news") },
    openGraph: { title, description, type: "website" },
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
}

export default async function NewsIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ vertical: string }>;
  searchParams: Promise<{ country?: string }>;
}) {
  const { vertical: verticalKey } = await params;
  if (!isVerticalKey(verticalKey) || verticalKey === "portal") notFound();

  const { country } = await searchParams;
  const vertical = getVertical(verticalKey);
  const [items, countries] = await Promise.all([
    listNews(verticalKey, { country, limit: PAGE_SIZE }),
    newsCountries(verticalKey),
  ]);
  const total = countries.reduce((n, c) => n + c.count, 0);

  return (
    <>
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            Announcements tracker
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
            What {vertical.name.replace(/^Firsthand /, "").toLowerCase()}{" "}
            authorities announced
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-brand-ink/80">
            {total.toLocaleString()} announcements from official sources, each
            one linking straight to the document that issued it. We record what
            was announced and who announced it. We do not rewrite it.
          </p>
        </div>
      </section>

      {countries.length > 1 && (
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          <div className="flex flex-wrap gap-2">
            <Link
              href={vHref(verticalKey, "/news")}
              className={
                "rounded-full px-3 py-1 text-sm font-medium transition " +
                (country
                  ? "bg-brand-mist text-brand-ink/70 hover:bg-brand-mist/70"
                  : "bg-brand-navy text-white")
              }
            >
              All
            </Link>
            {countries.map((c) => (
              <Link
                key={c.country}
                href={`${vHref(verticalKey, "/news")}?country=${c.country}`}
                className={
                  "rounded-full px-3 py-1 text-sm font-medium transition " +
                  (country === c.country
                    ? "bg-brand-navy text-white"
                    : "bg-brand-mist text-brand-ink/70 hover:bg-brand-mist/70")
                }
              >
                {countryLabel(c.country)}{" "}
                <span className="opacity-60">{c.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {items.length === 0 ? (
          <p className="text-brand-ink/70">
            Nothing tracked here yet. The fetcher records new announcements as
            the source agencies publish them.
          </p>
        ) : (
          <ul className="divide-y divide-brand-mist border-y border-brand-mist">
            {items.map((item) => (
              <li key={item.id} className="py-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="font-semibold uppercase tracking-wider text-brand-blue">
                    {item.source_name}
                  </span>
                  <span className="rounded bg-brand-mist px-2 py-0.5 font-medium text-brand-ink/70">
                    {countryLabel(item.country)}
                  </span>
                  <span className="text-brand-ink/50">
                    {formatDate(item.published_at)}
                  </span>
                </div>
                <h2 className="mt-1.5 font-serif text-lg font-bold leading-snug text-brand-navy">
                  <Link
                    href={vHref(verticalKey, `/news/${item.slug}`)}
                    className="hover:text-brand-blue"
                  >
                    {item.title}
                  </Link>
                </h2>
                {item.summary && (
                  <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-brand-ink/70">
                    {item.summary.length > 220
                      ? item.summary.slice(0, 220).replace(/\s+\S*$/, "") + "…"
                      : item.summary}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
