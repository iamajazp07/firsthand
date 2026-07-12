"use client";

import { useState } from "react";
import Link from "next/link";
import EmailSignup from "@/components/EmailSignup";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";

/**
 * Minimal serializable product shape passed from the server page. Names/slugs
 * come from the data layer (src/data/products.json) — never hardcoded here, so
 * they can't drift out of sync with the reviews.
 */
export interface QuizProduct {
  slug: string;
  name: string;
  best_for: string;
  price_summary: string;
  rating_overall: number;
}

const HUB_SLUG = "best-sleep-supplements";

/**
 * Per-slug scoring traits. Keyed by the STABLE seed slug (read from the data
 * layer by the page). A product whose slug is absent here still surfaces via
 * the rating fallback, it just earns no trait-based points.
 */
const TRAITS: Record<
  string,
  { hasMelatonin: boolean; form: "capsule" | "powder" | "gummy"; tags: string[] }
> = {
  "nature-made-melatonin-3mg": {
    hasMelatonin: true,
    form: "capsule",
    tags: ["onset", "jetlag"],
  },
  "doctors-best-high-absorption-magnesium": {
    hasMelatonin: false,
    form: "capsule",
    tags: ["maintenance", "restlessness"],
  },
  "now-glycine": {
    hasMelatonin: false,
    form: "powder",
    tags: ["onset", "maintenance"],
  },
  "sports-research-l-theanine": {
    hasMelatonin: false,
    form: "capsule",
    tags: ["restlessness"],
  },
  "olly-sleep-gummies": {
    hasMelatonin: true,
    form: "gummy",
    tags: ["onset", "restlessness"],
  },
};

type QuestionId =
  | "complaint"
  | "caffeine"
  | "form"
  | "grogginess"
  | "medication";

interface Choice {
  value: string;
  label: string;
}

interface Question {
  id: QuestionId;
  prompt: string;
  choices: Choice[];
}

const QUESTIONS: Question[] = [
  {
    id: "complaint",
    prompt: "What's your main sleep struggle?",
    choices: [
      { value: "onset", label: "Trouble falling asleep" },
      { value: "maintenance", label: "Waking up during the night" },
      { value: "jetlag", label: "Jet lag or shift-work schedule" },
      { value: "restlessness", label: "General restlessness — can't wind down" },
    ],
  },
  {
    id: "caffeine",
    prompt: "When do you usually have your last caffeine?",
    choices: [
      { value: "morning", label: "Morning only (or none)" },
      { value: "afternoon", label: "Afternoon" },
      { value: "evening", label: "Evening" },
    ],
  },
  {
    id: "form",
    prompt: "Which format do you prefer?",
    choices: [
      { value: "capsule", label: "Capsule, tablet, or softgel" },
      { value: "powder", label: "Powder to mix in water" },
      { value: "gummy", label: "Gummy" },
      { value: "none", label: "No preference" },
    ],
  },
  {
    id: "grogginess",
    prompt: "How sensitive are you to next-day grogginess?",
    choices: [
      { value: "sensitive", label: "Very — I want to avoid morning fog" },
      { value: "tolerant", label: "Not really — it doesn't bother me" },
    ],
  },
  {
    id: "medication",
    prompt: "Are you currently taking any prescription medication?",
    choices: [
      {
        value: "prescription",
        label: "Yes — prescription sleep or psychiatric medication",
      },
      { value: "other", label: "Other prescription medication" },
      { value: "none", label: "No prescription medication" },
    ],
  },
];

type Answers = Partial<Record<QuestionId, string>>;

interface Scored {
  product: QuizProduct;
  score: number;
  reasons: string[];
}

/** Map a completed answer set to 1–2 real sleep products with rationale. */
function scoreProducts(answers: Answers, products: QuizProduct[]): Scored[] {
  const scored: Scored[] = products.map((product) => {
    const traits = TRAITS[product.slug];
    let score = 0;
    const reasons: string[] = [];

    if (traits) {
      // Q1 — main complaint vs. what the product is best studied for.
      if (answers.complaint && traits.tags.includes(answers.complaint)) {
        if (answers.complaint === "jetlag" && traits.hasMelatonin) {
          score += 3;
          reasons.push(
            "melatonin has the strongest evidence for realigning sleep timing in jet lag and shift work",
          );
        } else {
          score += 2;
          const map: Record<string, string> = {
            onset: "it may support falling asleep faster",
            maintenance: "it may support staying asleep through the night",
            restlessness: "it may help you wind down and feel calmer at bedtime",
          };
          if (map[answers.complaint]) reasons.push(map[answers.complaint]);
        }
      }

      // Q3 — format preference.
      if (answers.form && answers.form !== "none") {
        if (traits.form === answers.form) {
          score += 3;
          reasons.push(`it comes in your preferred ${answers.form} format`);
        } else {
          score -= 1;
        }
      }

      // Q4 — next-day grogginess sensitivity.
      if (answers.grogginess === "sensitive") {
        if (traits.hasMelatonin) {
          score -= 2;
        } else {
          score += 2;
          reasons.push(
            "it's non-melatonin, so it's less likely to leave you groggy the next morning",
          );
        }
      }

      // Q2 — evening/afternoon caffeine pairs well with a calming, non-sedating option.
      if (
        (answers.caffeine === "evening" || answers.caffeine === "afternoon") &&
        product.slug === "sports-research-l-theanine"
      ) {
        score += 1;
        reasons.push(
          "L-theanine may take the edge off caffeine-driven alertness without sedation",
        );
      }
    }

    return { product, score, reasons };
  });

  // Rank by score, then by editorial rating as the tie-breaker.
  scored.sort(
    (a, b) => b.score - a.score || b.product.rating_overall - a.product.rating_overall,
  );

  const positive = scored.filter((s) => s.score > 0);
  // Always return at least one pick: fall back to the top-rated product.
  const picks = positive.length > 0 ? positive.slice(0, 2) : scored.slice(0, 1);
  return picks;
}

