"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { ADMIN_COOKIE, isAuthed } from "@/lib/admin-auth";
import { getReviewerBySlug } from "@/lib/db";
import {
  updateQueueItem,
  transitionStatus,
  getQueueItem,
  type QueueStatus,
  type QueueSource,
  type QueueCompliance,
} from "@/lib/queue";

/** Re-validate auth on EVERY mutation (never trust a disabled UI button). */
async function requireAdmin(): Promise<void> {
  if (!(await isAuthed())) {
    redirect("/admin/login");
  }
}

export interface SavePatch {
  title?: string;
  slug?: string;
  category_slug?: string;
  body_md?: string;
  answer_block?: string;
  sources?: QueueSource[];
  author_slug?: string;
  reviewer_slug?: string | null;
  notes?: string;
  scheduled_at?: string | null;
  compliance?: QueueCompliance;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
  failures?: string[];
}

/** Persist edits to a queue item. Does NOT change status. */
export async function saveQueueItem(
  id: string,
  patch: SavePatch,
): Promise<ActionResult> {
  await requireAdmin();
  const updated = await updateQueueItem(id, patch);
  if (!updated) return { ok: false, error: "Queue item not found." };
  revalidatePath(`/admin/queue/${id}`);
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Apply an optional patch (e.g. checkbox state or a schedule date) and then
 * run a validated status transition. Approval re-evaluates the compliance
 * checklist server-side and is REJECTED with a list of failures if any
 * required check fails — regardless of what the client sent.
 */
export async function doTransition(
  id: string,
  newStatus: QueueStatus,
  patch?: SavePatch,
): Promise<ActionResult> {
  await requireAdmin();

  if (patch && Object.keys(patch).length > 0) {
    const saved = await updateQueueItem(id, patch);
    if (!saved) return { ok: false, error: "Queue item not found." };
  }

  const item = await getQueueItem(id);
  if (!item) return { ok: false, error: "Queue item not found." };

  // Look up the attached reviewer's placeholder flag for the compliance gate.
  let reviewerIsPlaceholder = false;
  if (item.reviewer_slug) {
    const reviewer = await getReviewerBySlug(item.reviewer_slug);
    reviewerIsPlaceholder = reviewer?.is_placeholder ?? false;
  }

  const result = await transitionStatus(id, newStatus, { reviewerIsPlaceholder });
  revalidatePath(`/admin/queue/${id}`);
  revalidatePath("/admin");

  if (!result.ok) {
    return { ok: false, error: result.error, failures: result.failures };
  }
  return { ok: true };
}

/** Sign out: clear the session cookie and return to the login page. */
export async function logout(): Promise<void> {
  await requireAdmin();
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
