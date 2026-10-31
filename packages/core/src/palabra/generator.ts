import { randInt, rngFrom, type Rng } from "../rng";
import { WORD_LENGTH } from "./normalize";
import { matches, scoreWord } from "./score";
import type { Clue, PalabraConfig, PalabraPuzzle } from "./types";
import type { Dictionary } from "./words";

/** Respuestas que encajan con las pistas, cortando al pasar `limit`. */
export function countAnswers(answers: readonly string[], clues: readonly Clue[], limit = Infinity): number {
  let n = 0;
  for (const word of answers) {
    if (clues.every((clue) => matches(word, clue)) && ++n >= limit) return n;
  }
  return n;
}

/** Quita filas que sobran: cada fila del tablero final es necesaria para que quede una sola respuesta. */
function minimize(answers: readonly string[], clues: Clue[]): Clue[] {
  const out = clues.slice();
  for (let i = out.length - 1; i >= 0; i--) {
    const without = out.filter((_, j) => j !== i);
    if (countAnswers(answers, without, 2) === 1) out.splice(i, 1);
  }
  return out;
}

export interface BoardStats {
  rows: number;
  greens: number;
  yellows: number;
  grayRows: number;
  /** Posiciones distintas que alguna fila deja fijas en verde. */
  fixed: number;
}

export function boardStats(clues: readonly Clue[]): BoardStats {
  const fixed = new Set<number>();
  let greens = 0;
  let yellows = 0;
  let grayRows = 0;
  for (const clue of clues) {
    clue.scores.forEach((s, i) => {
      if (s === 2) {
        greens++;
        fixed.add(i);
      } else if (s === 1) yellows++;
    });
    if (clue.scores.every((s) => s === 0)) grayRows++;
  }
  return { rows: clues.length, greens, yellows, grayRows, fixed: fixed.size };
}

/**
 * Cada letra de la respuesta (contando repeticiones) aparece en verde o amarilla en alguna fila.
 * Así el tablero se resuelve ubicando letras conocidas, sin depender de adivinar una letra que nunca se vio.
 */
export function coversAnswer(clues: readonly Clue[], answer: string): boolean {
  const need = new Map<string, number>();
  for (const letter of answer) need.set(letter, (need.get(letter) ?? 0) + 1);
  for (const [letter, count] of need) {
    let best = 0;
    for (const clue of clues) {
      let shown = 0;
      for (let i = 0; i < WORD_LENGTH; i++) if (clue.word[i] === letter && clue.scores[i] > 0) shown++;
      best = Math.max(best, shown);
    }
    if (best < count) return false;
  }
  return true;
}

/**
 * Dificultad: 3 por fila que hay que cruzar, 2 por cada lugar sin ninguna verde que lo fije,
 * más el promedio de log2(respuestas que deja cada fila sola). Filas que solas descartan poco suman más.
 */
export function difficultyOf(answers: readonly string[], clues: readonly Clue[]): number {
  const { rows, fixed } = boardStats(clues);
  const spread = clues.reduce((sum, clue) => sum + Math.log2(Math.max(1, countAnswers(answers, [clue]))), 0) / Math.max(1, rows);
  return 3 * rows + 2 * (WORD_LENGTH - fixed) + Math.round(spread);
}

/** Palabras válidas que no son la respuesta pero también encajan con todas las pistas. */
export function alternatives(dict: Dictionary, clues: readonly Clue[], answer: string): string[] {
  const out: string[] = [];
  for (const word of dict.allowed) if (word !== answer && clues.every((clue) => matches(word, clue))) out.push(word);
  return out;
}

function tryBuild(rng: Rng, cfg: PalabraConfig, dict: Dictionary, answer: string): Clue[] | null {
  const { answers } = dict;
  const clues: Clue[] = [];
  const used = new Set([answer]);
  let pool = answers.slice();
  let grayRows = 0;
  let tries = 0;

  while (pool.length > 1 && clues.length < cfg.maxRows + 3 && tries++ < 400) {
    const word = answers[randInt(rng, answers.length)];
    if (used.has(word)) continue;
    const scores = scoreWord(answer, word);
    const greens = scores.filter((s) => s === 2).length;
    if (greens > cfg.maxGreensPerRow) continue;
    const gray = scores.every((s) => s === 0);
    if (gray && grayRows >= cfg.maxGrayRows) continue;
    const clue: Clue = { word, scores };
    const next = pool.filter((w) => matches(w, clue));
    if (next.length === pool.length) continue;
    used.add(word);
    clues.push(clue);
    if (gray) grayRows++;
    pool = next;
  }
  if (pool.length !== 1) return null;

  const board = minimize(answers, clues);
  if (!coversAnswer(board, answer)) return null;
  const stats = boardStats(board);
  if (stats.rows < cfg.minRows || stats.rows > cfg.maxRows) return null;
  if (stats.greens < cfg.minGreens || stats.greens > cfg.maxGreens) return null;
  if (stats.yellows < cfg.minYellows || stats.yellows > cfg.maxYellows) return null;
  if (stats.grayRows > cfg.maxGrayRows) return null;
  if (alternatives(dict, board, answer).length > cfg.maxAlternatives) return null;
  return board;
}

/**
 * Con una semilla elige la respuesta y arma filas puntuadas hasta que una sola respuesta encaje.
 * Después quita las filas que sobran y valida el balance del mundo. Mismo seed => mismo tablero.
 */
export function generate(seed: string, cfg: PalabraConfig, dict: Dictionary, answer?: string): PalabraPuzzle {
  const rng = rngFrom(seed);
  for (let attempt = 0; attempt < 4000; attempt++) {
    const target = answer ?? dict.answers[randInt(rng, dict.answers.length)];
    const clues = tryBuild(rng, cfg, dict, target);
    if (!clues) continue;
    return { id: seed, answer: target, display: dict.display.get(target) ?? target, clues, difficulty: difficultyOf(dict.answers, clues) };
  }
  throw new Error(`No se pudo generar un tablero para ${seed}`);
}
