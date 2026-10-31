"use client";
import { codeToString, score, type CifraPuzzle, type Clue, type Marks, type TileMark } from "@cranea/core/cifra";
import { MAX_ATTEMPTS, playedMs, type SavedSession } from "./store";

/**
 * Partida en curso guardada en el dispositivo, aparte de `cranea-progress`.
 * Se guarda por tablero (el id del diario incluye la fecha) y se descarta si el tablero cambió.
 */

const VERSION = 1;
const SESSION = "cranea-cifra-partida:";
const DRAWING = "cranea-cifra-dibujo:";
const DAILY_PREFIX = "cifra:daily:";

export type Point = { x: number; y: number };
export type Stroke = Point[];

const signature = (p: CifraPuzzle) => `${p.length}|${codeToString(p.solution)}|${p.clues.map((c) => `${codeToString(c.guess)}:${c.feedback.exact}:${c.feedback.present}`).join(",")}`;

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sin espacio o almacenamiento bloqueado: se juega igual */
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* almacenamiento bloqueado */
  }
}

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
function pruneDailies(current: string) {
  try {
    const stale: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      for (const prefix of [SESSION, DRAWING]) {
        if (key.startsWith(prefix + DAILY_PREFIX) && key !== prefix + current) stale.push(key);
      }
    }
    stale.forEach(remove);
  } catch {
    /* almacenamiento bloqueado */
  }
}

export function loadSession(p: CifraPuzzle): SavedSession | null {
  if (p.id.startsWith(DAILY_PREFIX)) pruneDailies(p.id);
  const raw = read(SESSION + p.id);
  if (raw === null) return null;
  const saved = parse(raw, p);
  if (!saved) clearSession(p.id);
  return saved;
}

export function saveSession(p: CifraPuzzle, s: SavedSession & { startedAt: number }) {
  write(SESSION + p.id, {
    v: VERSION,
    sig: signature(p),
    input: s.input,
    misses: s.misses.map((c) => c.guess),
    marks: s.marks,
    elapsed: Math.round(playedMs(s)),
    hintsUsed: s.hintsUsed,
  });
}

/** Borra la partida y el dibujo guardados de un tablero. */
export function clearSession(id: string) {
  remove(SESSION + id);
  remove(DRAWING + id);
}

const MAX_POINTS = 20_000;
const round = (n: number) => Math.round(n * 10) / 10;

export function loadDrawing(id: string): Stroke[] {
  const raw = read(DRAWING + id);
  const ok = Array.isArray(raw) && raw.every((stroke) => Array.isArray(stroke) && stroke.length > 0 && stroke.every((pt) => pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)));
  if (!ok) {
    if (raw !== null) remove(DRAWING + id);
    return [];
  }
  return raw as Stroke[];
}

export function saveDrawing(id: string, strokes: Stroke[]) {
  if (strokes.length === 0) return remove(DRAWING + id);
  if (strokes.reduce((n, s) => n + s.length, 0) > MAX_POINTS) return;
  write(DRAWING + id, strokes.map((stroke) => stroke.map(({ x, y }) => ({ x: round(x), y: round(y) }))));
}

/** Si hay una partida guardada de un tablero, sin validarla (para mostrar "Seguir"). */
export function hasSession(id: string) {
  return read(SESSION + id) !== null;
}
