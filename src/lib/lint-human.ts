/**
 * lint-human — a TypeScript port of ~/cv-factory/lint_human.py.
 *
 * WHY A PORT: the production container is a nixpacks Node image with no
 * python3, so the original cannot run where the news writer runs. This is a
 * mirror of Azaj's rules, not a new rule set. BANNED and NOT_JUST below were
 * extracted mechanically from the Python source on 2026-09-22, so they match
 * it exactly. If lint_human.py changes, regenerate this file rather than
 * editing it by hand, and re-run the parity check in scripts/lint-parity.mts.
 *
 * Same behaviour as the original:
 *   - ERROR: an em dash anywhere
 *   - ERROR: any BANNED phrase, matched on letter boundaries, case-insensitive
 *   - ERROR: the "not just/only X ... but Y" construction
 *   - WARN:  three or more consecutive lines opening with the same word
 */

export const BANNED: readonly string[] = [
  "leverage",
  "leveraging",
  "leveraged",
  "robust",
  "end-to-end",
  "seamless",
  "cutting-edge",
  "spearheaded",
  "orchestrated",
  "championed",
  "delve",
  "showcase",
  "showcasing",
  "underscore",
  "pivotal",
  "testament",
  "meticulous",
  "results-driven",
  "results-oriented",
  "team player",
  "highly motivated",
  "passionate about",
  "synergy",
  "synergize",
  "dynamic professional",
  "proven track record",
  "measurable business impact",
  "serves as",
  "stands as",
  "vibrant",
  "tapestry",
  "fostering",
  "utilize",
  "utilizing",
  "i am excited",
  "i was excited",
  "excited to see",
  "i would welcome the opportunity",
  "do not hesitate"
];

const NOT_JUST = new RegExp("\\bnot (just|only)\\b.{0,60}\\bbut\\b", "i");

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Precompiled like the Python loop: letter boundaries, not \\b, to match it exactly. */
const BANNED_RES = BANNED.map(
  (w) => [w, new RegExp(`(?<![a-z])${escapeRe(w)}(?![a-z])`)] as const,
);

export interface LintResult {
  errors: string[];
  warnings: string[];
}

/** Lint an array of lines (one paragraph per line, as the original expects). */
export function lintLines(lines: string[]): LintResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const openers: string[] = [];

  for (const t of lines) {
    const low = t.toLowerCase();
    if (t.includes("\u2014")) errors.push(`em dash in: ${JSON.stringify(t.slice(0, 70))}`);
    for (const [w, re] of BANNED_RES) {
      if (re.test(low)) errors.push(`banned phrase '${w}' in: ${JSON.stringify(t.slice(0, 70))}`);
    }
    if (NOT_JUST.test(t)) errors.push(`'not just X but Y' pattern in: ${JSON.stringify(t.slice(0, 70))}`);
    const words = t.match(/[A-Za-z']+/g);
    if (words) openers.push(words[0].toLowerCase());
  }

  for (let i = 0; i < openers.length - 2; i++) {
    if (openers[i] === openers[i + 1] && openers[i + 1] === openers[i + 2]) {
      warnings.push(`3+ consecutive items start with '${openers[i]}' - vary the openers`);
      break;
    }
  }
  return { errors, warnings };
}
