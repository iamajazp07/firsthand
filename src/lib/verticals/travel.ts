import type { Vertical } from "./types";

/**
 * Travel vertical config — Firsthand Travel (travel.readfirsthand.com).
 *
 * Evidence-first reviews and rankings of travel services and gear. CRITICAL
 * honesty constraint: Firsthand does NOT take press trips, stay in hotels for
 * review, file insurance claims, lab-test gear, or survey travelers — and it is
 * NOT an insurance agency, broker, or producer and does not sell policies.
 * Every rating is built from analysis of officially published documentation:
 * U.S. Department of Transportation aviation consumer protection rules, each
 * insurer's own published plan pages and policy wording, each manufacturer's
 * published specifications and warranty terms, and airlines' and providers'
 * official policy pages. Travel pricing is unusually dynamic — insurance is
 * quote-based and varies by trip cost, traveler age, and state; fares and room
 * rates change constantly — so every figure is cited to a primary source with
 * an "as of" date, and where a price cannot be verified we describe it
 * qualitatively or omit it rather than guess. Insurance benefits and
 * availability vary by state; we say so wherever it applies.
 *
 * The spec's example criteria (location, amenities) only fit ranking specific
 * hotels, which cannot be honestly scored from published documentation alone —
 * so this vertical refines them (as the spec invites) to five criteria that a
 * published-documentation methodology CAN honestly assess across insurance,
 * gear, and booking services: Value, Experience, Flexibility, Transparency,
 * Service.
 *
 * Brand consistency (like U.S. News): Travel shares the SAME Firsthand brand
 * palette as the other verticals for now. `theme` is read from this config
 * wherever brand tokens are wired, so differentiating later is a one-line change.
 *
 * Keep this module free of Next.js imports (proxy/script-safe).
 */
