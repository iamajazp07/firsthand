/**
 * write-news — turn tracked announcements into original analysis, published.
 *
 *   npm run news:write [n]      (default 2)
 *
 * For each of up to n announcements not yet handled:
 *
 *   1. FETCH the primary document itself, not the feed's two-line summary.
 *      Analysis written from a summary is where models invent detail.
 *   2. GATE on source length. Too thin to analyse means skip, and say why. A
 *      skipped item costs nothing; a fabricated one costs the site its name.
 *   3. WRITE with Gemini under Azaj's own style rules, facts from source only.
 *   4. LINT with src/lib/lint-human.ts, a verified port of his lint_human.py
 *      (the production container has no python3). One rewrite with the exact
 *      errors fed back; fail twice and the item is dropped.
 *   5. PUBLISH by attaching the analysis to the stored announcement. The page
 *      reads the store at request time, so it is live on the next page view.
 *
 * FREE TIER. Each Gemini model has its own small request quota (20 on
 * gemini-3.6-flash). So a 429 means "this model is spent", and we move to the
 * next model at once instead of waiting it out. When every model is spent, the
 * run stops cleanly and the next scheduled run picks up where it left off.
 *
 * Key: GEMINI_API_KEY (server) or the macOS keychain entry `firsthand-gemini`.
 */

import { promises as fs } from "fs";
import os from "os";
import { execFileSync } from "child_process";

import {
  newsStatePath,
  readNews,
  setAnalysis,
  type NewsItem,
} from "../src/lib/news.ts";
import { lintLines } from "../src/lib/lint-human.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/**
 * Tried in order, each with its own free quota. Chosen by actually calling
 * generateContent on this account: gemini-2.5-flash is in the models list but
 * 404s for new users, so the list alone proves nothing.
 */
