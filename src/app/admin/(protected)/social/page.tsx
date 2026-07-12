import Link from "next/link";

import {
  listSocialPosts,
  SOCIAL_STATUSES,
  SOCIAL_STORAGE_MODE,
  type SocialStatus,
} from "@/lib/social";
import SocialQueueTable from "./SocialQueueTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Social queue",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<SocialStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  scheduled: "Scheduled",
  sent: "Sent",
  failed: "Failed",
  skipped_no_credentials: "Skipped",
};

export default async function AdminSocialPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeFilter = SOCIAL_STATUSES.includes(status as SocialStatus)
    ? (status as SocialStatus)
    : undefined;

  const all = await listSocialPosts();
  const counts = SOCIAL_STATUSES.reduce(
    (acc, s) => {
      acc[s] = all.filter((i) => i.status === s).length;
      return acc;
    },
    {} as Record<SocialStatus, number>,
  );

  const posts = activeFilter
    ? all.filter((i) => i.status === activeFilter)
    : all;

  const monetizedMissing = all.filter(
    (p) => p.is_monetized_link && !/#ad\b|affiliate/i.test(p.caption),
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-brand-navy">Social queue</h1>
          <p className="mt-1 text-sm text-brand-ink/70">
            {all.length} post{all.length === 1 ? "" : "s"} · store:{" "}
            <span className="font-medium">{SOCIAL_STORAGE_MODE}</span>
          </p>
        </div>
        <Link href="/admin" className="text-sm text-brand-blue hover:underline">
          ← Back to dashboard
        </Link>
      </div>

      <div className="rounded-lg border border-brand-mist bg-brand-mist/40 p-4 text-sm text-brand-ink/80">
        <p>
          Drafts come from{" "}
          <code className="text-brand-ink">npm run social:generate</code>. Review
          &amp; edit captions here, <strong>Approve</strong> (monetized posts
          without an <code>#ad</code>/affiliate disclosure are rejected),{" "}
          <strong>Schedule</strong>, then dispatch with{" "}
          <code className="text-brand-ink">npm run social:send</code> (add{" "}
          <code className="text-brand-ink">--dry-run</code> to preview).
        </p>
        {monetizedMissing > 0 && (
          <p className="mt-2 font-medium text-red-700">
            ⚠ {monetizedMissing} monetized post(s) are missing a disclosure and
            cannot be approved until fixed.
          </p>
        )}
      </div>

      {/* Status filter chips */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {SOCIAL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/social?status=${s}`}
            className={`rounded-lg border p-3 transition hover:border-brand-blue ${
              activeFilter === s
                ? "border-brand-blue bg-white"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="text-xl font-semibold text-brand-navy">
              {counts[s]}
            </div>
            <div className="mt-1 text-[11px] text-brand-ink/70">
              {STATUS_LABEL[s]}
            </div>
          </Link>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg text-brand-navy">
            {activeFilter ? `${STATUS_LABEL[activeFilter]} posts` : "All posts"}
          </h2>
          {activeFilter && (
            <Link
              href="/admin/social"
              className="text-sm text-brand-blue hover:underline"
            >
              Clear filter
            </Link>
          )}
        </div>
        <SocialQueueTable posts={posts} />
      </div>
    </div>
  );
}
