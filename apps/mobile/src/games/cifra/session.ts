import { codeToString, score, type CifraPuzzle, type Clue, type Marks, type TileMark } from "@cranea/core/cifra";
import { keysWithPrefix, readJSON, removeKey, writeJSON } from "@/lib/storage";
import { MAX_ATTEMPTS } from "./data";
import { playedMs, type SavedSession } from "./store";

/**
 * Partida en curso guardada en el dispositivo, aparte de `cranea-progress`, con el mismo formato
 * y las mismas claves que la web (`cranea-cifra-partida:<id>`). Se descarta si el tablero cambió.
 */

const VERSION = 1;
const SESSION = "cranea-cifra-partida:";
const DAILY_PREFIX = "cifra:daily:";

const signature = (p: CifraPuzzle) => `${p.length}|${codeToString(p.solution)}|${p.clues.map((c) => `${codeToString(c.guess)}:${c.feedback.exact}:${c.feedback.present}`).join(",")}`;

const isDigit = (d: unknown): d is number => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 9;
const isCode = (c: unknown, max: number): c is number[] => Array.isArray(c) && c.length <= max && c.every(isDigit) && new Set(c).size === c.length;
const MARKS: TileMark[] = ["out", "in", "here"];

/** Valida lo guardado contra el tablero actual; los puntajes se recalculan, no se confían. */
function parse(raw: unknown, p: CifraPuzzle): SavedSession | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== VERSION || o.sig !== signature(p)) return null;
  if (!isCode(o.input, p.length)) return null;
  if (!Array.isArray(o.misses) || o.misses.length >= MAX_ATTEMPTS) return null;
  const misses: Clue[] = [];
  for (const guess of o.misses) {
    if (!isCode(guess, p.length) || guess.length !== p.length) return null;
    const feedback = score(p.solution, guess);
    if (feedback.exact === p.length) return null;
    misses.push({ guess, feedback });
  }
  if (!o.marks || typeof o.marks !== "object" || Array.isArray(o.marks)) return null;
  const rows = p.clues.length + misses.length;
  const marks: Marks = {};
  for (const [key, mark] of Object.entries(o.marks)) {
    const m = /^(\d+):(\d+)$/.exec(key);
    if (!m || Number(m[1]) >= rows || Number(m[2]) >= p.length || !MARKS.includes(mark as TileMark)) return null;
    marks[key] = mark as TileMark;
  }
  const elapsed = Number(o.elapsed);
  if (!Number.isFinite(elapsed) || elapsed < 0) return null;
  const hintsUsed = Number.isInteger(o.hintsUsed) && (o.hintsUsed as number) >= 0 ? (o.hintsUsed as number) : 0;
  return { input: o.input, misses, marks, elapsed, hintsUsed };
}

/** Los diarios de otros días ya no se pueden retomar. */
async function pruneDailies(current: string) {
  const stale = (await keysWithPrefix(SESSION + DAILY_PREFIX)).filter((k) => k !== SESSION + current);
  stale.forEach(removeKey);
}

export async function loadSession(p: CifraPuzzle): Promise<SavedSession | null> {
  if (p.id.startsWith(DAILY_PREFIX)) void pruneDailies(p.id);
  const raw = await readJSON(SESSION + p.id);
  if (raw === null) return null;
  const saved = parse(raw, p);
  if (!saved) clearSession(p.id);
  return saved;
}

export function saveSession(p: CifraPuzzle, s: SavedSession & { startedAt: number }) {
  writeJSON(SESSION + p.id, {
    v: VERSION,
    sig: signature(p),
    input: s.input,
    misses: s.misses.map((c) => c.guess),
    marks: s.marks,
    elapsed: Math.round(playedMs(s)),
    hintsUsed: s.hintsUsed,
  });
}

export function clearSession(id: string) {
  removeKey(SESSION + id);
}

/** Si hay una partida guardada de un tablero, sin validarla (para mostrar "Seguir"). */
export async function hasSession(id: string) {
  return (await readJSON(SESSION + id)) !== null;
}