export default function SleepQuiz({ products }: { products: QuizProduct[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showResult, setShowResult] = useState(false);

  const total = QUESTIONS.length;
  const current = QUESTIONS[step];

  function choose(value: string) {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    if (step < total - 1) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setShowResult(false);
  }

  // ---- Result screen ------------------------------------------------------
  if (showResult) {
    const seesDoctorFirst = answers.medication === "prescription";
    const picks = scoreProducts(answers, products);

    return (
      <div>
        {seesDoctorFirst ? (
          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 px-5 py-5 sm:px-6">
            <h2 className="font-serif text-2xl font-bold text-brand-navy">
              Talk to your doctor first
            </h2>
            <p className="mt-3 text-base leading-relaxed text-brand-ink/85">
              Because you&apos;re taking a prescription sleep or psychiatric
              medication, the responsible next step isn&apos;t a supplement —
              it&apos;s a conversation with your prescriber or pharmacist.
              Common sleep supplements like melatonin, magnesium, and
              L-theanine can interact with sedatives, antidepressants, and
              other central-nervous-system medications. Your clinician can tell
              you what&apos;s safe alongside your specific prescription.
            </p>
            <p className="mt-3 text-base leading-relaxed text-brand-ink/85">
              When you&apos;re ready to research your options, our editorially
              independent ranking explains the evidence behind each ingredient:
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/best/${HUB_SLUG}`}
                className="rounded-md bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue"
              >
                See the Best Sleep Supplements ranking
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
              Your result
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-brand-navy sm:text-3xl">
              {picks.length > 1
                ? "Two evidence-based options to consider"
                : "Your best-matched sleep pick"}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-brand-ink/80">
              Based on your answers, here&apos;s where the research points. These
              may support better sleep for your situation — they aren&apos;t a
              treatment or a cure, and results vary from person to person.
            </p>

            <div className="mt-6 space-y-5">
              {picks.map(({ product, reasons }, i) => (
                <article
                  key={product.slug}
                  className="rounded-lg border border-brand-mist bg-white p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    {picks.length > 1 && (
                      <span className="font-serif text-lg font-bold text-brand-blue">
                        {i === 0 ? "Top match" : "Also worth a look"}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 font-serif text-xl font-bold text-brand-navy">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm text-brand-ink/70">
                    {product.price_summary}
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-brand-ink/85">
                    <strong className="font-semibold text-brand-navy">
                      Why it fits:
                    </strong>{" "}
                    {reasons.length > 0
                      ? `${reasons.join("; ")}.`
                      : `${product.best_for}.`}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4">
                    <Link
                      href={`/reviews/${product.slug}`}
                      className="text-sm font-semibold text-brand-blue hover:underline"
                    >
                      Read the full review →
                    </Link>
                    <Link
                      href={`/best/${HUB_SLUG}`}
                      className="text-sm font-semibold text-brand-blue hover:underline"
                    >
                      Compare all sleep picks →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Optional email offer — NEVER gates the result above. */}
        <div className="mt-8 rounded-lg border border-brand-navy/15 bg-brand-mist/50 px-5 py-6 sm:px-6">
          <h3 className="font-serif text-lg font-bold text-brand-navy">
            Want the full comparison guide?
          </h3>
          <p className="mt-1 text-sm text-brand-ink/75">
            Get our side-by-side breakdown of every sleep supplement — dosing,
            evidence, and value — plus new research as it lands.
          </p>
          <EmailSignup source="quiz" variant="compact" className="mt-4" />
        </div>

        <button
          type="button"
          onClick={restart}
          className="mt-6 text-sm font-semibold text-brand-blue hover:underline"
        >
          ↺ Retake the quiz
        </button>

        <MedicalDisclaimer className="mt-8" />
      </div>
    );
  }

  // ---- Question screen ----------------------------------------------------
  const progress = Math.round((step / total) * 100);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-brand-ink/60">
          <span>
            Question {step + 1} of {total}
          </span>
          <span>{progress}% complete</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-mist">
          <div
            className="h-full rounded-full bg-brand-blue transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h2 className="font-serif text-2xl font-bold text-brand-navy sm:text-3xl">
        {current.prompt}
      </h2>

      <div className="mt-6 space-y-3">
        {current.choices.map((choice) => {
          const selected = answers[current.id] === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              onClick={() => choose(choice.value)}
              className={`flex w-full items-center justify-between rounded-lg border px-5 py-4 text-left text-base font-medium transition-colors ${
                selected
                  ? "border-brand-blue bg-brand-blue/5 text-brand-navy"
                  : "border-brand-mist bg-white text-brand-ink hover:border-brand-blue/50 hover:bg-brand-mist/50"
              }`}
            >
              {choice.label}
              <span aria-hidden="true" className="text-brand-blue">
                →
              </span>
            </button>
          );
        })}
      </div>

      {step > 0 && (
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          className="mt-6 text-sm font-semibold text-brand-ink/60 hover:text-brand-navy"
        >
          ← Back
        </button>
      )}
    </div>
  );
}
