import Link from "next/link";
import { notFound } from "next/navigation";

import { getAuthors, getReviewers, getCategories, getReviewerBySlug } from "@/lib/db";
import {
  getQueueItem,
  evaluateCompliance,
  allowedTransitions,
} from "@/lib/queue";
import QueueEditor from "./QueueEditor";

export const dynamic = "force-dynamic";

export default async function QueueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getQueueItem(id);
  if (!item) notFound();

  const [authors, reviewers, categories] = await Promise.all([
    getAuthors(),
    getReviewers(),
    getCategories(),
  ]);

  const reviewer = item.reviewer_slug
    ? await getReviewerBySlug(item.reviewer_slug)
    : null;
  const reviewerIsPlaceholder = reviewer?.is_placeholder ?? false;

  const compliance = evaluateCompliance(item, { reviewerIsPlaceholder });
  const allowed = allowedTransitions(item.status);

  return (
    <div className="space-y-6">
      <div className="text-sm">
        <Link href="/admin" className="text-brand-blue hover:underline">
          ← Back to queue
        </Link>
      </div>

      <QueueEditor
        item={item}
        authors={authors.map((a) => ({ slug: a.slug, name: a.name }))}
        reviewers={reviewers.map((r) => ({
          slug: r.slug,
          name: r.name,
          is_placeholder: r.is_placeholder,
        }))}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        checks={compliance.checks}
        compliancePassed={compliance.passed}
        reviewerIsPlaceholder={reviewerIsPlaceholder}
        allowed={allowed}
      />
    </div>
  );
}
