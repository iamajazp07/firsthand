/**
 * Parity check: src/lib/lint-human.ts must flag exactly what
 * ~/cv-factory/lint_human.py flags. Run after regenerating the port.
 *   node --experimental-strip-types scripts/lint-parity.mts
 */
import { execFileSync } from "child_process";
import { writeFileSync } from "fs";
import os from "os";
import path from "path";
import { lintLines } from "../src/lib/lint-human.ts";

const CASES: string[][] = [
  ["A clean plain sentence about the RBI.", "It set the rate at 6.5%."],
  ["The bank will leverage its reserves."],
  ["This is a robust, seamless approach."],
  ["Prices rose — sharply."],
  ["It is not just fast but also cheap."],
  ["It is not only fast, but cheap too."],
  ["Leveraged buyouts rose.", "The plan serves as a guide."],
  ["We delve into the tapestry."],
  ["The firm utilizes new tools."],
  ["Unleveraged funds and leverageable ideas."],  // boundary: must NOT flag 'leverage'
  ["The bank said.", "The bank cut.", "The bank raised."], // opener warning
  ["Showcasing results.", "fostering growth"],
  ["I am excited to share this."],
  ["Nothing wrong here at all."],
];

const pyLinter = path.join(os.homedir(), "cv-factory", "lint_human.py");
let pass = 0;
for (const [i, lines] of CASES.entries()) {
  const f = path.join(os.tmpdir(), `parity-${i}.txt`);
  writeFileSync(f, lines.join("\n") + "\n");
  let out = "";
  try { out = execFileSync("python3", [pyLinter, f], { encoding: "utf8" }); }
  catch (e) { out = (e as { stdout?: string }).stdout ?? ""; }
  const pyE = out.split("\n").filter((l) => l.startsWith("ERROR")).length;
  const pyW = out.split("\n").filter((l) => l.startsWith("WARN")).length;
  const ts = lintLines(lines);
  const ok = pyE === ts.errors.length && pyW === ts.warnings.length;
  if (ok) pass++;
  console.log(`${ok ? "  ok  " : "  DIFF"} case ${String(i).padStart(2)}  py E${pyE}/W${pyW}  ts E${ts.errors.length}/W${ts.warnings.length}  ${JSON.stringify(lines[0]).slice(0, 48)}`);
}
console.log(`\n${pass}/${CASES.length} cases agree`);
process.exit(pass === CASES.length ? 0 : 1);
