import { randInt, rngFrom, shuffle, type Rng } from "../rng";
import { allCodes, matches, score } from "./score";
import { solve } from "./solver";
import type { CifraConfig, CifraPuzzle, Clue } from "./types";

function randomCode(rng: Rng, length: number): number[] {
  return shuffle(rng, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, length);
}

function countCandidates(clues: Clue[], length: number) {
  let n = 0;
  for (const c of allCodes(length)) {
    if (clues.every((clue) => matches(c, clue)) && ++n === 2) return n;
  }
  return n;
}

/** Quita filas que sobran: cada fila del tablero final es necesaria. */
function minimize(clues: Clue[], length: number): Clue[] {
  const out = clues.slice();
  for (let i = out.length - 1; i >= 0; i--) {
    const without = out.filter((_, j) => j !== i);
    if (countCandidates(without, length) === 1) out.splice(i, 1);
  }
  return out;
}

function tryBuild(rng: Rng, cfg: CifraConfig): Omit<CifraPuzzle, "id"> | null {
  const secret = randomCode(rng, cfg.length);
  const clues: Clue[] = [];
  let pool = allCodes(cfg.length);
  let tries = 0;

  while (pool.length > 1 && clues.length < cfg.maxRows + 2 && tries++ < 300) {
    const guess = randomCode(rng, cfg.length);
    const feedback = score(secret, guess);
    if (feedback.exact === cfg.length) continue;
    // Evita filas que regalan casi todo de entrada.
    if (clues.length === 0 && feedback.exact + feedback.present === cfg.length) continue;
    const clue = { guess, feedback };
    const next = pool.filter((c) => matches(c, clue));
    if (next.length === pool.length) continue;
    clues.push(clue);
    pool = next;
  }
  if (pool.length !== 1) return null;

  const board = minimize(clues, cfg.length);
  // Una solución única por descarte no basta: todas sus cifras deben verse
  // en las pistas finales. Minimize puede haber quitado su única aparición.
  const visibleDigits = new Set(board.flatMap((clue) => [...clue.guess]));
  if (secret.some((digit) => !visibleDigits.has(digit))) return null;
  if (board.length < cfg.minRows || board.length > cfg.maxRows) return null;

  const zeroRows = board.filter(({ feedback: f }) => f.exact + f.present === 0);
  if (zeroRows.length > cfg.maxZeroRows) return null;
  const eliminated = new Set(zeroRows.flatMap((c) => [...c.guess])).size;
  if (eliminated > cfg.maxDirectEliminations || 10 - eliminated <= cfg.length) return null;
  if (cfg.length >= 4 && (!board.some((c) => c.feedback.exact >= 1) || !board.some((c) => c.feedback.present >= 1))) return null;

  // La dificultad corresponde al orden de las pistas que recibe el jugador.
  const ordered = shuffle(rng, board);
  const res = solve(ordered, cfg.length, cfg.maxTier);
  if (!res.solved || res.tier < cfg.minTier) return null;

  return {
    length: cfg.length,
    clues: ordered,
    solution: secret,
    tier: res.tier,
    steps: res.steps,
    difficulty: res.steps + 3 * res.tier2Uses + 8 * res.tier3Uses + board.length,
  };
}

/** Genera un tablero determinístico a partir de una semilla. */
export function generate(seed: string, cfg: CifraConfig): CifraPuzzle {
  const rng = rngFrom(seed);
  for (let attempt = 0; attempt < 4000; attempt++) {
    const p = tryBuild(rng, cfg);
    if (p) return { id: seed, ...p };
  }
  // Si la configuración es muy exigente, relajamos el mínimo de técnica.
  const relaxed = { ...cfg, minTier: 1 as const };
  for (let attempt = 0; attempt < 4000; attempt++) {
    const p = tryBuild(rng, relaxed);
    if (p) return { id: seed, ...p };
  }
  throw new Error(`No se pudo generar un tablero para ${seed}`);
}

export const _internal = { randInt };
