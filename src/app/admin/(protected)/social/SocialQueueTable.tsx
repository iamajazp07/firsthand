"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type {
  SocialPost,
  SocialPlatform,
  SocialStatus,
} from "@/lib/social";
import {
  saveSocialCaption,
  approveSocialPost,
  scheduleSocialPost,
  resetSocialPost,
  type SocialActionResult,
} from "@/app/admin/social-actions";

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  x: "X",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

const PLATFORM_STYLE: Record<SocialPlatform, string> = {
  x: "bg-slate-900 text-white",
  facebook: "bg-blue-600 text-white",
  instagram: "bg-pink-600 text-white",
  linkedin: "bg-sky-700 text-white",
};

const STATUS_STYLE: Record<SocialStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  approved: "bg-emerald-100 text-emerald-800",
  scheduled: "bg-indigo-100 text-indigo-800",
  sent: "bg-brand-blue/15 text-brand-navy",
  failed: "bg-red-100 text-red-700",
  skipped_no_credentials: "bg-amber-100 text-amber-800",
};

const STATUS_LABEL: Record<SocialStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  scheduled: "Scheduled",
  sent: "Sent",
  failed: "Failed",
  skipped_no_credentials: "Skipped (no creds)",
};

/** Regex mirror of hasDisclosure() for instant client-side feedback. */
function clientHasDisclosure(caption: string): boolean {
  const c = caption.toLowerCase();
  return /#ad\b/.test(c) || c.includes("affiliate");
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 16).replace("T", " ") + " UTC";
}

export default function SocialQueueTable({ posts }: { posts: SocialPost[] }) {
  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-brand-ink/50">
          No social posts. Run{" "}
          <code className="text-brand-ink/70">npm run social:generate</code> to
          create drafts.
        </div>
      ) : (
        posts.map((p) => <SocialRow key={p.id} post={p} />)
      )}
    </div>
  );
}

function SocialRow({ post }: { post: SocialPost }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [caption, setCaption] = useState(post.caption);
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(post.scheduled_at));
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );
  const [open, setOpen] = useState(false);

  const disclosureOk = !post.is_monetized_link || clientHasDisclosure(caption);

  function run(fn: () => Promise<SocialActionResult>, okText: string) {
    setMsg(null);
    startTransition(async () => {
      const res = await fn();
      setMsg(
        res.ok
          ? { kind: "ok", text: okText }
          : { kind: "error", text: res.error ?? "Action failed." },
      );
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      {/* Summary row */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${PLATFORM_STYLE[post.platform]}`}
        >
          {PLATFORM_LABEL[post.platform]}
        </span>
        <span className="inline-block rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-brand-ink/70">
          {post.content_type}
        </span>
        <div className="min-w-0 flex-1">
          <a
            href={post.content_url}
            target="_blank"
            rel="noreferrer"
            className="block truncate font-medium text-brand-navy hover:underline"
            title={post.content_slug}
          >
            {post.content_slug}
          </a>
          <p className="truncate text-xs text-brand-ink/60" title={caption}>
            {caption}
          </p>
        </div>

        {/* Monetized / disclosure indicator */}
        {post.is_monetized_link ? (
          <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
              disclosureOk
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-700"
            }`}
            title={
              disclosureOk
                ? "Monetized — disclosure present"
                : "Monetized — disclosure MISSING"
            }
          >
            {disclosureOk ? "#ad ✓" : "#ad ✗"}
          </span>
        ) : (
          <span className="inline-block rounded px-2 py-0.5 text-xs text-brand-ink/40">
            organic
          </span>
        )}

        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[post.status]}`}
        >
          {STATUS_LABEL[post.status]}
        </span>
        <span className="hidden text-xs text-brand-ink/50 sm:inline">
          {fmt(post.scheduled_at)}
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-brand-blue hover:border-brand-blue"
        >
          {open ? "Close" : "Edit"}
        </button>
      </div>

      {/* Expanded editor */}
      {open && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-4">
          {msg && (
            <div
              role="status"
              className={`rounded-md border px-3 py-2 text-sm ${
                msg.kind === "ok"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-red-300 bg-red-50 text-red-700"
              }`}
            >
              {msg.text}
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-brand-ink">
              Caption ({caption.length} chars)
              {post.is_monetized_link && (
                <span
                  className={`ml-2 text-xs ${disclosureOk ? "text-emerald-700" : "text-red-600"}`}
                >
                  {disclosureOk
                    ? "disclosure present"
                    : "⚠ needs #ad / affiliate disclosure"}
                </span>
              )}
            </span>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30"
              rows={5}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </label>

          <div className="flex flex-wrap items-end gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() => saveSocialCaption(post.id, caption), "Caption saved.")
              }
              className="rounded-md bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-blue disabled:opacity-50"
            >
              Save caption
            </button>

            {post.status === "draft" && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(
                    () => approveSocialPost(post.id, caption),
                    "Approved.",
                  )
                }
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Approve
              </button>
            )}

            {post.status === "approved" && (
              <div className="flex items-end gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-brand-ink/70">
                    Schedule (date/time)
                  </span>
                  <input
                    type="datetime-local"
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-brand-ink outline-none focus:border-brand-blue"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  disabled={pending || !scheduledAt}
                  onClick={() =>
                    run(
                      () =>
                        scheduleSocialPost(
                          post.id,
                          scheduledAt ? new Date(scheduledAt).toISOString() : "",
                        ),
                      "Scheduled.",
                    )
                  }
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Schedule
                </button>
              </div>
            )}

            {post.status !== "draft" && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(() => resetSocialPost(post.id), "Back to draft.")
                }
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-brand-ink/70 hover:border-brand-navy disabled:opacity-50"
              >
                Back to draft
              </button>
            )}
          </div>

          {post.result_note && (
            <p className="text-xs text-brand-ink/60">
              <span className="font-medium">Last result:</span>{" "}
              {post.result_note}
            </p>
          )}
          <dl className="grid grid-cols-1 gap-1 text-xs text-brand-ink/50 sm:grid-cols-2">
            <div>
              <dt className="inline font-medium">Image:</dt>{" "}
              <a
                href={post.image_url}
                target="_blank"
                rel="noreferrer"
                className="text-brand-blue hover:underline"
              >
                OG card
              </a>
            </div>
            <div>
              <dt className="inline font-medium">Sent at:</dt> {fmt(post.sent_at)}
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
