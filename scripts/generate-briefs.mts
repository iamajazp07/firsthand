/**
 * scripts/generate-briefs.mts — the "brief generator" (no paid AI APIs).
 *
 * Picks N (default 2, override with a CLI arg) topics whose status is `todo`
 * from src/data/health/topics.json and writes ONE editorial brief markdown file per
 * topic into the gitignored `data/briefs/` directory (auto-created). Each brief
 * spells out the required GEO structure and the compliance rules so the drafter
 * (a Claude Code session — human-in-the-loop) can write the article, then marks
 * the topic `drafted` in topics.json so the next run picks fresh topics.
 *
 * Run it with either:
 *   npm run content:briefs            # default 2 topics
 *   npm run content:briefs -- 3       # 3 topics
 *   node --experimental-strip-types scripts/generate-briefs.mts 1
 *
 * This script does NOT touch the content queue — briefs are pre-draft
 * scaffolding. Drafts enter the queue only via scripts/ingest-draft.mts.
 */

import { promises as fs } from "fs";
import path from "path";

interface Topic {
  id: string;
  type: "education" | "reddit_roundup" | "news";
  category_slug: string;
  working_title: string;
  target_query: string;
  angle: string;
  status: "todo" | "drafted";
}

const TOPICS_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "health",
  "topics.json",
);
const BRIEFS_DIR = path.join(process.cwd(), "data", "briefs");

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function briefMarkdown(topic: Topic): string {
  const slug = slugify(topic.working_title);
  const redditNote =
    topic.type === "reddit_roundup"
      ? [
          "",
          "## Community-roundup rules (this type only)",
          "- Summarize PUBLIC DISCUSSION THEMES only — paraphrase, never quote users verbatim.",
          "- No usernames, no screenshots, no lifted comments.",
          "- Include the neutral note verbatim: \"This article summarizes public discussion themes; comments are paraphrased, not medical advice.\" (the /articles route renders it automatically for this type).",
          "- Pair every theme with a primary-source (FDA/NIH/PubMed) reality check.",
        ].join("\n")
      : "";

  return `---
title: ${topic.working_title}
slug: ${slug}
type: ${topic.type}
category_slug: ${topic.category_slug}
target_query: ${topic.target_query}
author_slug: health-research-analyst
reviewer_slug: dr-elena-marsh
---

# Editorial Brief — ${topic.working_title}

- **Topic id:** ${topic.id}
- **Type:** ${topic.type}
- **Category:** ${topic.category_slug}
- **Target query:** ${topic.target_query}
- **Angle:** ${topic.angle}

## Required structure (GEO / AI-citation optimized)

1. **Answer block** — a self-contained **130–170 word** paragraph that fully
   answers the target query, includes **at least one concrete statistic**, and
   avoids hype. This becomes the \`answer_block\` frontmatter field on ingest.
2. **H2 sections** — 3–5 \`##\` sections covering: what the research says, the
   mechanism in plain English, practical dosing/how-to (where relevant), and
   how it compares to alternatives.
3. **FAQ** — a \`## Frequently asked questions\` section using **real search
   phrasings** as \`###\` sub-headings (e.g. "Is X better than Y?", "How long
   does it take?"), each answered in 2–4 sentences.
4. **Honest limitation / caveat section** — at least one \`##\` section that
   states study-quality limits, funding conflicts, or gaps in the evidence.
5. **Sources** — **≥3 verifiable PubMed / NIH / FDA / ADA sources** with URLs.
   Every URL MUST be curl-checked (HTTP 200) before ingest.
${redditNote}

## Compliance rules (enforced at approval)

- **No disease-cure claims.** Never write "treats", "cures", "prevents
  disease", "melts fat", or "miracle". Use modest, hedged language:
  "may support", "is associated with", "small trials suggest".
- **No fabricated testimonials** or invented statistics.
- Cite primary sources; prefer systematic reviews and RCTs over blogs.
- Flag manufacturer funding / conflicts of interest where they exist.
- Author \`health-research-analyst\`, reviewer \`dr-elena-marsh\`.

## Ingest command (after drafting)

\`\`\`
npm run content:ingest -- data/drafts/${slug}.md
\`\`\`

Write the finished article as a markdown file with the frontmatter block above
(title, slug, type, category_slug, answer_block, and \`sources\` as
\`name | url\` lines), then run the command. It enters the queue as **draft**;
review and approve it in /admin.
`;
}

async function main(): Promise<void> {
  const arg = process.argv[2];
  const count = arg !== undefined ? Number.parseInt(arg, 10) : 2;
  if (Number.isNaN(count) || count < 1) {
    console.error(`Invalid count argument: ${arg}`);
    process.exit(1);
  }

  const raw = await fs.readFile(TOPICS_FILE, "utf8");
  const topics = JSON.parse(raw) as Topic[];

  const todo = topics.filter((t) => t.status === "todo");
  if (todo.length === 0) {
    console.log(
      "No topics with status 'todo' remain. Add more to src/data/health/topics.json.",
    );
    return;
  }

  const picked = todo.slice(0, count);
  await fs.mkdir(BRIEFS_DIR, { recursive: true });

  const written: string[] = [];
  for (const topic of picked) {
    const fileName = `${slugify(topic.working_title)}.md`;
    const filePath = path.join(BRIEFS_DIR, fileName);
    await fs.writeFile(filePath, briefMarkdown(topic));
    topic.status = "drafted";
    written.push(path.relative(process.cwd(), filePath));
  }

  await fs.writeFile(TOPICS_FILE, JSON.stringify(topics, null, 2) + "\n");

  console.log(
    `generate-briefs — ${picked.length} brief(s) written to data/briefs/ ` +
      `(${todo.length - picked.length} 'todo' topic(s) remaining).\n`,
  );
  for (const w of written) console.log(`  + ${w}`);
  console.log(
    `\nMarked ${picked.length} topic(s) as 'drafted' in src/data/health/topics.json.`,
  );
  console.log(
    "Next: draft each article in Claude Code, then `npm run content:ingest -- <file.md>`.",
  );
}

main().catch((err) => {
  console.error("generate-briefs failed:", err);
  process.exit(1);
});
