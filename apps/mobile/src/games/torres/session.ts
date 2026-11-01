import type { TorresPuzzle } from "@cranea/core/torres";
import { keysWithPrefix, readJSON, removeKey, writeJSON } from "@/lib/storage";
import { MAX_ATTEMPTS } from "./data";
import type { SavedSession } from "./store";

/**
 * Partida en curso guardada en el dispositivo (solo la app; la web no la guarda), aparte de
 * `cranea-progress`: `cranea-torres-partida:<id>`. Se descarta si el tablero cambió.
 */

const VERSION = 1;
const SESSION = "cranea-torres-partida:";
const DAILY_PREFIX = "torres:daily:";

const signature = (p: TorresPuzzle) => `${p.size}|${p.solution.join("")}|${p.givens.join("")}`;

function parse(raw: unknown, p: TorresPuzzle): SavedSession | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const cells = p.size * p.size;
  if (o.v !== VERSION || o.sig !== signature(p)) return null;
  const { values, notes } = o;
  if (!Array.isArray(values) || values.length !== cells || !values.every((v) => Number.isInteger(v) && v >= 0 && v <= p.size)) return null;
  if (p.givens.some((g, i) => g !== 0 && values[i] !== g)) return null;
  if (!Array.isArray(notes) || notes.length !== cells || !notes.every((n) => Number.isInteger(n) && n >= 0 && n < 1 << p.size)) return null;
  const mistakes = Number(o.mistakes);
  if (!Number.isInteger(mistakes) || mistakes < 0 || mistakes >= MAX_ATTEMPTS) return null;
  const elapsed = Number(o.elapsed);
  if (!Number.isFinite(elapsed) || elapsed < 0) return null;
  return { values: values as number[], notes: notes as number[], mistakes, elapsed };
}

/** Los diarios de otros días ya no se pueden retomar. */
async function pruneDailies(current: string) {
  const stale = (await keysWithPrefix(SESSION + DAILY_PREFIX)).filter((k) => k !== SESSION + current);
  stale.forEach(removeKey);
}

export async function loadSession(p: TorresPuzzle): Promise<SavedSession | null> {
  if (p.id.startsWith(DAILY_PREFIX)) void pruneDailies(p.id);
  const raw = await readJSON(SESSION + p.id);
  if (raw === null) return null;
  const saved = parse(raw, p);
  if (!saved) clearSession(p.id);
  return saved;
}

export function saveSession(p: TorresPuzzle, s: SavedSession) {
  // Un tablero sin tocar no se guarda: "Seguir" solo aparece si hay algo para seguir.
  const touched = s.mistakes > 0 || s.notes.some(Boolean) || s.values.some((v, i) => v !== p.givens[i]);
  if (!touched) return clearSession(p.id);
  writeJSON(SESSION + p.id, { v: VERSION, sig: signature(p), values: s.values, notes: s.notes, mistakes: s.mistakes, elapsed: Math.round(s.elapsed) });
}

export function clearSession(id: string) {
  removeKey(SESSION + id);
}

/** Si hay una partida guardada de un tablero, sin validarla (para mostrar "Seguir"). */
export async function hasSession(id: string) {
  return (await readJSON(SESSION + id)) !== null;
}
