/** Independent exhaustive audit: does not use the production score/candidates helpers. */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { DAILY_CONFIG, generateDaily, solve, unpack, WORLDS, type CifraConfig, type CifraPuzzle, type PackedLevel } from "../src/cifra";

const codes = new Map<number, number[][]>();
function enumerate(length: number): number[][] {
  if (!codes.has(length)) {
    const all: number[][] = [];
    const visit = (prefix: number[]) => {
      if (prefix.length === length) { all.push(prefix); return; }
      for (let digit = 0; digit < 10; digit++) if (!prefix.includes(digit)) visit([...prefix, digit]);
    };
    visit([]); codes.set(length, all);
  }
  return codes.get(length)!;
}
function feedback(secret: readonly number[], guess: readonly number[]) {
  const exact = guess.reduce((n, digit, position) => n + Number(secret[position] === digit), 0);
  const common = new Set(guess.filter((digit) => secret.includes(digit))).size;
  return { exact, present: common - exact };
}
function audit(id: string, puzzle: CifraPuzzle, config: CifraConfig) {
  const issues: string[] = [];
  if (puzzle.solution.length !== puzzle.length || new Set(puzzle.solution).size !== puzzle.length || puzzle.solution.some((digit) => !Number.isInteger(digit) || digit < 0 || digit > 9)) issues.push("invalid-solution-digits");
  const seen = new Set(puzzle.clues.flatMap((clue) => [...clue.guess]));
  const missingDigits = puzzle.solution.filter((digit) => !seen.has(digit));
  if (missingDigits.length) issues.push("solution-digits-absent-from-clues");
  const fits = (candidate: readonly number[]) => puzzle.clues.every((clue) => {
    const actual = feedback(candidate, clue.guess);
    return actual.exact === clue.feedback.exact && actual.present === clue.feedback.present;
  });
  const possibilities = enumerate(puzzle.length).filter(fits);
  if (possibilities.length !== 1) issues.push("not-unique");
  if (!fits(puzzle.solution)) issues.push("incorrect-feedback-or-solution");
  if (puzzle.clues.some((c) => c.guess.length !== puzzle.length || new Set(c.guess).size !== puzzle.length || c.guess.some((d) => !Number.isInteger(d) || d < 0 || d > 9))) issues.push("invalid-clue-digits");
  const solved = solve(puzzle.clues, puzzle.length, config.maxTier);
  if (!solved.solved || solved.solution?.join("") !== puzzle.solution.join("")) issues.push("solver-fails");
  if (puzzle.difficulty !== solved.steps + 3 * solved.tier2Uses + 8 * solved.tier3Uses + puzzle.clues.length) issues.push("incorrect-difficulty");
  const zeroRows = puzzle.clues.filter((c) => c.feedback.exact + c.feedback.present === 0);
  const eliminations = new Set(zeroRows.flatMap((c) => [...c.guess])).size;
  if (zeroRows.length > config.maxZeroRows || eliminations > config.maxDirectEliminations || 10 - eliminations <= puzzle.length) issues.push("direct-elimination-limit");
  if (puzzle.clues.length < config.minRows || puzzle.clues.length > config.maxRows) issues.push("row-count");
  if (!puzzle.clues.some((c) => c.feedback.exact > 0) || !puzzle.clues.some((c) => c.feedback.present > 0)) issues.push("feedback-variety");
  return { id, solution: puzzle.solution.join(""), missingDigits, candidateCount: possibilities.length, issues };
}

const levels = JSON.parse(readFileSync(new URL("../levels/cifra.json", import.meta.url), "utf8")) as PackedLevel[];
const audited = levels.map((level) => audit(`${level.w}-${level.n}`, unpack(level), WORLDS.find((world) => world.id === level.w)!));
const worlds = WORLDS.map((world) => {
  const group = levels.filter((level) => level.w === world.id);
  return { world: world.id, levels: group.length, missingDigitLevels: audited.filter((row) => row.id.startsWith(`${world.id}-`) && row.missingDigits.length).map((row) => ({ id: row.id, missingDigits: row.missingDigits })), difficultySorted: group.every((level, i) => i === 0 || level.d >= group[i - 1].d) };
});
const daily = [];
for (let day = 0; day < 366; day++) {
  const date = new Date(Date.UTC(2026, 9, 22 + day)).toISOString().slice(0, 10);
  daily.push(audit(date, generateDaily(date), DAILY_CONFIG));
}
const report = { levelsAudited: audited.length, levelsWithIssues: audited.filter((row) => row.issues.length), worlds, dailyAudited: daily.length, dailyWithIssues: daily.filter((row) => row.issues.length), independentEnumeration: true };
if (process.argv[2]) writeFileSync(resolve(process.argv[2]), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ levelsAudited: report.levelsAudited, levelsWithIssues: report.levelsWithIssues.length, worlds, dailyAudited: report.dailyAudited, dailyWithIssues: report.dailyWithIssues.length }, null, 2));
if (report.levelsWithIssues.length || report.dailyWithIssues.length || worlds.some((world) => !world.difficultySorted)) process.exitCode = 1;
