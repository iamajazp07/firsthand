/**
 * scripts/social-generate.mts — platform-native SOCIAL caption generator.
 *
 * Turns a piece of published content into 4 DRAFT social posts (X, Facebook,
 * Instagram, LinkedIn) using the content's REAL title + a real excerpt from the
 * data layer. Template-based (no AI APIs). Everything lands as `draft` in the
 * dual-mode social store (src/lib/social.ts) — nothing is ever auto-sent.
 *
 * Usage:
 *   npm run social:generate -- --type article --slug <slug>
 *   npm run social:generate -- --type hub     --slug best-sleep-supplements
 *   npm run social:generate -- --type review  --slug doctors-best-high-absorption-magnesium
 *   npm run social:generate -- --latest        # recently published articles w/o posts
 *
 * COMPLIANCE (FTC): monetized content (a hub with any monetized ranked product,
 * or a monetized review) sets is_monetized_link=true and the caption MUST carry
 * an '#ad' / '(affiliate link)' disclosure token — enforced here, never omitted.
 * Education/news articles are non-monetized.
 *
 * Dedupe: one post per (platform, content_slug). Existing posts are left alone.
 */

import { promises as fs } from "fs";
import path from "path";

import {
  listSocialPosts,
  createSocialPost,
  contentUrl,
  ogImageUrl,
  ogKind,
  hasDisclosure,
  DISCLOSURE_TOKEN,
  socialDedupeKey,
  SOCIAL_PLATFORMS,
  SOCIAL_STORAGE_MODE,
  type SocialPlatform,
  type SocialContentType,
} from "../src/lib/social.ts";
import {
  listPublishedArticles,
  getPublishedArticleBySlug,
} from "../src/lib/queue.ts";

// ---------------------------------------------------------------------------
// Node-safe content readers (src/data/health/*.json read directly; queue via lib)
// ---------------------------------------------------------------------------

interface ProductLite {
  slug: string;
  name: string;
  category_slug: string;
  is_monetized: boolean;
  verdict_summary: string;
  summary: string;
  best_for: string;
  last_updated: string;
}

interface HubLite {
  slug: string;
  title: string;
  category_slug: string;
  answer_block: string;
  product_slugs: string[];
  last_updated: string;
}

async function readJson<T>(rel: string): Promise<T> {
  const abs = path.join(process.cwd(), "src", "data", "health", rel);
  return JSON.parse(await fs.readFile(abs, "utf8")) as T;
}

// ---------------------------------------------------------------------------
// Hashtags by category (2–3 for X, fuller block for IG) + brand tag
// ---------------------------------------------------------------------------

const CATEGORY_TAGS: Record<string, string[]> = {
  sleep: ["Sleep", "SleepHealth", "Supplements", "Wellness"],
  "weight-loss": ["WeightLoss", "GLP1", "Metabolism", "Wellness"],
  "dental-oral-health": ["OralHealth", "TeethWhitening", "DentalCare"],
  "health-news": ["HealthNews", "HealthTech", "Wellness"],
  "health-tech-ai": ["HealthTech", "DigitalHealth", "AI"],
  "womens-health": ["WomensHealth", "Wellness"],
  hearing: ["HearingHealth", "Wellness"],
  "heart-health": ["HeartHealth", "Wellness"],
  "nutrition-supplements": ["Nutrition", "Supplements", "Wellness"],
  fitness: ["Fitness", "Wellness"],
  "mental-wellness": ["MentalWellness", "Wellness"],
};

function tagsFor(categorySlug: string): string[] {
  const base = CATEGORY_TAGS[categorySlug] ?? ["Health", "Wellness"];
  return [...base, "Vivahale"];
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/** First sentence (or first ~maxLen chars) of a block, trimmed. */
function excerpt(text: string, maxLen = 180): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const firstSentence = clean.split(/(?<=[.!?])\s/)[0] ?? clean;
  const pick = firstSentence.length <= maxLen ? firstSentence : clean.slice(0, maxLen);
  return pick.trim();
}

function hashtagString(tags: string[]): string {
  return tags.map((t) => `#${t}`).join(" ");
}

/** Ensure a caption carries the FTC disclosure token when monetized. */
function withDisclosure(caption: string, monetized: boolean): string {
  if (!monetized) return caption;
  if (hasDisclosure(caption)) return caption;
  return `${caption} ${DISCLOSURE_TOKEN}`;
}

// ---------------------------------------------------------------------------
// The content unit we generate from
// ---------------------------------------------------------------------------