export const travel: Vertical = {
  key: "travel",
  name: "Firsthand Travel",
  host: "readfirsthand.com",
  tagline: "Evidence-First Reviews of Travel Services & Gear",
  description:
    "Firsthand Travel is an independent travel review site. We read the official record: U.S. Department of Transportation consumer protection rules, insurers' published plan documents and policy wording, and manufacturers' published specifications and warranty terms: to rank travel insurance, luggage and gear, and travel services clearly and without hype. We don't take press trips, file claims, or lab-test products; our ratings analyze published documentation, not first-hand testing.",

  // SAME shared Firsthand brand palette as the other verticals (brand consistency).
  theme: {
    brandNavy: "#0b3d6e",
    brandBlue: "#1a6fd4",
    brandMist: "#f1f5f9",
    brandInk: "#1e293b",
    brandWhite: "#ffffff",
  },

  navPrimaryCount: 6,

  // The travel-news section renders the timely news-list layout.
  newsCategorySlugs: ["travel-news"],

  categories: [
    "travel-insurance",
    "travel-gear",
    "flights-airlines",
    "hotels-lodging",
    "travel-cards",
    "cruises",
    "destinations",
    "travel-news",
  ],

  navCategories: [
    { name: "Travel Insurance", slug: "travel-insurance" },
    { name: "Travel Gear", slug: "travel-gear" },
    { name: "Flights & Airlines", slug: "flights-airlines" },
    { name: "Hotels & Lodging", slug: "hotels-lodging" },
    { name: "Travel Cards", slug: "travel-cards" },
    { name: "Cruises", slug: "cruises" },
    { name: "Destinations", slug: "destinations" },
    { name: "Travel News", slug: "travel-news" },
  ],

  // Five travel criteria. Keys match each product's `ratings` object keys and
  // CriterionRatings. Weights: Value 30%, Experience 25%, Flexibility 20%,
  // Transparency 15%, Service 10% → sums to 1.00. Every "what we evaluate"
  // description is written honestly: assessment is from officially published
  // documentation (DOT rules, policy wording, spec sheets, warranty terms),
  // NOT from Firsthand-conducted trips, claims, lab tests, or traveler surveys.
  criteria: [
    {
      key: "value",
      label: "Value",
      longLabel: "Cost & Value",
      weight: 0.3,
      description:
        "What you pay versus what the documentation says you get. For quote-based products like travel insurance (where premiums vary by trip cost, traveler age, dates, and state) we compare published plan structures and included benefit categories rather than quoting a single price. For gear and services with a list price, every figure is cited to the seller's official page with an as-of date. Strong documented inclusions at a fair published price score well; thin inclusions at a premium price score poorly.",
    },
    {
      key: "experience",
      label: "Experience",
      longLabel: "Documented Experience & Features",
      weight: 0.25,
      description:
        "The substance of what the product or service documents that it delivers: an insurer's covered-benefit categories and assistance services, a suitcase's published dimensions, weight, capacity, materials, and organization, a service's documented features and tools. We credit only what the provider's own documentation shows (Firsthand does not take trips, file claims, or lab-test gear) and we note when a marquee feature is an optional add-on rather than standard.",
    },
    {
      key: "flexibility",
      label: "Flexibility",
      longLabel: "Flexibility & Policies",
      weight: 0.2,
      description:
        "How the published policies treat you when plans change, which matters more in travel than almost anywhere else. We read cancellation, change, refund, and free-look terms as written: an insurer's review period and Cancel For Any Reason terms, a gear brand's trial and return window, a service's published change rules, and the U.S. Department of Transportation's refund requirements that apply regardless of what you bought. Generous, clearly worded change terms score well; short windows and restrictive conditions score poorly.",
    },
    {
      key: "transparency",
      label: "Transparency",
      longLabel: "Transparency",
      weight: 0.15,
      description:
        "How clearly the provider publishes what things cost and what is excluded. We credit plain-language plan documents with accessible policy wording and exclusions, published warranty terms that say exactly what is and is not covered, and stable, findable list prices. Quote-only pricing that hides the structure, buried exclusions, and promotion-dependent prices that obscure the real cost all lower the score.",
    },
    {
      key: "service",
      label: "Service",
      longLabel: "Service & Support",
      weight: 0.1,
      description:
        "The support the provider documents: 24/7 assistance lines and what they say they handle, published claims processes, warranty service terms and who pays shipping, help-center depth, and stated response commitments. We credit only documented commitments, not service reputation, which we cannot verify without surveying customers, and Firsthand does not conduct surveys.",
    },
  ],

  methodologyIntro:
    "Travel reviews carry real weight because they touch big purchases and, with insurance, YMYL financial protection, so we are explicit about our evidence. Firsthand Travel does not take press trips, stay in hotels for review, file insurance claims, lab-test gear, or survey travelers, and it is not an insurance agency, broker, or producer. Instead, every rating is built from analysis of officially published documentation: U.S. Department of Transportation aviation consumer protection rules, each insurer's own published plan pages and policy wording, each manufacturer's published specifications and warranty terms, and each provider's official policy pages. Travel pricing is unusually dynamic: insurance premiums are quote-based and vary by trip cost, traveler age, dates, and state, and fares and rates change constantly. So every figure in our reviews is cited to a primary source with an 'as of' date, quote-based products are compared on published plan structure rather than a single price, and where we cannot verify a figure we describe it qualitatively or omit it rather than guess. Insurance benefits and availability vary by state, and we say so wherever it applies.",

  disclosureLabel: "Affiliate Disclosure",
  disclosureBody:
    "Firsthand Travel is reader-supported. We may earn a commission if you buy or book through links on this page, at no extra cost to you. Commissions never affect our rankings, ratings, or which products and services we cover: placement follows the published methodology, not payment.",

  // Not-travel/insurance/financial-advice content disclaimer.
  contentDisclaimer:
    "This content is for informational purposes only and is not travel, insurance, financial, or legal advice, and Firsthand is not an insurance agency or broker. Plan terms, coverage, pricing, and availability change frequently and vary by state and by traveler; verify current details in the provider's official policy documents and with official sources (such as the U.S. Department of Transportation) before buying or booking.",
  contentDisclaimerLabel: "Travel disclaimer",

  // No interactive tools/quiz for travel (the sleep quiz is health-only).

  defaultAuthorSlug: "travel-research-analyst",
  defaultReviewerSlug: "editorial-team",

  footerDisclaimer:
    "Firsthand Travel content is for informational purposes only and is not travel, insurance, financial, or legal advice; ratings are based on published documentation, not first-hand testing, claims experience, or traveler surveys.",

  methodologyMetaDescription:
    "The published methodology behind every Firsthand Travel ranking: Value, Experience, Flexibility, Transparency, and Service: rated from official published documentation (DOT rules, policy wording, spec sheets, warranty terms), not press trips, claims, lab tests, or traveler surveys.",

  newsletter: {
    brandName: "The Firsthand Travel Brief",
    bandBlurb:
      "One weekly email: what changed in the published policies, plan documents, and prices behind the travel insurance, gear, and services you're considering, read from the primary sources. No hype, no spam.",
    ctaHeading: "Get evidence-based travel picks in your inbox, no hype.",
    ctaBlurb: "Join The Firsthand Travel Brief for a weekly, research-first read.",
  },

  homepage: {
    heroFallbackTitle: "Travel decisions deserve better evidence.",
    heroFallbackBody:
      "Firsthand Travel reads the official record: U.S. Department of Transportation consumer rules, insurers' published plan documents and policy wording, and manufacturers' published specifications and warranty terms: to rank travel insurance, luggage, and travel services clearly and without hype. We don't take press trips, file claims, or lab-test gear; our ratings come from published documentation.",
    trustHeading: "Why trust Firsthand Travel",
    trustPoints: [
      "Rankings built from official published documentation (DOT rules, policy wording, spec sheets, warranty terms) not sponsorships or press trips.",
      "Clear methodology and cited, as-of-dated figures on every page: quote-based products are compared on published plan structure, never invented prices.",
      "We are explicit that we don't file claims, lab-test gear, or survey travelers; every review lists at least one genuine con.",
    ],
    rankingsLabel: "2026 editions",
    rankings: [
      {
        title: "Best Travel Insurance Providers of 2026",
        category: "Travel Insurance",
        blurb:
          "We compared five major U.S. travel insurance providers on published plan structure, Cancel For Any Reason terms, review periods, and assistance services, with every claim cited to the provider's official documentation.",
        href: "/best/best-travel-insurance",
      },
      {
        title: "Best Carry-On Luggage of 2026",
        category: "Travel Gear",
        blurb:
          "A side-by-side look at five widely used carry-on suitcases using official list prices, published dimensions and materials, and each brand's own warranty and trial terms, reported from official product pages, not hands-on testing.",
        href: "/best/best-carry-on-luggage",
      },
    ],
    latestPlaceholders: [],
    browseAllHref: "/category/travel-news",
    browseAllLabel: "Browse all coverage →",
  },
};

export default travel;
