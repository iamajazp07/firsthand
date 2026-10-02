import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Breadcrumbs from "@/components/review/Breadcrumbs";
import SleepQuiz, { type QuizProduct } from "@/components/quiz/SleepQuiz";
import { getProductsByCategory } from "@/lib/db";
import { vHref, verticalUrl } from "@/lib/site";
import { getVertical, verticalHasTool } from "@/lib/verticals";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string }>;
}): Promise<Metadata> {
  const { vertical: key } = await params;
  return {
    title: "Find Your Sleep Supplement — 60-Second Quiz",
    description:
      "Answer five quick questions and get an evidence-based sleep supplement match — no email required to see your result.",
    alternates: { canonical: verticalUrl(key, "/quiz/sleep") },
  };
}

export default async function SleepQuizPage({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  // Pages render in parallel with layouts, so each scopes itself rather than
  // relying on the [vertical] layout having run first.
  const { vertical: verticalKey } = await params;

  // Vertical-specific tool gating: the sleep quiz is a Health-only tool
  // (declared in the health config's `extras.tools`). In any vertical that does
  // not expose /quiz/sleep — e.g. Money — this route returns a real 404 instead
  // of rendering an empty, broken quiz. Health is unaffected.
  if (!verticalHasTool(getVertical(verticalKey), "/quiz/sleep")) {
    notFound();
  }

  const products = await getProductsByCategory(verticalKey, "sleep");

  // Pass only the minimal, serializable fields the client quiz needs. Names
  // and slugs come straight from the data layer so results never drift.
  const quizProducts: QuizProduct[] = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    best_for: p.best_for,
    price_summary: p.price_summary,
    rating_overall: p.rating_overall,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        verticalKey={verticalKey}
        items={[
          { name: "Home", href: "/" },
          { name: "Sleep", href: "/category/sleep" },
          { name: "Sleep Supplement Quiz", href: "/quiz/sleep" },
        ]}
      />

      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
          60-second quiz
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-brand-navy sm:text-4xl">
          Find Your Sleep Supplement
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-ink/80">
          Answer a few questions and we&apos;ll point you to the real,
          evidence-based sleep picks that best fit your situation — drawn from
          our independent reviews. Your result shows instantly; no email
          required.
        </p>
      </header>

      <section className="mt-8 rounded-xl border border-brand-mist bg-white p-5 shadow-sm sm:p-8">
        <SleepQuiz products={quizProducts} basePath={vHref(verticalKey).replace(/\/$/, "")} />
      </section>
    </div>
  );
}