interface ContentUnit {
  type: SocialContentType;
  slug: string;
  title: string;
  excerpt: string;
  categorySlug: string;
  monetized: boolean;
  url: string;
  imageUrl: string;
}

async function resolveArticle(slug: string): Promise<ContentUnit | null> {
  const a = await getPublishedArticleBySlug(slug);
  if (!a) return null;
  return {
    type: "article",
    slug: a.slug,
    title: a.title,
    excerpt: excerpt(a.answer_block || a.title),
    categorySlug: a.category_slug,
    monetized: false, // education / news / roundups are non-monetized
    url: contentUrl("article", a.slug),
    imageUrl: ogImageUrl(a.title, ogKind("article")),
  };
}

async function resolveHub(slug: string): Promise<ContentUnit | null> {
  const hubs = await readJson<HubLite[]>("hubs.json");
  const hub = hubs.find((h) => h.slug === slug);
  if (!hub) return null;
  const products = await readJson<ProductLite[]>("products.json");
  const ranked = hub.product_slugs
    .map((s) => products.find((p) => p.slug === s))
    .filter((p): p is ProductLite => Boolean(p));
  // A hub counts as monetized if ANY ranked product is monetized.
  const monetized = ranked.some((p) => p.is_monetized);
  return {
    type: "hub",
    slug: hub.slug,
    title: hub.title,
    excerpt: excerpt(hub.answer_block || hub.title),
    categorySlug: hub.category_slug,
    monetized,
    url: contentUrl("hub", hub.slug),
    imageUrl: ogImageUrl(hub.title, ogKind("hub")),
  };
}

async function resolveReview(slug: string): Promise<ContentUnit | null> {
  const products = await readJson<ProductLite[]>("products.json");
  const p = products.find((x) => x.slug === slug);
  if (!p) return null;
  const year = new Date(p.last_updated).getUTCFullYear();
  const title = `${p.name} Review ${year}`;
  return {
    type: "review",
    slug: p.slug,
    title,
    excerpt: excerpt(p.verdict_summary || p.summary || title),
    categorySlug: p.category_slug,
    monetized: p.is_monetized,
    url: contentUrl("review", p.slug),
    imageUrl: ogImageUrl(title, ogKind("review")),
  };
}

// ---------------------------------------------------------------------------
// Per-platform caption templates
// ---------------------------------------------------------------------------

interface Draft {
  caption: string;
  hashtags: string[];
}

const KIND_HOOK: Record<SocialContentType, string> = {
  article: "New analysis",
  hub: "Our latest rankings",
  review: "Full review",
};

function buildX(u: ContentUnit): Draft {
  const tags = tagsFor(u.categorySlug).slice(0, 3);
  // Budget for X: keep the whole thing well under 280 (target ≤260).
  const tagStr = hashtagString(tags);
  const disclosure = u.monetized ? ` ${DISCLOSURE_TOKEN}` : "";
  // Reserve space for URL (~30) + tags + disclosure, then fit the hook.
  const fixed = ` ${u.url} ${tagStr}${disclosure}`;
  const budget = 260 - fixed.length;
  let hook = u.title;
  if (hook.length > budget) hook = `${hook.slice(0, Math.max(0, budget - 1))}…`;
  const caption = `${hook}${fixed}`.trim();
  return { caption: withDisclosure(caption, u.monetized), hashtags: tags };
}

function buildLinkedIn(u: ContentUnit): Draft {
  const tags = tagsFor(u.categorySlug).slice(0, 3);
  const affiliate = u.monetized
    ? " Some links are affiliate links (#ad) — our rankings are never pay-to-play."
    : "";
  const caption =
    `${KIND_HOOK[u.type]}: ${u.title}. ` +
    `${u.excerpt} ` +
    `We rate on safety, evidence, cost, transparency, and support — commissions never move the rankings.${affiliate} ` +
    `Read the full breakdown: ${u.url} ${hashtagString(tags)}`;
  return { caption: withDisclosure(caption, u.monetized), hashtags: tags };
}

function buildFacebook(u: ContentUnit): Draft {
  const tags = tagsFor(u.categorySlug).slice(0, 3);
  const affiliate = u.monetized ? " (contains affiliate links #ad)" : "";
  const caption =
    `${u.title}${affiliate}. ` +
    `${u.excerpt} ` +
    `Here's what the evidence actually says 👇 ${u.url} ${hashtagString(tags)}`;
  return { caption: withDisclosure(caption, u.monetized), hashtags: tags };
}

