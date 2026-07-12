import type { Metadata } from "next";
import Link from "next/link";
import { getActiveVertical } from "@/lib/verticals";

export const metadata: Metadata = {
  title: "How Vivahale Ranks and Reviews Products",
  description:
    getActiveVertical().methodologyMetaDescription ??
    "The published methodology behind every Vivahale ranking: Safety, Evidence Quality, Cost & Value, Transparency, and Customer Support — with fixed weights that affiliate partnerships never change.",
  alternates: { canonical: "/methodology" },
};

// The scoring criteria are driven by the ACTIVE vertical's config so every
// vertical publishes its own methodology. For Health this yields the exact same
// five rows (name = longLabel, weight = whole-percent of the fractional weight,
// detail = per-criterion description) that were previously hardcoded here.
const CRITERIA = getActiveVertical().criteria.map((c) => ({
  name: c.longLabel ?? c.label,
  weight: `${Math.round(c.weight * 100)}%`,
  detail: c.description ?? "",
}));

export default function MethodologyPage() {
  // Money publishes its own methodology prose (fees/returns/security instead of
  // clinical evidence), while the criteria table + intro read from config for
  // both. Health renders the original JSX below, byte-for-byte unchanged.
  if (getActiveVertical().key === "money") {
    return <MoneyMethodology />;
  }
  return (
    <>
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            Methodology
          </p>
          <h1 className="mt-2 max-w-3xl font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
            How Vivahale Ranks and Reviews Products
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Self-contained answer block (GEO / AI-citation style) */}
        <div className="rounded-lg border-l-4 border-brand-navy bg-brand-mist px-5 py-4">
          <h2 className="font-serif text-lg font-bold text-brand-navy">
            Vivahale&apos;s methodology in brief
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink/90">
            Vivahale scores every health product and service on five published,
            fixed-weight criteria: Safety (30%), Evidence Quality (30%), Cost
            &amp; Value (20%), Transparency (10%), and Customer Support &amp;
            Experience (10%). Safety scoring draws on ingredient and provider
            safety profiles plus FDA warnings; evidence scoring rests on
            peer-reviewed clinical research, with randomized controlled trials
            weighted highest. Vivahale reviews products it earns no commission
            from as well as products it does; rankings are never sold, and
            affiliate partnerships never change a score. Every money page
            lists cons and red flags alongside benefits, is medically reviewed
            before publication, and carries a visible last-updated date. The
            same rubric applies to every product in a category, so scores are
            directly comparable — a product can rank first while Vivahale earns
            nothing from it. The full rubric below explains each criterion in
            detail, including how manufacturer-funded studies and regulatory
            warnings are handled.
          </p>
        </div>

        <div className="mt-10 space-y-4 text-base leading-relaxed text-brand-ink/90">
          <p>
            Most review sites keep their scoring rules vague, which makes it
            impossible to tell an honest recommendation from a paid one. We
            take the opposite approach: the exact criteria and weights behind
            every Vivahale ranking are published on this page, and they apply
            to every product in a category — whether or not we have any
            financial relationship with its maker.
          </p>
        </div>

        <h2 className="mt-12 font-serif text-2xl font-bold text-brand-navy">
          The five scoring criteria
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-brand-navy">
                <th scope="col" className="py-3 pr-4 font-sans font-semibold text-brand-navy">
                  Criterion
                </th>
                <th scope="col" className="py-3 pr-4 font-sans font-semibold text-brand-navy">
                  Weight
                </th>
                <th scope="col" className="py-3 font-sans font-semibold text-brand-navy">
                  What we evaluate
                </th>
              </tr>
            </thead>
            <tbody>
              {CRITERIA.map((c) => (
                <tr key={c.name} className="border-b border-brand-mist align-top">
                  <th scope="row" className="py-3 pr-4 font-sans font-semibold text-brand-ink">
                    {c.name}
                  </th>
                  <td className="py-3 pr-4 font-semibold text-brand-blue">
                    {c.weight}
                  </td>
                  <td className="py-3 leading-relaxed text-brand-ink/85">
                    {c.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-12 font-serif text-2xl font-bold text-brand-navy">
          How we weigh the evidence
        </h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-brand-ink/90">
          <p>
            Evidence Quality is scored from the primary literature, not press
            releases. We search PubMed and NIH trial registries for studies on
            the product&apos;s actual formulation or service model. Randomized
            controlled trials count most; systematic reviews and meta-analyses
            of those trials strengthen a score further. Small pilot studies,
            animal research, and in-vitro results are noted but weighted
            lightly. A study funded by the manufacturer isn&apos;t disqualified,
            but we say so, and we look for independent replication.
          </p>
          <p>
            Safety scoring starts with the same literature and adds regulatory
            signals: FDA warning letters, recalls, adverse-event reports, and
            — for telehealth providers — the clinical oversight built into
            their prescribing process.
          </p>
        </div>

        <h2 className="mt-12 font-serif text-2xl font-bold text-brand-navy">
          Independence: how money never touches the scores
        </h2>
        <ul className="mt-4 list-disc space-y-3 pl-6 text-base leading-relaxed text-brand-ink/90">
          <li>
            <strong className="font-semibold">
              We review products we don&apos;t earn from.
            </strong>{" "}
            Category rankings include products and providers that pay us
            nothing. If the best product in a category has no affiliate
            program, it still ranks where the rubric puts it.
          </li>
          <li>
            <strong className="font-semibold">Rankings are never sold.</strong>{" "}
            No company can pay for a position, a score, or a favorable
            sentence. There are no &quot;sponsored&quot; slots inside our
            rankings.
          </li>
          <li>
            <strong className="font-semibold">
              Affiliate partnerships never change scores.
            </strong>{" "}
            Scoring is completed against the rubric before monetization is
            considered. Whether a link earns a commission has no input into
            any criterion.{" "}
            <Link
              href="/affiliate-disclosure"
              className="font-semibold text-brand-blue hover:underline"
            >
              Read our full affiliate disclosure.
            </Link>
          </li>
          <li>
            <strong className="font-semibold">
              Every money page lists cons and red flags.
            </strong>{" "}
            If we recommend a product, we also tell you who it&apos;s wrong
            for, what the side effects are, and where the evidence is thin.
          </li>
          <li>
            <strong className="font-semibold">
              Every money page is editorially fact-checked.
            </strong>{" "}
            Our editorial team checks health claims against their cited sources
            before a monetized health page is published. See our{" "}
            <Link
              href="/editorial-policy"
              className="font-semibold text-brand-blue hover:underline"
            >
              editorial policy
            </Link>
            .
          </li>
          <li>
            <strong className="font-semibold">
              Pages carry last-updated dates.
            </strong>{" "}
            Evidence changes. Each ranking and review displays when it was last
            updated, and we re-check pages when new trials, recalls, or pricing
            changes warrant it.
          </li>
        </ul>

        <h2 className="mt-12 font-serif text-2xl font-bold text-brand-navy">
          What a score means
        </h2>
        <p className="mt-4 text-base leading-relaxed text-brand-ink/90">
          Each criterion is scored 0–10 against the rubric above, multiplied by
          its weight, and summed into a final score out of 10. Products in the
          same category are scored against the same rubric on the same day, so
          scores are directly comparable within a ranking. A high score is not
          a medical endorsement — it means the product performed well on
          safety, evidence, value, transparency, and support relative to its
          competitors. Talk to your clinician before acting on any ranking.
        </p>
      </section>
    </>
  );
}

/**
 * Money-vertical methodology page. Same layout/styling as the Health version,
 * but the prose describes how personal-finance products are evaluated (fees,
 * variable APYs cited as-of a date, security/insurance, transparency) instead
 * of clinical evidence. The criteria table + intro read from the same
 * config-driven `CRITERIA` array (money weights: Fees 25%, Value & Returns 25%,
 * Transparency 20%, Security & Trust 15%, Support 15%).
 */
function MoneyMethodology() {
  const vertical = getActiveVertical();
  return (
    <>
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            Methodology
          </p>
          <h1 className="mt-2 max-w-3xl font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
            How Vivahale Money Ranks and Reviews Products
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Self-contained answer block (GEO / AI-citation style) */}
        <div className="rounded-lg border-l-4 border-brand-navy bg-brand-mist px-5 py-4">
          <h2 className="font-serif text-lg font-bold text-brand-navy">
            Vivahale Money&apos;s methodology in brief
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink/90">
            Vivahale Money scores every savings account, app, and money tool on
            five published, fixed-weight criteria: Fees (25%), Value &amp;
            Returns (25%), Transparency (20%), Security &amp; Trust (15%), and
            Customer Support &amp; Experience (15%). Facts about fees, minimums,
            and APYs are drawn only from each provider&apos;s official
            disclosures — bank rate and fee schedules, official pricing pages —
            and from regulators (CFPB, FDIC, NCUA, SEC, FINRA, IRS, and the
            Federal Reserve), never from aggregators. Because rates and fees
            change, every number in a review is cited to a primary source with
            an &quot;as of&quot; date; where a figure cannot be verified, we
            describe it qualitatively rather than guess. Vivahale Money is
            reader-supported and may earn advertiser compensation, but that
            compensation never changes a score or a ranking — placement follows
            this published methodology. Every review lists at least one genuine
            con, and content is editorially fact-checked against its cited
            sources before publication. This is informational content, not
            financial, investment, tax, or legal advice.
          </p>
        </div>

        <div className="mt-10 space-y-4 text-base leading-relaxed text-brand-ink/90">
          <p>{vertical.methodologyIntro}</p>
        </div>

        <h2 className="mt-12 font-serif text-2xl font-bold text-brand-navy">
          The five scoring criteria
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-brand-navy">
                <th scope="col" className="py-3 pr-4 font-sans font-semibold text-brand-navy">
                  Criterion
                </th>
                <th scope="col" className="py-3 pr-4 font-sans font-semibold text-brand-navy">
                  Weight
                </th>
                <th scope="col" className="py-3 font-sans font-semibold text-brand-navy">
                  What we evaluate
                </th>
              </tr>
            </thead>
            <tbody>
              {CRITERIA.map((c) => (
                <tr key={c.name} className="border-b border-brand-mist align-top">
                  <th scope="row" className="py-3 pr-4 font-sans font-semibold text-brand-ink">
                    {c.name}
                  </th>
                  <td className="py-3 pr-4 font-semibold text-brand-blue">
                    {c.weight}
                  </td>
                  <td className="py-3 leading-relaxed text-brand-ink/85">
                    {c.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-12 font-serif text-2xl font-bold text-brand-navy">
          How we read the sources
        </h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-brand-ink/90">
          <p>
            Fees, minimums, and rates are taken from the primary source: the
            provider&apos;s official fee schedule, rate page, or pricing page,
            or a regulator&apos;s publication. Savings APYs are variable and
            banks publish them dynamically, so we cite each rate to the
            bank&apos;s official page with an &quot;as of&quot; date rather than
            repeat a number that may already be stale — and we link that page so
            you can confirm the current figure before you open an account.
          </p>
          <p>
            Security &amp; Trust starts with insurance: for deposit products we
            confirm FDIC (or, for credit unions, NCUA) coverage at the
            institution level using FDIC BankFind, and note the standard
            $250,000-per-depositor, per-ownership-category limit. For apps we
            read the company&apos;s official security documentation — encryption,
            read-only account aggregation, multi-factor authentication, and
            whether the company sells customer data. Where a claim cannot be
            verified from a primary source, we describe it qualitatively or omit
            it; we never invent a number.
          </p>
        </div>

        <h2 className="mt-12 font-serif text-2xl font-bold text-brand-navy">
          Independence: how compensation never touches the scores
        </h2>
        <ul className="mt-4 list-disc space-y-3 pl-6 text-base leading-relaxed text-brand-ink/90">
          <li>
            <strong className="font-semibold">
              We review products we don&apos;t earn from.
            </strong>{" "}
            Category rankings include providers that pay us nothing. If the best
            product in a category has no affiliate or advertiser relationship,
            it still ranks where the rubric puts it.
          </li>
          <li>
            <strong className="font-semibold">Rankings are never sold.</strong>{" "}
            No company can pay for a position, a score, or a favorable sentence.
            There are no &quot;sponsored&quot; slots inside our rankings.
          </li>
          <li>
            <strong className="font-semibold">
              Advertiser compensation never changes scores.
            </strong>{" "}
            Scoring is completed against the rubric before monetization is
            considered. Whether a link earns compensation has no input into any
            criterion.{" "}
            <Link
              href="/affiliate-disclosure"
              className="font-semibold text-brand-blue hover:underline"
            >
              Read our full advertiser disclosure.
            </Link>
          </li>
          <li>
            <strong className="font-semibold">
              Every review lists at least one genuine con.
            </strong>{" "}
            If we recommend a product, we also tell you where it falls short —
            a variable rate that can drop, a subscription cost, a learning
            curve, or a missing feature.
          </li>
          <li>
            <strong className="font-semibold">
              Every review is editorially fact-checked.
            </strong>{" "}
            Our editorial team checks each figure against its cited primary
            source before a page is published. Vivahale does not employ a
            licensed financial advisor; this is editorial fact-checking, not
            professional advice. See our{" "}
            <Link
              href="/editorial-policy"
              className="font-semibold text-brand-blue hover:underline"
            >
              editorial policy
            </Link>
            .
          </li>
          <li>
            <strong className="font-semibold">
              Pages carry as-of dates.
            </strong>{" "}
            Rates and fees change. Each ranking and review shows when it was
            last updated and dates every rate or fee, and we re-check pages when
            pricing or terms change.
          </li>
        </ul>

        <h2 className="mt-12 font-serif text-2xl font-bold text-brand-navy">
          What a score means
        </h2>
        <p className="mt-4 text-base leading-relaxed text-brand-ink/90">
          Each criterion is scored 0–10 against the rubric above, multiplied by
          its weight, and summed into a final score out of 10. Providers in the
          same category are scored against the same rubric, so scores are
          directly comparable within a ranking. A high score is not a
          recommendation to buy — it means the product performed well on fees,
          value, transparency, security, and support relative to its
          competitors. This content is informational only and is not financial,
          investment, tax, or legal advice; consider consulting a qualified
          financial professional about your situation.
        </p>
      </section>
    </>
  );
}
