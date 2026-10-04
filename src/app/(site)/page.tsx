import type { Metadata } from "next";
import Link from "next/link";
import FindTheBest from "@/components/portal/FindTheBest";
import NewsletterBand from "@/components/NewsletterBand";
import { VERTICALS, contentVerticals } from "@/lib/verticals";
import { SITE_URL, hasOwnHost, verticalUrl } from "@/lib/site";
import { getHubs } from "@/lib/db";
import { listNews, countryLabel, type NewsItem } from "@/lib/news";
import type { Hub } from "@/lib/types";

/**
 * The readfirsthand.com front page: a news-and-rankings layout in the style of
 * a general consumer-advice publisher. Every block is fed by real data:
 *
 * - "Latest updates" comes from the primary-source news store, so it changes
 *   every time the fetcher runs, without a rebuild (hence force-dynamic).
 * - Rankings come from each vertical's hubs, the published /best pages.
 *
 * There is deliberately no "most popular" block: nothing measures popularity
 * yet, and a made-up list would be fake social proof.
 */
export const dynamic = "force-dynamic";

const portal = VERTICALS.portal;
const PORTAL_URL = SITE_URL;

export const metadata: Metadata = {
  title: { absolute: `${portal.name} — ${portal.tagline}` },
  description: portal.description,
  alternates: { canonical: PORTAL_URL },
  openGraph: {
    siteName: portal.name,
    type: "website",
    url: PORTAL_URL,
    title: `${portal.name} — ${portal.tagline}`,
    description: portal.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${portal.name} — ${portal.tagline}`,
    description: portal.description,
  },
  robots: { index: true, follow: true },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${PORTAL_URL}/#website`,
  name: portal.name,
  url: PORTAL_URL,
  description: portal.description,
};

/** Link from the apex into a vertical: absolute when it has its own host. */
function apexHref(key: string, path = ""): string {
  return hasOwnHost(key) ? verticalUrl(key, path) : `/${key}${path}`;
}

/** "Health" from "health". */
function label(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function ago(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 8) return `${days}d ago`;
  const d = new Date(t);
  // Show the year once it is not this year, or a 2025 item reads as next month.
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
  });
}

