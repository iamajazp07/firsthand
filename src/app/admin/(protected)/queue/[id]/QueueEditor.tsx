"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type {
  QueueItem,
  QueueSource,
  QueueStatus,
  QueueCompliance,
  ComplianceCheck,
} from "@/lib/queue";
import {
  saveQueueItem,
  doTransition,
  type SavePatch,
  type ActionResult,
} from "@/app/admin/actions";

// Mirror of MANUAL_COMPLIANCE_LABELS (kept local so this client bundle never
// imports the server-only queue module).
const MANUAL_CHECKS: { key: keyof QueueCompliance; label: string }[] = [
  {
    key: "affiliate_disclosure",
    label: "Affiliate disclosure will be present on rendered page",
  },
  { key: "cons_red_flags", label: "Cons/red flags included" },
  { key: "pricing_verified", label: "Pricing verified current" },
  {
    key: "no_fabricated_testimonials",
    label: "No fabricated testimonials",
  },
];

const TRANSITION_LABEL: Record<QueueStatus, string> = {
  draft: "Back to draft",
  in_review: "Send to review",
  approved: "Approve",
  scheduled: "Schedule",
  published: "Publish",
};

interface Named {
  slug: string;
  name: string;
}

export default function QueueEditor({
  item,
  authors,
  reviewers,
  categories,
  checks,
  compliancePassed,
  allowed,
}: {
  item: QueueItem;
  authors: Named[];
  reviewers: (Named & { is_placeholder: boolean })[];
  categories: Named[];
  checks: ComplianceCheck[];
  compliancePassed: boolean;
  reviewerIsPlaceholder: boolean;
  allowed: QueueStatus[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{
    kind: "ok" | "error";
    text: string;
    failures?: string[];
  } | null>(null);

  // Editable form state
  const [title, setTitle] = useState(item.title);
  const [slug, setSlug] = useState(item.slug);
  const [categorySlug, setCategorySlug] = useState(item.category_slug);
  const [bodyMd, setBodyMd] = useState(item.body_md);
  const [answerBlock, setAnswerBlock] = useState(item.answer_block);
  const [notes, setNotes] = useState(item.notes);
  const [authorSlug, setAuthorSlug] = useState(item.author_slug);
  const [reviewerSlug, setReviewerSlug] = useState(item.reviewer_slug ?? "");
  const [sources, setSources] = useState<QueueSource[]>(
    item.sources.length ? item.sources : [],
  );
  const [scheduledAt, setScheduledAt] = useState(
    item.scheduled_at ? toLocalInput(item.scheduled_at) : "",
  );
  const [compliance, setCompliance] = useState<QueueCompliance>(item.compliance);

  const answerWords = answerBlock.trim().split(/\s+/).filter(Boolean).length;

  function currentPatch(): SavePatch {
    return {
      title,
      slug,
      category_slug: categorySlug,
      body_md: bodyMd,
      answer_block: answerBlock,
      notes,
      author_slug: authorSlug,
      reviewer_slug: reviewerSlug || null,
      sources: sources.filter((s) => s.name.trim() || s.url.trim()),
      compliance,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    };
  }

  function handleResult(res: ActionResult, okText: string) {
    if (res.ok) {
      setMsg({ kind: "ok", text: okText });
    } else {
      setMsg({
        kind: "error",
        text: res.error ?? "Action failed.",
        failures: res.failures,
      });
    }
    router.refresh();
  }

  function onSave() {
    setMsg(null);
    startTransition(async () => {
      const res = await saveQueueItem(item.id, currentPatch());
      handleResult(res, "Saved.");
    });
  }

  function onTransition(to: QueueStatus) {
    setMsg(null);
    startTransition(async () => {
      // Persist current edits first, then transition (so the server-side
      // compliance gate evaluates the latest content + checkbox state).
      const res = await doTransition(item.id, to, currentPatch());
      handleResult(
        res,
        to === "published"
          ? "Published."
          : `Moved to ${to.replace("_", " ")}.`,
      );
    });
  }

  // Merge live manual-checkbox state over the server-computed checks so manual
  // toggles give instant feedback (auto checks refresh on Save).
  const displayChecks = checks.map((c) => {
    const manual = MANUAL_CHECKS.find((m) => `manual_${m.key}` === c.key);
    if (manual) {
      const ok = compliance[manual.key] === true;
      return { ...c, status: ok ? ("pass" as const) : ("fail" as const) };
    }
    return c;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* ---- Editor column ---- */}
      <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <span className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-brand-ink/70">
            {item.type.replace("_", " ")}
          </span>
          <span className="rounded-full bg-brand-mist px-2 py-0.5 text-xs text-brand-ink/70">
            {item.status.replace("_", " ")}
          </span>
        </div>

        <Field label="Title">
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug">
            <input
              className={inputCls}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </Field>
          <Field label="Category">
            <select
              className={inputCls}
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
            >
              <option value="">— select —</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Author">
            <select
              className={inputCls}
              value={authorSlug}
              onChange={(e) => setAuthorSlug(e.target.value)}
            >
              <option value="">— select —</option>
              {authors.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Medical reviewer">
            <select
              className={inputCls}
              value={reviewerSlug}
              onChange={(e) => setReviewerSlug(e.target.value)}
            >
              <option value="">— none —</option>
              {reviewers.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name}
                  {r.is_placeholder ? " (placeholder)" : ""}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={`Answer block (${answerWords} words)`}>
          <textarea
            className={`${inputCls} min-h-28`}
            value={answerBlock}
            onChange={(e) => setAnswerBlock(e.target.value)}
          />
        </Field>

        <Field label="Body (markdown)">
          <textarea
            className={`${inputCls} min-h-64 font-mono text-sm`}
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
          />
        </Field>

        {/* Sources */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-brand-ink">Sources</span>
            <button
              type="button"
              onClick={() =>
                setSources((s) => [...s, { name: "", url: "" }])
              }
              className="text-sm text-brand-blue hover:underline"
            >
              + Add source
            </button>
          </div>
          <div className="space-y-2">
            {sources.length === 0 ? (
              <p className="text-sm text-brand-ink/50">No sources yet.</p>
            ) : (
              sources.map((src, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    className={inputCls}
                    placeholder="Source name"
                    value={src.name}
                    onChange={(e) =>
                      setSources((list) =>
                        list.map((s, i) =>
                          i === idx ? { ...s, name: e.target.value } : s,
                        ),
                      )
                    }
                  />
                  <input
                    className={inputCls}
                    placeholder="https://..."
                    value={src.url}
                    onChange={(e) =>
                      setSources((list) =>
                        list.map((s, i) =>
                          i === idx ? { ...s, url: e.target.value } : s,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSources((list) => list.filter((_, i) => i !== idx))
                    }
                    className="shrink-0 rounded-md border border-slate-300 px-2 text-sm text-brand-ink/60 hover:border-red-300 hover:text-red-600"
                    aria-label="Remove source"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <Field label="Schedule (date/time)">
          <input
            type="datetime-local"
            className={inputCls}
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </Field>

        <Field label="Notes">
          <textarea
            className={`${inputCls} min-h-20`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        <div>
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="rounded-md bg-brand-navy px-4 py-2 font-medium text-white transition hover:bg-brand-blue disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {/* ---- Sidebar: compliance + actions ---- */}
      <div className="space-y-6">
        {msg ? (
          <div
            role="status"
            className={`rounded-md border px-3 py-2 text-sm ${
              msg.kind === "ok"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-red-300 bg-red-50 text-red-700"
            }`}
          >
            <p className="font-medium">{msg.text}</p>
            {msg.failures && msg.failures.length > 0 ? (
              <ul className="mt-1 list-disc pl-5">
                {msg.failures.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {/* Compliance checklist */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg text-brand-navy">
              Compliance checklist
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                compliancePassed
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {compliancePassed ? "Passing" : "Blocking"}
            </span>
          </div>
          <p className="mt-1 text-xs text-brand-ink/60">
            Auto checks refresh on Save. Manual checks apply on Approve.
          </p>

          <ul className="mt-3 space-y-2 text-sm">
            {displayChecks.map((c) => (
              <li key={c.key} className="flex gap-2">
                <span aria-hidden className="mt-0.5">
                  {c.status === "pass"
                    ? "✅"
                    : c.status === "warn"
                      ? "⚠️"
                      : "❌"}
                </span>
                <span>
                  <span
                    className={
                      c.status === "fail"
                        ? "text-red-700"
                        : c.status === "warn"
                          ? "text-amber-700"
                          : "text-brand-ink"
                    }
                  >
                    {c.label}
                    {c.required ? "" : " (advisory)"}
                  </span>
                  {c.detail ? (
                    <span className="block text-xs text-brand-ink/60">
                      {c.detail}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-ink/50">
              Manual confirmations
            </p>
            <div className="space-y-2">
              {MANUAL_CHECKS.map((m) => (
                <label key={m.key} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={compliance[m.key]}
                    onChange={(e) =>
                      setCompliance((c) => ({
                        ...c,
                        [m.key]: e.target.checked,
                      }))
                    }
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-brand-ink/50">
              Tip: Save to persist checkbox state before leaving the page.
            </p>
          </div>
        </div>

        {/* Transition actions */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="font-serif text-lg text-brand-navy">Actions</h3>
          <p className="mt-1 text-xs text-brand-ink/60">
            Allowed from status <strong>{item.status}</strong>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {allowed.length === 0 ? (
              <p className="text-sm text-brand-ink/50">
                No transitions available.
              </p>
            ) : (
              allowed.map((to) => (
                <button
                  key={to}
                  type="button"
                  onClick={() => onTransition(to)}
                  disabled={pending}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
                    to === "draft"
                      ? "border border-slate-300 text-brand-ink/70 hover:border-brand-navy"
                      : "bg-brand-blue text-white hover:bg-brand-navy"
                  }`}
                >
                  {TRANSITION_LABEL[to]}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-brand-ink">
        {label}
      </span>
      {children}
    </label>
  );
}

/** ISO string → value for <input type="datetime-local"> (local time). */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