function buildInstagram(u: ContentUnit): Draft {
  // IG captions can't carry a clickable link — say "link in bio".
  const tags = tagsFor(u.categorySlug);
  const igTags = u.monetized ? [...tags, "ad"] : tags;
  const affiliate = u.monetized ? " This post contains affiliate links (#ad)." : "";
  const caption =
    `${u.title} 🔍\n\n` +
    `${u.excerpt}\n\n` +
    `Full analysis is linked in our bio — search Vivahale.${affiliate}\n\n` +
    `${hashtagString(igTags)}`;
  return { caption: withDisclosure(caption, u.monetized), hashtags: igTags };
}

function buildDraft(platform: SocialPlatform, u: ContentUnit): Draft {
  if (platform === "x") return buildX(u);
  if (platform === "linkedin") return buildLinkedIn(u);
  if (platform === "facebook") return buildFacebook(u);
  return buildInstagram(u);
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

async function generateForUnit(
  u: ContentUnit,
  existingKeys: Set<string>,
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const platform of SOCIAL_PLATFORMS) {
    const key = socialDedupeKey(platform, u.slug);
    if (existingKeys.has(key)) {
      skipped += 1;
      continue;
    }
    const draft = buildDraft(platform, u);

    // Hard compliance assertion — never persist a monetized post w/o disclosure.
    if (u.monetized && !hasDisclosure(draft.caption)) {
      throw new Error(
        `Refusing to create ${platform} post for ${u.slug}: monetized but no disclosure token.`,
      );
    }

    await createSocialPost({
      platform,
      content_type: u.type,
      content_slug: u.slug,
      content_url: u.url,
      caption: draft.caption,
      hashtags: draft.hashtags,
      image_url: u.imageUrl,
      is_monetized_link: u.monetized,
      status: "draft",
    });
    existingKeys.add(key);
    created += 1;
    const disc = u.monetized ? " [#ad]" : "";
    console.log(
      `   + ${platform.padEnd(9)} draft (${draft.caption.length} chars)${disc}`,
    );
  }
  return { created, skipped };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): {
  type?: SocialContentType;
  slug?: string;
  latest: boolean;
} {
  const out: { type?: SocialContentType; slug?: string; latest: boolean } = {
    latest: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--latest") out.latest = true;
    else if (a === "--type") out.type = argv[++i] as SocialContentType;
    else if (a === "--slug") out.slug = argv[++i];
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  console.log(`social-generate — store: ${SOCIAL_STORAGE_MODE}`);

  // Build the dedupe set from existing posts.
  const existing = await listSocialPosts();
  const existingKeys = new Set(
    existing.map((p) => socialDedupeKey(p.platform, p.content_slug)),
  );

  const units: ContentUnit[] = [];

  if (args.latest) {
    const published = await listPublishedArticles();
    for (const a of published) {
      // dedupe: skip articles that already have ANY post.
      const hasAny = SOCIAL_PLATFORMS.some((p) =>
        existingKeys.has(socialDedupeKey(p, a.slug)),
      );
      if (hasAny) continue;
      const u = await resolveArticle(a.slug);
      if (u) units.push(u);
    }
    if (units.length === 0) {
      console.log(
        "  --latest: no recently published articles without social posts. Nothing to do.",
      );
      return;
    }
  } else {
    if (!args.type || !args.slug) {
      console.error(
        "Usage: social:generate -- --type article|hub|review --slug <slug>  (or --latest)",
      );
      process.exit(1);
    }
    let u: ContentUnit | null = null;
    if (args.type === "article") u = await resolveArticle(args.slug);
    else if (args.type === "hub") u = await resolveHub(args.slug);
    else if (args.type === "review") u = await resolveReview(args.slug);
    else {
      console.error(`Unknown --type "${args.type}".`);
      process.exit(1);
    }
    if (!u) {
      console.error(
        `Content not found: type=${args.type} slug=${args.slug}. ` +
          `(Articles must be published; hubs/reviews must exist in src/data.)`,
      );
      process.exit(1);
    }
    units.push(u);
  }

  let totalCreated = 0;
  let totalSkipped = 0;
  for (const u of units) {
    console.log(
      `\n  ${u.type.toUpperCase()} "${u.title}" — ${u.monetized ? "MONETIZED (needs #ad)" : "non-monetized"}`,
    );
    const { created, skipped } = await generateForUnit(u, existingKeys);
    totalCreated += created;
    totalSkipped += skipped;
    if (skipped > 0) console.log(`   (${skipped} platform(s) already had a post — skipped)`);
  }

  console.log(
    `\nDone. ${totalCreated} draft(s) created, ${totalSkipped} skipped (dedupe).`,
  );
}

main().catch((err) => {
  console.error("social-generate failed:", err);
  process.exit(1);
});
