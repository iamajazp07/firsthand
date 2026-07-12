import Link from "next/link";

import {
  listQueueItems,
  QUEUE_STATUSES,
  type QueueItem,
  type QueueStatus,
} from "@/lib/queue";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<QueueStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
};

const STATUS_STYLE: Record<QueueStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  in_review: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  scheduled: "bg-indigo-100 text-indigo-800",
  published: "bg-brand-blue/15 text-brand-navy",
};

function StatusBadge({ status }: { status: QueueStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function TypeBadge({ type }: { type: QueueItem["type"] }) {
  return (
    <span className="inline-block rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-brand-ink/70">
      {type.replace("_", " ")}
    </span>
  );
}

function fmt(iso: string): string {
  // Stable, locale-independent formatting (avoids hydration drift).
  return iso.slice(0, 16).replace("T", " ") + " UTC";
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeFilter = QUEUE_STATUSES.includes(status as QueueStatus)
    ? (status as QueueStatus)
    : undefined;

  const all = await listQueueItems();
  const counts = QUEUE_STATUSES.reduce(
    (acc, s) => {
      acc[s] = all.filter((i) => i.status === s).length;
      return acc;
    },
    {} as Record<QueueStatus, number>,
  );

  const items = activeFilter
    ? all.filter((i) => i.status === activeFilter)
    : all;

  const freshnessFlags = all.filter(
    (i) => i.type === "hub_update" && i.status === "draft",
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-brand-navy">Review queue</h1>
          <p className="mt-1 text-sm text-brand-ink/70">
            {all.length} item{all.length === 1 ? "" : "s"} in the content queue.
          </p>
        </div>
        <Link
          href="/admin/social"
          className="rounded-md border border-brand-blue px-3 py-2 text-sm font-medium text-brand-blue hover:bg-brand-blue hover:text-white"
        >
          Social queue →
        </Link>
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {QUEUE_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin?status=${s}`}
            className={`rounded-lg border p-4 transition hover:border-brand-blue ${
              activeFilter === s
                ? "border-brand-blue bg-white"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="text-2xl font-semibold text-brand-navy">
              {counts[s]}
            </div>
            <div className="mt-1 text-xs text-brand-ink/70">
              {STATUS_LABEL[s]}
            </div>
          </Link>
        ))}
      </div>

      {/* Freshness card */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg text-brand-navy">
            Flagged by freshness check
          </h2>
          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900">
            {freshnessFlags.length} pending
          </span>
        </div>
        <p className="mt-1 text-sm text-amber-900/80">
          Hub-update drafts created by <code>npm run freshness:check</code> for
          pages whose <code>last_updated</code> is stale.
        </p>
        {freshnessFlags.length > 0 ? (
          <ul className="mt-3 space-y-1 text-sm">
            {freshnessFlags.map((i) => (
              <li key={i.id}>
                <Link
                  href={`/admin/queue/${i.id}`}
                  className="text-brand-blue hover:underline"
                >
                  {i.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-amber-900/70">
            Nothing flagged right now.
          </p>
        )}
      </div>

      {/* Item list */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg text-brand-navy">
            {activeFilter ? `${STATUS_LABEL[activeFilter]} items` : "All items"}
          </h2>
          {activeFilter ? (
            <Link
              href="/admin"
              className="text-sm text-brand-blue hover:underline"
            >
              Clear filter
            </Link>
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-brand-mist/60 text-xs uppercase tracking-wide text-brand-ink/60">
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Updated</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-brand-ink/50"
                  >
                    No items.
                  </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <TypeBadge type={i.type} />
                    </td>
                    <td className="px-4 py-3 font-medium text-brand-ink">
                      {i.title}
                    </td>
                    <td className="px-4 py-3 text-brand-ink/70">
                      {i.category_slug}
                    </td>
                    <td className="px-4 py-3 text-brand-ink/60">
                      {fmt(i.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={i.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/queue/${i.id}`}
                        className="text-brand-blue hover:underline"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