const MODELS = ["gemini-3.6-flash", "gemini-3.8-flash", "gemini-flash-latest"];
const endpointFor = (m: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;

const VERTICALS = ["health", "money", "tech", "education", "travel"];
const WRITTEN_FILE = newsStatePath("_written.json");

/** Below this much real text there is not enough to analyse without inventing. */
const MIN_SOURCE_CHARS = 700;
const MAX_SOURCE_CHARS = 14000;
/** Gap between calls, to stay under per-minute limits. */
const CALL_GAP_MS = 8000;
/** One short wait for a 503 "overloaded" before moving to the next model. */
const OVERLOAD_WAIT_MS = 15000;
/** Only write about announcements this recent. Some feeds return years of back catalogue. */
const MAX_AGE_DAYS = 14;
/** Never examine more than this many candidates in one run. */
const MAX_CANDIDATES_SCANNED = 40;

/**
 * Feeds the writer never covers. 8-K filings are bare records with nothing to
 * analyse; preprints are not peer reviewed and would otherwise swamp the mix
 * (about 90% of new items). They still appear on the news pages as headlines.
 */
const SKIP_FEEDS = new Set([
  "sec-edgar-8k",
  "arxiv-cs-ai",
  "arxiv-ai-healthcare",
  "medrxiv-preprints",
]);

/**
 * Share of each day's articles per vertical. The writer fills whichever
 * vertical is furthest behind its share; when one runs out of candidates its
 * slots go to the rest, so a thin day never wastes the quota.
 */
const DAILY_SHARE: Record<string, number> = {
  health: 0.5,
  money: 0.125,
  tech: 0.125,
  travel: 0.125,
  education: 0.125,
};

const UA =
  "Mozilla/5.0 (compatible; FirsthandNewsBot/1.0; +https://readfirsthand.com/editorial-policy)";

// ---------------------------------------------------------------------------
// Voice + honesty rules: Azaj's own, from his CLAUDE.md.
// ---------------------------------------------------------------------------

const SYSTEM = `You write news analysis for Firsthand, an independent site that explains official announcements to ordinary readers.

FACTS. These rules override everything else:
- Use ONLY facts stated in the SOURCE DOCUMENT. Every number, date, name, amount and decision must appear in it.
- Never invent a statistic, quote, date, person, outcome or reaction. If the source does not say something, do not say it.
- If the source does not explain why something happened or what comes next, say plainly that the announcement does not say. Do not guess.
- Name the issuing body when stating what it did. Never write "experts say" or "studies show" without naming who.
- Health: never say anything treats, cures or prevents a condition. This is not medical advice.
- Money: this is not personal financial advice. Never tell the reader what to do with their money.
- Ignore website menus, buttons and navigation text in the source. Analyse only the announcement.

VOICE:
- Lead with what happened. Then the evidence. Then what it means.
- Plain and direct. Short sentences mixed with longer ones. The occasional fragment is fine.
- Plain verbs: "said", "set", "cut", "raised", "wrote". Plain copulas: "is", "was".
- Small honest hedges where true: "about", "tends to", "may".
- Explain jargon the first time you use it, in plain words, for someone who is not an expert.
- Vary how paragraphs begin. Never start three in a row with the same word.

NEVER USE:
- The em dash character. Use a comma, a full stop, or brackets instead.
- These words: delve, tapestry, testament, underscore, pivotal, crucial, meticulous, vibrant, showcase, showcasing, foster, fostering, realm, intricate, seamless, robust, comprehensive, nuanced, boasts, garner, leverage, leveraging, utilize, utilizing, landscape (as an abstract noun), cutting-edge, end-to-end, synergy, spearheaded, orchestrated, championed.
- "serves as", "stands as", "represents" in place of "is".
- "not only X but also Y", "not just X but Y", "it's not X, it's Y".
- "It's important to note", "In conclusion", "In today's world".
- Three adjectives in a row.
- A closing section about challenges ahead or the future outlook.`;

function userPrompt(item: NewsItem, source: string): string {
  return `ISSUING BODY: ${item.source_name}
COUNTRY: ${item.country}
DATE: ${item.published_at.slice(0, 10)}
URL: ${item.link}

SOURCE DOCUMENT:
"""
${source}
"""

Write original analysis of this announcement. Return JSON with:

- "title": a plain, specific headline saying what happened. No clickbait, no question marks.
- "answer_block": 130 to 170 words. Stands alone. Says what was announced, by whom, and why a normal person might care. Includes at least one specific figure or date taken from the source.
- "body_md": markdown with exactly these three H2 sections:
    ## What was announced
    ## What it means
    ## What the announcement does not tell us
  The third section must honestly list what is missing, unclear or left for later. 250 to 450 words total.

Do not repeat the answer_block word for word in the body.`;
}

const SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    answer_block: { type: "STRING" },
    body_md: { type: "STRING" },
  },
  required: ["title", "answer_block", "body_md"],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function apiKey(): string {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    return execFileSync(
      "security",
      ["find-generic-password", "-a", os.userInfo().username, "-s", "firsthand-gemini", "-w"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
  } catch {
    throw new Error("No Gemini key. Set GEMINI_API_KEY, or keychain entry `firsthand-gemini`.");
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Page HTML to readable text. Prefers <main>/<article>. Does NOT strip <form>:
 * ASP.NET WebForms sites (RBI and many other government sites) wrap the whole
 * page in one <form>, and stripping it once left 58 characters of chrome.
 */
function htmlToText(html: string): string {
  const scoped =
    html.match(/<main[\s\S]*?<\/main>/i)?.[0] ??
    html.match(/<article[\s\S]*?<\/article>/i)?.[0] ??
    html;
  return scoped
    .replace(/<(script|style|nav|header|footer|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&[lr]squo;/g, "’")
    .replace(/&[lr]dquo;/g, '"')
    .replace(/&[nm]dash;/g, "-")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*/g, "\n\n")
    .trim();
}

/**
 * Sites without <main>/<article> put their menus first, and big menus can push
 * the announcement past MAX_SOURCE_CHARS. We know the headline, so start near
 * it. Site-agnostic, unlike a per-site selector list.
 */
function anchorOnTitle(text: string, title: string): string {
  const probe = title.replace(/\s+/g, " ").trim().slice(0, 40).toLowerCase();
  if (probe.length < 12) return text;
  const at = text.toLowerCase().indexOf(probe);
  return at > 200 ? text.slice(at - 200) : text;
}

async function fetchSource(url: string, title: string): Promise<{ text: string; status: string }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return { text: "", status: `HTTP ${res.status}` };
    if ((res.headers.get("content-type") ?? "").includes("pdf")) return { text: "", status: "PDF" };
    const text = anchorOnTitle(htmlToText(await res.text()), title).slice(0, MAX_SOURCE_CHARS);
    return { text, status: "ok" };
  } catch (e) {
    return { text: "", status: (e as Error).name === "TimeoutError" ? "timeout" : "fetch failed" };
  }
}

interface Draft { title: string; answer_block: string; body_md: string }

/** Every model is out of quota. The run should stop, not keep asking. */
class QuotaExhausted extends Error {}

/**
 * Models already found to be out of quota in THIS run. Shared across items so
 * we never spend a call re-discovering that gemini-3.6-flash is spent.
 */
const spent = new Set<string>();

async function callGemini(key: string, prompt: string): Promise<Draft & { model: string }> {
  let lastErr = "no model available";
  for (const model of MODELS) {
    if (spent.has(model)) continue;
    for (let tries = 0; tries < 2; tries++) {
      let res: Response;
      try {
        res = await fetch(endpointFor(model), {
          method: "POST",
          headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM }] },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: SCHEMA,
              temperature: 0.4,
            },
          }),
          signal: AbortSignal.timeout(120000),
        });
      } catch (e) {
        lastErr = `${model}: ${(e as Error).name === "TimeoutError" ? "timeout" : "network error"}`;
        break; // try the next model
      }

      if (res.status === 429) {
        spent.add(model); // quota gone for this model; do not wait it out
        lastErr = `${model}: quota exhausted`;
        break;
      }
      if (res.status === 503 || res.status === 500 || res.status === 502 || res.status === 504) {
        lastErr = `${model}: HTTP ${res.status} (overloaded)`;
        if (tries === 0) { await sleep(OVERLOAD_WAIT_MS); continue; }
        break;
      }

      const data = (await res.json()) as {
        error?: { code: number; message: string };
        candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
      };
      if (data.error) throw new Error(`${model} ${data.error.code}: ${data.error.message.slice(0, 120)}`);
      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .filter((p) => p.text && !p.thought)
        .map((p) => p.text)
        .join("");
      if (!text) { lastErr = `${model}: empty response`; break; }
      try {
        return { ...(JSON.parse(text) as Draft), model };
      } catch {
        lastErr = `${model}: response was not valid JSON`;
        break;
      }
    }
  }
  if (MODELS.every((m) => spent.has(m))) throw new QuotaExhausted("every model is out of free quota");
  throw new Error(lastErr);
}

