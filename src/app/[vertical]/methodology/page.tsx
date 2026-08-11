import type { Metadata } from "next";
import Link from "next/link";
import { getVertical } from "@/lib/verticals";
import { sharedHref, verticalUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string }>;
}): Promise<Metadata> {
  const { vertical: key } = await params;
  const v = getVertical(key);
  return {
    title: "How Firsthand Ranks and Reviews Products",
    description:
      v.methodologyMetaDescription ??
      "The published methodology behind every Firsthand ranking: Safety, Evidence Quality, Cost & Value, Transparency, and Customer Support — with fixed weights that affiliate partnerships never change.",
    alternates: { canonical: verticalUrl(key, "/methodology") },
  };
}

// The scoring criteria are driven by the ACTIVE vertical's config so every
// vertical publishes its own methodology. For Health this yields the exact same
// five rows (name = longLabel, weight = whole-percent of the fractional weight,
// detail = per-criterion description) that were previously hardcoded here.
function criteriaRows(verticalKey: string) {
  return getVertical(verticalKey).criteria.map((c) => ({
    name: c.longLabel ?? c.label,
    weight: `${Math.round(c.weight * 100)}%`,
    detail: c.description ?? "",
  }));
}

export default async function MethodologyPage({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  const { vertical: verticalKey } = await params;

  // Money publishes its own methodology prose (fees/returns/security instead of
  // clinical evidence), while the criteria table + intro read from config for
  // both. Health renders the original JSX below, byte-for-byte unchanged.
  if (verticalKey === "money") {
    return <MoneyMethodology verticalKey={verticalKey} />;
  }
  if (verticalKey === "tech") {
    return <TechMethodology verticalKey={verticalKey} />;
  }
  if (verticalKey === "education") {
    return <EducationMethodology verticalKey={verticalKey} />;
  }
  if (verticalKey === "travel") {
    return <TravelMethodology verticalKey={verticalKey} />;
  }
  return (
    <>
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            Methodology
          </p>
          <h1 className="mt-2 max-w-3xl font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
            How Firsthand Ranks and Reviews Products
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Self-contained answer block (GEO / AI-citation style) */}
        <div className="rounded-lg border-l-4 border-brand-navy bg-brand-mist px-5 py-4">
          <h2 className="font-serif text-lg font-bold text-brand-navy">
            Firsthand&apos;s methodology in brief
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink/90">
            Firsthand scores every health product and service on five published,
            fixed-weight criteria: Safety (30%), Evidence Quality (30%), Cost
            &amp; Value (20%), Transparency (10%), and Customer Support &amp;
            Experience (10%). Safety scoring draws on ingredient and provider
            safety profiles plus FDA warnings; evidence scoring rests on
            peer-reviewed clinical research, with randomized controlled trials
            weighted highest. Firsthand reviews products it earns no commission
            from as well as products it does; rankings are never sold, and
            affiliate partnerships never change a score. Every money page
            lists cons and red flags alongside benefits, is medically reviewed
            before publication, and carries a visible last-updated date. The
            same rubric applies to every product in a category, so scores are
            directly comparable — a product can rank first while Firsthand earns
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
            every Firsthand ranking are published on this page, and they apply
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
              {criteriaRows(verticalKey).map((c) => (
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
              href={sharedHref(verticalKey, "/affiliate-disclosure")}
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
              href={sharedHref(verticalKey, "/editorial-policy")}
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
function MoneyMethodology({ verticalKey }: { verticalKey: string }) {
  const vertical = getVertical(verticalKey);
  return (
    <>
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            Methodology
          </p>
          <h1 className="mt-2 max-w-3xl font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
            How Firsthand Money Ranks and Reviews Products
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Self-contained answer block (GEO / AI-citation style) */}
        <div className="rounded-lg border-l-4 border-brand-navy bg-brand-mist px-5 py-4">
          <h2 className="font-serif text-lg font-bold text-brand-navy">
            Firsthand Money&apos;s methodology in brief
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink/90">
            Firsthand Money scores every savings account, app, and money tool on
            five published, fixed-weight criteria: Fees (25%), Value &amp;
            Returns (25%), Transparency (20%), Security &amp; Trust (15%), and
            Customer Support &amp; Experience (15%). Facts about fees, minimums,
            and APYs are drawn only from each provider&apos;s official
            disclosures — bank rate and fee schedules, official pricing pages —
            and from regulators (CFPB, FDIC, NCUA, SEC, FINRA, IRS, and the
            Federal Reserve), never from aggregators. Because rates and fees
            change, every number in a review is cited to a primary source with
            an &quot;as of&quot; date; where a figure cannot be verified, we
            describe it qualitatively rather than guess. Firsthand Money is
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
              {criteriaRows(verticalKey).map((c) => (
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
              href={sharedHref(verticalKey, "/affiliate-disclosure")}
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
            source before a page is published. Firsthand does not employ a
            licensed financial advisor; this is editorial fact-checking, not
            professional advice. See our{" "}
            <Link
              href={sharedHref(verticalKey, "/editorial-policy")}
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

/**
 * Tech-vertical methodology page. Same layout/styling as the Health/Money
 * versions, but the prose describes how technology products are evaluated —
 * from manufacturer specifications and official documentation rather than
 * hands-on lab testing. The no-lab-testing disclosure is stated explicitly and
 * repeatedly. The criteria table + intro read from the same config-driven
 * `CRITERIA` array (tech weights: Performance 30%, Value 25%, Reliability &
 * Security 20%, Ease of Use 15%, Support 10%).
 */
function TechMethodology({ verticalKey }: { verticalKey: string }) {
  const vertical = getVertical(verticalKey);
  return (
    <>
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            Methodology
          </p>
          <h1 className="mt-2 max-w-3xl font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
            How Firsthand Tech Ranks and Reviews Products
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Self-contained answer block (GEO / AI-citation style) */}
        <div className="rounded-lg border-l-4 border-brand-navy bg-brand-mist px-5 py-4">
          <h2 className="font-serif text-lg font-bold text-brand-navy">
            Firsthand Tech&apos;s methodology in brief
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink/90">
            Firsthand Tech scores every product on five published, fixed-weight
            criteria: Performance (30%), Value (25%), Reliability &amp; Security
            (20%), Ease of Use (15%), and Support (10%). Crucially, Firsthand
            does NOT operate a hardware or audio lab: we do not run independent
            benchmarks and we do not conduct hands-on performance, audio, or
            battery testing. Every rating is built from analysis of primary
            documentation — manufacturer-published specification sheets, official
            pricing pages, official security and audit documentation (SOC 2, ISO
            27001, FedRAMP), FCC filings, and publicly documented third-party
            audits and certifications. Because specs and prices change, every
            number is cited to a primary source with an &quot;as of&quot; date;
            where a figure cannot be verified we describe it qualitatively or
            omit it rather than guess. Manufacturer-rated figures are reported as
            manufacturer-rated, never as measured results, and we never present a
            subjective quality judgment as if it came from testing we did not do.
            Firsthand Tech is reader-supported and may earn affiliate commissions,
            but that compensation never changes a score or a ranking. Every
            review lists at least one genuine con and is editorially
            fact-checked against its cited sources before publication.
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
              {criteriaRows(verticalKey).map((c) => (
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
          We analyze documentation — we do not run a lab
        </h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-brand-ink/90">
          <p>
            This is the most important thing to understand about our tech
            ratings: Firsthand does not conduct independent lab testing. We do not
            benchmark processors, we do not measure noise cancellation or audio
            quality, and we do not run our own battery-drain tests. Any site that
            claims a &quot;best sound we heard&quot; verdict is describing a
            hands-on test; we are not, and we will not present a rating as if we
            did one.
          </p>
          <p>
            Instead, Performance and the other criteria are assessed from primary
            documentation: manufacturer specification sheets, official pricing
            pages, published security and audit reports, FCC equipment filings,
            and standards-body publications. When a manufacturer rates a battery
            at &quot;up to 8 hours,&quot; we report it as a manufacturer-rated
            figure and cite the official source with an &quot;as of&quot; date —
            we do not restate it as a measured result. Where a claim cannot be
            verified from a primary source, we describe it qualitatively or leave
            it out. We never invent a specification, a benchmark, or a test
            result.
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
            Category rankings include products with no affiliate relationship. If
            the best product in a category pays us nothing, it still ranks where
            the rubric puts it.
          </li>
          <li>
            <strong className="font-semibold">Rankings are never sold.</strong>{" "}
            No company can pay for a position, a score, or a favorable sentence.
            There are no &quot;sponsored&quot; slots inside our rankings.
          </li>
          <li>
            <strong className="font-semibold">
              Affiliate commissions never change scores.
            </strong>{" "}
            Scoring is completed against the rubric before monetization is
            considered.{" "}
            <Link
              href={sharedHref(verticalKey, "/affiliate-disclosure")}
              className="font-semibold text-brand-blue hover:underline"
            >
              Read our full affiliate disclosure.
            </Link>
          </li>
          <li>
            <strong className="font-semibold">
              Every review lists at least one genuine con.
            </strong>{" "}
            If we recommend a product, we also tell you where it falls short —
            ecosystem lock-in, a subscription cost, a shorter battery rating, or
            a missing feature.
          </li>
          <li>
            <strong className="font-semibold">
              Every review is editorially fact-checked.
            </strong>{" "}
            Our editorial team checks each figure against its cited primary
            source before a page is published. Firsthand does not run a lab; this
            is documentation analysis and editorial fact-checking, not a hands-on
            test. See our{" "}
            <Link
              href={sharedHref(verticalKey, "/editorial-policy")}
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
            Specs and prices change. Each ranking and review shows when it was
            last updated and dates every figure that can change, and we re-check
            pages when a spec, price, or model changes.
          </li>
        </ul>

        <h2 className="mt-12 font-serif text-2xl font-bold text-brand-navy">
          What a score means
        </h2>
        <p className="mt-4 text-base leading-relaxed text-brand-ink/90">
          Each criterion is scored 0–10 against the rubric above, multiplied by
          its weight, and summed into a final score out of 10. Products in the
          same category are scored against the same rubric, so scores are
          directly comparable within a ranking. A high score is not a guarantee
          of quality — it means the product looked strong, on its documented
          specifications and official pricing, on performance, value,
          reliability and security, ease of use, and support relative to its
          competitors. This content is informational only and is not
          professional advice; verify current specifications and pricing on the
          manufacturer&apos;s official page before purchasing.
        </p>
      </section>
    </>
  );
}

/**
 * Education-vertical methodology page. Same layout/styling as the other
 * verticals, but the prose describes how learning programs and education tools
 * are evaluated — from officially published data (accreditor databases, U.S.
 * Department of Education sources, provider documentation) rather than
 * independent audits of schools or student surveys. The no-independent-audit
 * disclosure is stated explicitly and repeatedly, and self-reported outcome
 * figures are described as such. The criteria table + intro read from the same
 * config-driven `CRITERIA` array (education weights: Outcomes 30%, Cost & Value
 * 25%, Academics 20%, Support Services 15%, Flexibility 10%).
 */
function EducationMethodology({ verticalKey }: { verticalKey: string }) {
  const vertical = getVertical(verticalKey);
  return (
    <>
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            Methodology
          </p>
          <h1 className="mt-2 max-w-3xl font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
            How Firsthand Education Ranks and Reviews Programs
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Self-contained answer block (GEO / AI-citation style) */}
        <div className="rounded-lg border-l-4 border-brand-navy bg-brand-mist px-5 py-4">
          <h2 className="font-serif text-lg font-bold text-brand-navy">
            Firsthand Education&apos;s methodology in brief
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink/90">
            Firsthand Education scores every learning program and tool on five
            published, fixed-weight criteria: Outcomes (30%), Cost &amp; Value
            (25%), Academics (20%), Support Services (15%), and Flexibility
            (10%). Crucially, Firsthand does NOT independently audit schools or
            programs, and it does NOT conduct student surveys. Every rating is
            built from analysis of officially published data — accreditor
            databases and the U.S. Department of Education&apos;s Database of
            Accredited Postsecondary Institutions and Programs (DAPIP), U.S.
            Department of Education sources such as College Scorecard, the Bureau
            of Labor Statistics, and each provider&apos;s own published pricing,
            curriculum, accreditation, and outcomes documentation. Because prices
            and programs change, every number is cited to a primary source with
            an &quot;as of&quot; date; where a figure cannot be verified we
            describe it qualitatively or omit it rather than guess. When a
            provider&apos;s completion, placement, or salary numbers are
            self-reported and unaudited, we label them as self-reported and never
            present them as independently verified. Firsthand Education is
            reader-supported and may earn affiliate commissions, but that
            compensation never changes a score or a ranking. Every review lists
            at least one genuine con and is editorially fact-checked against its
            cited sources before publication. This is informational content, not
            academic, career, or financial advice.
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
              {criteriaRows(verticalKey).map((c) => (
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
          We analyze published data — we do not audit schools or survey students
        </h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-brand-ink/90">
          <p>
            This is the most important thing to understand about our education
            ratings: Firsthand does not independently audit schools or programs,
            and we do not conduct student surveys. We do not verify a
            provider&apos;s internal completion, placement, or salary figures
            ourselves, and we will not present a self-reported number as if it
            were independently confirmed.
          </p>
          <p>
            Instead, every criterion is assessed from primary documentation:
            accreditor databases and the Department of Education&apos;s DAPIP for
            accreditation, College Scorecard and the Bureau of Labor Statistics
            for outcome and wage context, standardized bootcamp reports such as
            CIRR where they exist, and each provider&apos;s own published pricing,
            curriculum, and outcomes pages. When a provider reports its own
            outcomes, we label them as self-reported and cite the primary
            document. Where a claim cannot be verified from a primary source, we
            describe it qualitatively or leave it out. We never invent a price,
            an accreditation status, a placement rate, or a salary figure.
          </p>
        </div>

        <h2 className="mt-12 font-serif text-2xl font-bold text-brand-navy">
          Independence: how compensation never touches the scores
        </h2>
        <ul className="mt-4 list-disc space-y-3 pl-6 text-base leading-relaxed text-brand-ink/90">
          <li>
            <strong className="font-semibold">
              We review programs we don&apos;t earn from.
            </strong>{" "}
            Category rankings include programs with no affiliate relationship —
            including free, nonprofit options. If the best option in a category
            pays us nothing, it still ranks where the rubric puts it.
          </li>
          <li>
            <strong className="font-semibold">Rankings are never sold.</strong>{" "}
            No provider can pay for a position, a score, or a favorable sentence.
            There are no &quot;sponsored&quot; slots inside our rankings.
          </li>
          <li>
            <strong className="font-semibold">
              Affiliate commissions never change scores.
            </strong>{" "}
            Scoring is completed against the rubric before monetization is
            considered.{" "}
            <Link
              href={sharedHref(verticalKey, "/affiliate-disclosure")}
              className="font-semibold text-brand-blue hover:underline"
            >
              Read our full affiliate disclosure.
            </Link>
          </li>
          <li>
            <strong className="font-semibold">
              Every review lists at least one genuine con.
            </strong>{" "}
            If we recommend a program, we also tell you where it falls short — a
            missing free tier, a certificate that isn&apos;t accreditation, an
            open marketplace with variable quality, or a subscription cost.
          </li>
          <li>
            <strong className="font-semibold">
              Self-reported outcomes are labeled as self-reported.
            </strong>{" "}
            When a provider publishes its own completion, placement, or salary
            numbers, we attribute them to the provider and never present them as
            independently verified. Firsthand does not audit programs; this is
            documentation analysis and editorial fact-checking, not an audit or a
            survey. See our{" "}
            <Link
              href={sharedHref(verticalKey, "/editorial-policy")}
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
            Prices, programs, and accreditation change. Each ranking and review
            shows when it was last updated and dates every figure that can
            change, and we re-check pages when pricing, curriculum, or
            accreditation changes.
          </li>
        </ul>

        <h2 className="mt-12 font-serif text-2xl font-bold text-brand-navy">
          What a score means
        </h2>
        <p className="mt-4 text-base leading-relaxed text-brand-ink/90">
          Each criterion is scored 0–10 against the rubric above, multiplied by
          its weight, and summed into a final score out of 10. Programs in the
          same category are scored against the same rubric, so scores are
          directly comparable within a ranking. A high score is not a guarantee
          of a job, a credential&apos;s value, or a learning outcome — it means
          the program looked strong, on its published pricing, curriculum,
          accreditation, and documented outcomes, on outcomes, cost and value,
          academics, support, and flexibility relative to its competitors. This
          content is informational only and is not academic, career, or
          financial advice; verify current details with the provider and
          official sources before enrolling.
        </p>
      </section>
    </>
  );
}

/**
 * Travel-vertical methodology page. Same layout/styling as the other verticals,
 * but the prose describes how travel services and gear are evaluated — from
 * officially published documentation (DOT consumer protection rules, insurers'
 * plan documents and policy wording, manufacturers' spec sheets and warranty
 * terms) rather than press trips, claims experience, lab testing, or traveler
 * surveys. The no-first-hand-testing disclosure is stated explicitly and
 * repeatedly, quote-based pricing is compared on published plan structure, and
 * state-by-state insurance variation is disclosed. The criteria table + intro
 * read from the same config-driven `CRITERIA` array (travel weights: Value 30%,
 * Experience 25%, Flexibility 20%, Transparency 15%, Service 10%).
 */
function TravelMethodology({ verticalKey }: { verticalKey: string }) {
  const vertical = getVertical(verticalKey);
  return (
    <>
      <section className="border-b border-brand-mist bg-brand-mist/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
            Methodology
          </p>
          <h1 className="mt-2 max-w-3xl font-serif text-3xl font-bold text-brand-navy sm:text-4xl">
            How Firsthand Travel Ranks and Reviews Services &amp; Gear
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Self-contained answer block (GEO / AI-citation style) */}
        <div className="rounded-lg border-l-4 border-brand-navy bg-brand-mist px-5 py-4">
          <h2 className="font-serif text-lg font-bold text-brand-navy">
            Firsthand Travel&apos;s methodology in brief
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink/90">
            Firsthand Travel scores every travel service and product on five
            published, fixed-weight criteria: Value (30%), Experience (25%),
            Flexibility (20%), Transparency (15%), and Service (10%).
            Crucially, Firsthand does NOT take press trips, stay in hotels for
            review, file insurance claims, lab-test gear, or survey travelers —
            and it is not an insurance agency, broker, or producer. Every
            rating is built from analysis of officially published
            documentation: U.S. Department of Transportation aviation consumer
            protection rules, each insurer&apos;s own published plan pages and
            policy wording, each manufacturer&apos;s published specifications
            and warranty terms, and each provider&apos;s official policy pages.
            Travel pricing is unusually dynamic — insurance premiums are
            quote-based and vary by trip cost, traveler age, dates, and state —
            so quote-based products are compared on published plan structure
            rather than a single price, every verifiable figure is cited to a
            primary source with an &quot;as of&quot; date, and where a figure
            cannot be verified we describe it qualitatively or omit it rather
            than guess. Insurance benefits and availability vary by state, and
            we say so wherever it applies. Firsthand Travel is reader-supported
            and may earn affiliate commissions, but that compensation never
            changes a score or a ranking. Every review lists at least one
            genuine con and is editorially fact-checked against its cited
            sources before publication. This is informational content, not
            travel, insurance, financial, or legal advice.
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
              {criteriaRows(verticalKey).map((c) => (
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
          We analyze published documentation — we do not test, travel, or file
          claims
        </h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-brand-ink/90">
          <p>
            This is the most important thing to understand about our travel
            ratings: Firsthand does not take press trips or review stays, does
            not file insurance claims, does not lab-test luggage or gear, and
            does not survey travelers. We are also not an insurance agency,
            broker, or producer, and we do not sell policies. We will not
            present a claims experience we never had, a durability result we
            never measured, or a service reputation we cannot verify.
          </p>
          <p>
            Instead, every criterion is assessed from primary documentation:
            the U.S. Department of Transportation&apos;s aviation consumer
            protection rules for the refund and delay rights that apply
            regardless of what you bought, each insurer&apos;s published plan
            pages and state-specific policy wording for what a plan actually
            covers, each manufacturer&apos;s published dimensions, weights,
            materials, warranty, and trial terms for gear, and each
            provider&apos;s official policy pages for cancellation, change, and
            support commitments. Where pricing is quote-based — as travel
            insurance is — we compare published plan structures and say the
            price varies rather than inventing a representative premium. Where
            a claim cannot be verified from a primary source, we describe it
            qualitatively or leave it out. We never invent a price, a coverage
            limit, a warranty term, or a policy condition.
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
            Category rankings include products and providers with no affiliate
            relationship. If the best option in a category pays us nothing, it
            still ranks where the rubric puts it.
          </li>
          <li>
            <strong className="font-semibold">Rankings are never sold.</strong>{" "}
            No provider can pay for a position, a score, or a favorable
            sentence. There are no &quot;sponsored&quot; slots inside our
            rankings.
          </li>
          <li>
            <strong className="font-semibold">
              Affiliate commissions never change scores.
            </strong>{" "}
            Scoring is completed against the rubric before monetization is
            considered.{" "}
            <Link
              href={sharedHref(verticalKey, "/affiliate-disclosure")}
              className="font-semibold text-brand-blue hover:underline"
            >
              Read our full affiliate disclosure.
            </Link>
          </li>
          <li>
            <strong className="font-semibold">
              Every review lists at least one genuine con.
            </strong>{" "}
            If we recommend a product or provider, we also tell you where it
            falls short — a quote-only price you can&apos;t compare easily, a
            warranty that excludes airline damage, a short review period, or a
            benefit that varies by state.
          </li>
          <li>
            <strong className="font-semibold">
              State variation and conditions are disclosed.
            </strong>{" "}
            Travel insurance benefits, Cancel For Any Reason availability, and
            policy terms vary by state and by traveler. When a benefit is
            conditional — a purchase window, a cancellation deadline, a
            partial-reimbursement cap — we state the condition instead of
            presenting the headline benefit alone. See our{" "}
            <Link
              href={sharedHref(verticalKey, "/editorial-policy")}
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
            Prices, plans, warranties, and policies change. Each ranking and
            review shows when it was last updated and dates every figure that
            can change, and we re-check pages when a provider&apos;s published
            documentation changes.
          </li>
        </ul>

        <h2 className="mt-12 font-serif text-2xl font-bold text-brand-navy">
          What a score means
        </h2>
        <p className="mt-4 text-base leading-relaxed text-brand-ink/90">
          Each criterion is scored 0–10 against the rubric above, multiplied by
          its weight, and summed into a final score out of 10. Products and
          providers in the same category are scored against the same rubric, so
          scores are directly comparable within a ranking. A high score is not a
          guarantee of a smooth trip, an approved claim, or a durable product —
          it means the product or service looked strong, on its published
          pricing, documentation, policies, and support commitments, on value,
          experience, flexibility, transparency, and service relative to its
          competitors. This content is informational only and is not travel,
          insurance, financial, or legal advice; verify current terms in the
          provider&apos;s official documents before buying or booking.
        </p>
      </section>
    </>
  );
}
