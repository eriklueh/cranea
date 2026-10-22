"use client";
import { create } from "zustand";
import { emptyMarks, nextMark, score, type CifraPuzzle, type Clue, type Marks } from "@cranea/core/cifra";

export const MAX_ATTEMPTS = 3;

interface CifraSession {
  puzzle: CifraPuzzle | null;
  input: number[];
  misses: Clue[];
  status: "playing" | "won" | "lost";
  marks: Marks;
  startedAt: number;
  finishedAt: number | null;
  shakeKey: number;
  start: (p: CifraPuzzle) => void;
  press: (d: number) => void;
  backspace: () => void;
  submit: () => void;
  cycleMark: (row: number, position: number) => void;
}

export const useCifra = create<CifraSession>((set, get) => ({
  puzzle: null,
  input: [],
  misses: [],
  status: "playing",
  marks: emptyMarks(),
  startedAt: 0,
  finishedAt: null,
  shakeKey: 0,

  start: (puzzle) =>
    set({ puzzle, input: [], misses: [], status: "playing", marks: emptyMarks(), startedAt: Date.now(), finishedAt: null, shakeKey: 0 }),

  press: (d) => {
    const { puzzle, input, status } = get();
    if (!puzzle || status !== "playing" || input.length >= puzzle.length || input.includes(d)) return;
    set({ input: [...input, d] });
  },

  backspace: () => {
    const { input, status } = get();
    if (status === "playing") set({ input: input.slice(0, -1) });
  },

  submit: () => {
    const { puzzle, input, misses, status, shakeKey } = get();
    if (!puzzle || status !== "playing" || input.length !== puzzle.length) return;
    const feedback = score(puzzle.solution, input);
    if (feedback.exact === puzzle.length) {
      set({ status: "won", finishedAt: Date.now() });
      return;
    }
    const next = [...misses, { guess: input, feedback }];
    const lost = next.length >= MAX_ATTEMPTS;
    set({
      misses: next,
      input: [],
      shakeKey: shakeKey + 1,
      status: lost ? "lost" : "playing",
      finishedAt: lost ? Date.now() : null,
    });
  },

  cycleMark: (row, position) => {
    const { puzzle, status, misses } = get();
    if (!puzzle || status !== "playing" || !Number.isInteger(row) || row < 0 || row >= puzzle.clues.length + misses.length || !Number.isInteger(position) || position < 0 || position >= puzzle.length) return;
    set((s) => ({ marks: nextMark(s.marks, row, position) }));
  },
}));
