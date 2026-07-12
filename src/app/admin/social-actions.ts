"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { isAuthed } from "@/lib/admin-auth";
import {
  updateSocialPost,
  transitionSocialStatus,
  getSocialPost,
  hasDisclosure,
  type SocialStatus,
} from "@/lib/social";

/** Re-validate auth on EVERY mutation (never trust a disabled UI button). */
async function requireAdmin(): Promise<void> {
  if (!(await isAuthed())) {
    redirect("/admin/login");
  }
}

export interface SocialActionResult {
  ok: boolean;
  error?: string;
}

/** Persist an inline caption/hashtags edit. Does NOT change status. */
export async function saveSocialCaption(
  id: string,
  caption: string,
): Promise<SocialActionResult> {
  await requireAdmin();
  const updated = await updateSocialPost(id, { caption });
  if (!updated) return { ok: false, error: "Social post not found." };
  revalidatePath("/admin/social");
  return { ok: true };
}

/**
 * Approve a draft. Re-runs the FTC disclosure gate server-side: a monetized
 * post whose caption lacks '#ad'/'affiliate' is REJECTED regardless of the UI.
 * An optional caption edit is applied first so the check sees the latest text.
 */
export async function approveSocialPost(
  id: string,
  caption?: string,
): Promise<SocialActionResult> {
  await requireAdmin();
  const post = await getSocialPost(id);
  if (!post) return { ok: false, error: "Social post not found." };

  const nextCaption = caption ?? post.caption;
  if (post.is_monetized_link && !hasDisclosure(nextCaption)) {
    return {
      ok: false,
      error:
        "Approval blocked: monetized link is missing an FTC disclosure ('#ad' or 'affiliate') in the caption.",
    };
  }

  const res = await transitionSocialStatus(id, "approved", { caption: nextCaption });
  revalidatePath("/admin/social");
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

/** Schedule an approved post at the given ISO datetime. */
export async function scheduleSocialPost(
  id: string,
  scheduledAtIso: string,
): Promise<SocialActionResult> {
  await requireAdmin();
  if (!scheduledAtIso) {
    return { ok: false, error: "Set a schedule date/time first." };
  }
  const res = await transitionSocialStatus(id, "scheduled", {
    scheduled_at: scheduledAtIso,
  });
  revalidatePath("/admin/social");
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

/** Send any post back to draft (clears schedule/sent state). */
export async function resetSocialPost(id: string): Promise<SocialActionResult> {
  await requireAdmin();
  const res = await transitionSocialStatus(id, "draft");
  revalidatePath("/admin/social");
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

/** Generic guarded status transition (used by the client for flexibility). */
export async function transitionSocial(
  id: string,
  to: SocialStatus,
): Promise<SocialActionResult> {
  await requireAdmin();
  const res = await transitionSocialStatus(id, to);
  revalidatePath("/admin/social");
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}