function lintDraft(d: Draft) {
  const lines = [d.title, ...d.answer_block.split(/\n+/), ...d.body_md.split(/\n+/)]
    .map((l) => l.trim())
    .filter(Boolean);
  return lintLines(lines);
}

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

async function readWritten(): Promise<Record<string, string>> {
  try { return JSON.parse(await fs.readFile(WRITTEN_FILE, "utf8")); }
  catch { return {}; }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const n = Number.parseInt(process.argv[2] ?? "2", 10) || 2;
  const key = apiKey();
  const written = await readWritten();

  const all: NewsItem[] = [];
  for (const v of VERTICALS) all.push(...(await readNews(v)));
  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 86_400_000).toISOString();
  const candidates = all
    .filter((i) => !i.analysis && !written[i.id] && !SKIP_FEEDS.has(i.source_id) && i.link)
    .filter((i) => i.published_at >= cutoff)
    .sort((a, b) => b.published_at.localeCompare(a.published_at));

  // Articles already written today (UTC), per vertical, and a newest-first
  // queue of candidates per vertical.
  const today = new Date().toISOString().slice(0, 10);
  const doneToday: Record<string, number> = {};
  const queues: Record<string, NewsItem[]> = {};
  for (const v of VERTICALS) { doneToday[v] = 0; queues[v] = []; }
  for (const i of all) {
    if (i.analysis?.written_at.startsWith(today)) doneToday[i.vertical] = (doneToday[i.vertical] ?? 0) + 1;
  }
  for (const i of candidates) queues[i.vertical]?.push(i);

  /** Next candidate from the vertical furthest behind its daily share. */
  const nextCandidate = (): NewsItem | undefined => {
    const open = VERTICALS.filter((v) => queues[v].length > 0);
    if (open.length === 0) return undefined;
    open.sort((a, b) => doneToday[a] / DAILY_SHARE[a] - doneToday[b] / DAILY_SHARE[b] || DAILY_SHARE[b] - DAILY_SHARE[a]);
    return queues[open[0]].shift();
  };

  console.log(`write-news ${new Date().toISOString()}`);
  console.log(`  ${candidates.length} candidates, target ${n}, models ${MODELS.join(" > ")}`);
  console.log(`  written today: ${VERTICALS.map((v) => `${v} ${doneToday[v]}`).join(", ")}\n`);

  let made = 0;
  let scanned = 0;
  let stopReason = "";

  for (let item = nextCandidate(); item; item = nextCandidate()) {
    if (made >= n) break;
    if (scanned++ >= MAX_CANDIDATES_SCANNED) { stopReason = `scanned ${MAX_CANDIDATES_SCANNED} candidates`; break; }
    const label = `[${item.vertical}/${item.country}] ${item.title.slice(0, 60)}`;

    const src = await fetchSource(item.link, item.title);
    if (src.text.length < MIN_SOURCE_CHARS) {
      console.log(`  SKIP  ${label}\n        source ${src.status}, ${src.text.length} chars`);
      written[item.id] = `skipped: thin source (${src.status}, ${src.text.length} chars)`;
      continue;
    }

    let draft: (Draft & { model: string }) | null = null;
    let lint = { errors: [] as string[], warnings: [] as string[] };
    let prompt = userPrompt(item, src.text);
    let attempt = 0;
    try {
      while (attempt < 2) {
        attempt++;
        draft = await callGemini(key, prompt);
        lint = lintDraft(draft);
        if (lint.errors.length === 0) break;
        prompt = userPrompt(item, src.text) +
          "\n\nYOUR PREVIOUS DRAFT FAILED THE STYLE CHECK. Fix every one of these and change nothing else:\n" +
          lint.errors.map((e) => `- ${e}`).join("\n");
        await sleep(CALL_GAP_MS);
      }
    } catch (e) {
      if (e instanceof QuotaExhausted) {
        stopReason = "free quota used up on every model, the next scheduled run will continue";
        break; // do NOT mark this item: it was never actually attempted to completion
      }
      console.log(`  FAIL  ${label}\n        ${(e as Error).message}`);
      await sleep(CALL_GAP_MS);
      continue;
    }

    if (!draft || lint.errors.length > 0) {
      console.log(`  DROP  ${label}\n        failed the style check twice: ${lint.errors[0] ?? "?"}`);
      written[item.id] = "dropped: failed lint twice";
      await sleep(CALL_GAP_MS);
      continue;
    }

    const ok = await setAnalysis(item.vertical, item.id, {
      title: draft.title,
      answer_block: draft.answer_block.trim(),
      body_md: draft.body_md.trim(),
      model: draft.model,
      written_at: new Date().toISOString(),
    });
    if (!ok) { written[item.id] = "skipped: item left the store"; continue; }

    written[item.id] = `published by ${draft.model}`;
    made++;
    doneToday[item.vertical]++;
    console.log(
      `  LIVE  ${label}\n` +
        `        "${draft.title.slice(0, 80)}"\n` +
        `        ${draft.model}, attempt ${attempt}, answer ${words(draft.answer_block)}w, body ${words(draft.body_md)}w` +
        (lint.warnings.length ? `, ${lint.warnings.length} style warning` : ", style clean"),
    );
    await sleep(CALL_GAP_MS);
  }

  await fs.writeFile(WRITTEN_FILE, JSON.stringify(written, null, 2) + "\n");
  console.log(`\n  ${made} published` + (stopReason ? `. Stopped: ${stopReason}.` : "."));
}

main().catch((err) => {
  console.error("write-news failed:", (err as Error).message);
  process.exit(1);
});