/** A short plain-text dek from an official summary. */
function dek(text: string, max = 150): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max).replace(/\s\S*$/, "")}…` : clean;
}

/** Drop feed rows with no usable headline (e.g. a bare "medrxiv"). */
function isHeadline(n: NewsItem): boolean {
  const t = (n.analysis?.title ?? n.title ?? "").trim();
  return t.length >= 12 && t.toLowerCase() !== (n.source_name ?? "").toLowerCase();
}

type Section = {
  key: string;
  name: string;
  tagline: string;
  hubs: Hub[];
  news: NewsItem[];
};

export default async function PortalPage() {
  const verticals = contentVerticals();

  const sections: Section[] = await Promise.all(
    verticals.map(async (v) => {
      const [hubs, news] = await Promise.all([
        getHubs(v.key).catch(() => [] as Hub[]),
        listNews(v.key, { limit: 12 }).catch(() => [] as NewsItem[]),
      ]);
      return { key: v.key, name: v.name, tagline: v.tagline, hubs, news: news.filter(isHeadline) };
    }),
  );

  // Newest updates across every vertical, taken in turn from each vertical so
  // one busy feed (a central bank posting ten notices an hour) cannot fill the
  // whole band.
  const pools = sections.map((s) => s.news.filter(isHeadline));
  const mixed: NewsItem[] = [];
  for (let i = 0; mixed.length < pools.flat().length; i++) {
    for (const pool of pools) if (pool[i]) mixed.push(pool[i]);
  }
  // Features want a real headline and an official summary to show under it.
  const featurable = (n: NewsItem) =>
    (n.analysis?.title ?? n.title).length >= 30 && (n.summary ?? "").length >= 60;
  const featured: NewsItem[] = [];
  for (const pool of pools) {
    const pick = pool.find(featurable);
    if (pick && featured.length < 3) featured.push(pick);
  }
  const rest = mixed.filter((n) => !featured.includes(n));
  const topUpdates = rest.slice(0, 6);
  const moreUpdates = rest.slice(6, 10);

  const rankings = sections.flatMap((s) =>
    s.hubs.map((h) => ({ section: s.key, hub: h })),
  );
  const findOptions = rankings.map(({ section, hub }) => ({
    label: hub.title.replace(/ of 20\d\d$/, ""),
    href: apexHref(section, `/best/${hub.slug}`),
  }));
  // One ranking per vertical for the hero links and the rankings rail, so the
  // front page shows the whole network rather than four health pages.
  const spread: typeof rankings = [];
  for (let i = 0; spread.length < rankings.length; i++) {
    for (const s of sections) if (s.hubs[i]) spread.push({ section: s.key, hub: s.hubs[i] });
  }
  const heroLinks = spread.slice(0, 5);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* Section bar */}
      <nav
        aria-label="Sections"
        className="bg-brand-navy text-white"
      >
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 text-sm font-medium sm:px-6">
          {sections.map((s) => (
            <Link
              key={s.key}
              href={apexHref(s.key)}
              className="whitespace-nowrap rounded px-3 py-1.5 hover:bg-white/10"
            >
              {label(s.key)}
            </Link>
          ))}
          <span className="mx-2 hidden w-px bg-white/20 sm:block" aria-hidden="true" />
          <a href="#latest-updates" className="whitespace-nowrap rounded px-3 py-1.5 hover:bg-white/10">
            Latest updates
          </a>
          <a href="#rankings" className="whitespace-nowrap rounded px-3 py-1.5 hover:bg-white/10">
            Rankings
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b-4 border-brand-blue bg-gradient-to-br from-brand-navy to-brand-blue text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 lg:py-16">
          <h1 className="font-serif text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Better decisions, from the evidence up.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/80">
            {portal.description}
          </p>
          <FindTheBest options={findOptions} />
          {heroLinks.length > 0 && (
            <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              {heroLinks.map(({ section, hub }) => (
                <li key={hub.slug}>
                  <Link
                    href={apexHref(section, `/best/${hub.slug}`)}
                    className="underline decoration-white/40 underline-offset-4 hover:decoration-white"
                  >
                    {hub.title.replace(/ of 20\d\d$/, "")}
                  </Link>
                </li>
              ))}
              <li>
                <a href="#rankings" className="font-semibold underline underline-offset-4">
                  + More rankings
                </a>
              </li>
            </ul>
          )}
        </div>
      </section>

      {/* Three-column band: updates list · featured cards · rankings */}
      <section id="latest-updates" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="rounded-lg border border-brand-navy/10 bg-white">
              <h2 className="border-b border-brand-navy/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-brand-navy">
                Latest official updates
              </h2>
              {topUpdates.length ? (
                <ul className="divide-y divide-brand-navy/10">
                  {topUpdates.map((n) => (
                    <li key={n.id} className="px-4 py-3">
                      <Link href={apexHref(n.vertical, `/news/${n.slug}`)} className="group block">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-blue">
                          {label(n.vertical)} · {countryLabel(n.country)}
                        </p>
                        <p className="mt-1 font-serif text-[15px] font-bold leading-snug text-brand-navy group-hover:underline">
                          {n.analysis?.title ?? n.title}
                        </p>
                        <p className="mt-1 text-xs text-brand-ink/60">
                          {n.source_name} · {ago(n.published_at)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-6 text-sm text-brand-ink/60">
                  New announcements appear here as soon as they are published.
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {featured.map((n, i) => (
                <Link
                  key={n.id}
                  href={apexHref(n.vertical, `/news/${n.slug}`)}
                  className={`group relative flex flex-col justify-end overflow-hidden rounded-lg p-5 pt-14 text-white shadow-sm ${
                    i === 0 ? "min-h-[240px] sm:col-span-2" : "min-h-[220px]"
                  } ${["bg-brand-navy", "bg-brand-blue", "bg-brand-ink"][i % 3]}`}
                >
                  <span className="absolute left-5 top-5 rounded bg-white/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
                    {label(n.vertical)} · {countryLabel(n.country)}
                  </span>
                  <p className={`font-serif font-bold leading-snug group-hover:underline ${i === 0 ? "text-2xl" : "text-lg"}`}>
                    {n.analysis?.title ?? n.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    {dek(n.summary, i === 0 ? 220 : 120)}
                  </p>
                  <p className="mt-2 text-xs text-white/70">
                    {n.source_name} · {ago(n.published_at)}
                  </p>
                </Link>
              ))}
            </div>
            {moreUpdates.length > 0 && (
              <ul className="mt-6 divide-y divide-brand-navy/10 border-t border-brand-navy/10">
                {moreUpdates.map((n) => (
                  <li key={n.id} className="py-3">
                    <Link href={apexHref(n.vertical, `/news/${n.slug}`)} className="group block">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-blue">
                        {label(n.vertical)}
                      </span>
                      <p className="mt-0.5 text-[15px] font-semibold leading-snug text-brand-ink group-hover:text-brand-navy group-hover:underline">
                        {n.analysis?.title ?? n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-brand-ink/60">
                        {n.source_name} · {ago(n.published_at)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
              Top rankings
            </h2>
            <ul className="mt-3 divide-y divide-brand-navy/10">
              {spread.slice(0, 7).map(({ section, hub }) => (
                <li key={`${section}-${hub.slug}`} className="py-3">
                  <Link href={apexHref(section, `/best/${hub.slug}`)} className="group block">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-blue">
                      {label(section)}
                    </p>
                    <p className="mt-0.5 font-serif text-[15px] font-bold leading-snug text-brand-navy group-hover:underline">
                      {hub.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <NewsletterBand verticalKey="portal" />

      {/* One block per vertical */}
      <div id="rankings" className="scroll-mt-24">
        {sections.map((s, idx) => (
          <section
            key={s.key}
            className={idx % 2 === 0 ? "bg-brand-mist/60" : "bg-white"}
          >
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
              <div className="flex items-end justify-between border-b-2 border-brand-navy pb-2">
                <h2 className="font-serif text-2xl font-bold text-brand-navy sm:text-3xl">
                  {label(s.key)}
                </h2>
                <Link
                  href={apexHref(s.key)}
                  className="text-sm font-semibold text-brand-blue hover:underline"
                >
                  View all {label(s.key)} →
                </Link>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="rounded-lg border border-brand-navy/10 bg-white p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                    {label(s.key)} rankings
                  </h3>
                  {s.hubs.length ? (
                    <ol className="mt-3 space-y-3">
                      {s.hubs.map((h, i) => (
                        <li key={h.slug} className="flex gap-3">
                          <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-mist text-xs font-bold text-brand-navy">
                            {i + 1}
                          </span>
                          <Link
                            href={apexHref(s.key, `/best/${h.slug}`)}
                            className="font-serif text-[15px] font-bold leading-snug text-brand-navy hover:underline"
                          >
                            {h.title}
                          </Link>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-3 text-sm text-brand-ink/60">Rankings are in progress.</p>
                  )}
                </div>

                {s.news[0] ? (
                  <Link
                    href={apexHref(s.key, `/news/${s.news[0].slug}`)}
                    className="group flex flex-col justify-between rounded-lg bg-brand-navy p-6 text-white"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                      {s.news[0].source_name} · {countryLabel(s.news[0].country)}
                    </span>
                    <p className="mt-2 font-serif text-xl font-bold leading-snug group-hover:underline">
                      {s.news[0].analysis?.title ?? s.news[0].title}
                    </p>
                    {s.news[0].summary && (
                      <p className="mt-2 text-sm leading-relaxed text-white/80">
                        {dek(s.news[0].summary, 180)}
                      </p>
                    )}
                    <span className="mt-3 text-xs text-white/60">{ago(s.news[0].published_at)}</span>
                  </Link>
                ) : (
                  <div className="flex flex-col justify-end rounded-lg bg-brand-navy p-6 text-white">
                    <p className="font-serif text-xl font-bold">{s.name}</p>
                    <p className="mt-2 text-sm text-white/80">{s.tagline}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                    Latest updates
                  </h3>
                  {s.news.length > 1 ? (
                    <ul className="mt-2 divide-y divide-brand-navy/10">
                      {s.news.slice(1, 6).map((n) => (
                        <li key={n.id} className="py-2.5">
                          <Link
                            href={apexHref(s.key, `/news/${n.slug}`)}
                            className="group block"
                          >
                            <p className="text-[15px] font-semibold leading-snug text-brand-ink group-hover:text-brand-navy group-hover:underline">
                              {n.analysis?.title ?? n.title}
                            </p>
                            <p className="mt-0.5 text-xs text-brand-ink/60">
                              {n.source_name} · {ago(n.published_at)}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-brand-ink/60">
                      Official announcements for {label(s.key)} appear here as they are published.
                    </p>
                  )}
                  <Link
                    href={apexHref(s.key, "/news")}
                    className="mt-3 inline-block text-sm font-semibold text-brand-blue hover:underline"
                  >
                    All {label(s.key)} updates →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
