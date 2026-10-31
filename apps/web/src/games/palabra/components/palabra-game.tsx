"use client";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { normalizeLetter, type PalabraPuzzle } from "@cranea/core/palabra";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/stores/progress";
import { GAME_ID, levelKey } from "../data";
import { useDictionary } from "../dictionary";
import { usePalabra } from "../store";
import { Keyboard } from "./keyboard";
import { LetterTile, toneFor } from "./letter-tile";
import { Lives } from "./lives";
import { ResultDialog, type GameMode } from "./result-dialog";
import { Timer } from "./timer";
import { describeRow } from "./word-row";
import { cn } from "@/lib/utils";
import { haptic, useOnChange, useSettled } from "@/lib/motion";
import { WinBurst } from "@/components/win-burst";
import { WORD_LENGTH } from "@cranea/core/palabra";

/** Lo que tarda en darse vuelta una fila (y en saltar, si ganaste): el resultado espera a que termine. */
const REVEAL_MS = { won: 1250, lost: 800 } as const;

export function PalabraGame({ puzzle, mode }: { puzzle: PalabraPuzzle; mode: GameMode }) {
  const start = usePalabra((s) => s.start);
  const current = usePalabra((s) => s.puzzle);
  const status = usePalabra((s) => s.status);
  const misses = usePalabra((s) => s.misses);
  const { dict, failed, retry } = useDictionary();
  const [resultOpen, setResultOpen] = useState(false);
  const revealed = useSettled(status !== "playing", status === "won" ? REVEAL_MS.won : REVEAL_MS.lost);
  const recorded = useRef(false);

  useEffect(() => {
    start(puzzle);
    recorded.current = false;
  }, [puzzle, start]);

  const allowed = dict?.allowed ?? null;
  const submit = useCallback(() => usePalabra.getState().submit(allowed), [allowed]);

  // Teclado físico: letras (las tildes se ignoran, la Ñ cuenta), Borrar y Enter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest('[role="dialog"], input, textarea, select, [contenteditable="true"]')) return;
      const s = usePalabra.getState();
      if (e.key === "Backspace") {
        e.preventDefault();
        s.backspace();
      } else if (e.key === "Enter") {
        // Enter sobre un botón conserva su activación nativa (por ejemplo, una tecla en pantalla).
        if (e.target instanceof Element && e.target.closest("button, a")) return;
        e.preventDefault();
        submit();
      } else {
        const letter = normalizeLetter(e.key);
        if (letter) s.press(letter);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submit]);

  // Guardar el resultado una sola vez.
  useEffect(() => {
    if (status === "playing" || recorded.current || current !== puzzle) return;
    recorded.current = true;
    const s = usePalabra.getState();
    const result = {
      won: status === "won",
      attempts: status === "won" ? s.misses.length + 1 : puzzle.attempts,
      timeMs: (s.finishedAt ?? Date.now()) - s.startedAt,
      at: Date.now(),
    };
    const p = useProgress.getState();
    if (mode.kind === "level") p.recordLevel(GAME_ID, levelKey(mode.world, mode.level), result);
    else if (!mode.practice) p.recordDaily(GAME_ID, mode.date, result);
    const t = setTimeout(() => setResultOpen(true), status === "won" ? 450 : 250);
    return () => clearTimeout(t);
  }, [status, current, puzzle, mode]);

  const title = mode.kind === "daily" ? `Palabra del día #${mode.number}` : `Nivel ${mode.level}`;
  const subtitle = mode.kind === "daily" ? "Misma palabra para todos" : `Mundo ${mode.world}`;

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <Link href="/palabra" className="mb-1 inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeftIcon className="size-4" /> {subtitle}
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-4 pb-1 text-sm font-semibold">
          <Lives />
          <Timer />
        </div>
      </div>

      <section aria-label="Tablero" className="anim-fade-up mb-3 space-y-3">
        <Board />
        {puzzle.hard && <p className="text-center text-xs text-muted-foreground">Modo difícil: usá todo lo que ya descubriste.</p>}
      </section>

      <section aria-label="Teclado" className="space-y-3">
        {status !== "playing" && (
          <div className="flex justify-center">
            <button className="text-sm font-semibold underline decoration-margin decoration-2 underline-offset-4" onClick={() => setResultOpen(true)}>
              Ver resultado
            </button>
          </div>
        )}
        {failed && (
          <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground" role="alert">
            No se pudo cargar la lista de palabras.
            <Button size="sm" variant="outline" onClick={retry}>Reintentar</Button>
          </div>
        )}
        <Keyboard ready={Boolean(dict)} onSubmit={submit} />
      </section>

      <ResultDialog
        open={resultOpen && revealed}
        onOpenChange={setResultOpen}
        mode={mode}
        onRetry={() => {
          setResultOpen(false);
          recorded.current = false;
          start(puzzle);
        }}
      />
    </main>
  );
}

const TILE = "size-[clamp(2.5rem,12vw,3rem)] text-[clamp(1.35rem,6vw,1.6rem)]";

/** Una fila por intento, como Wordle: lo probado, la palabra que estás escribiendo y lo que queda. */
function Board() {
  const puzzle = usePalabra((s) => s.puzzle);
  const misses = usePalabra((s) => s.misses);
  const input = usePalabra((s) => s.input);
  const status = usePalabra((s) => s.status);
  const shakeKey = usePalabra((s) => s.shakeKey);
  const message = usePalabra((s) => s.message);
  useOnChange(shakeKey, (key) => key > 0 && haptic("invalid"));
  useOnChange(status, (s) => s === "won" && haptic("win"));
  if (!puzzle) return null;
  const won = status === "won";
  // Al ganar, la palabra correcta se ve como una fila toda verde.
  const rows = won ? [...misses, { word: puzzle.answer, scores: Array(WORD_LENGTH).fill(2) as (0 | 1 | 2)[] }] : misses;

  return (
    <>
      <div className="relative">
        <ol className="flex flex-col items-center gap-1.5">
          {Array.from({ length: puzzle.attempts }, (_, i) => {
            const row = rows[i];
            if (row) {
              // Cada fila se da vuelta letra por letra una sola vez, cuando aparece; la ganadora además salta.
              const flip = won && i === misses.length ? "anim-flip-win" : "anim-flip";
              return (
                <li key={i} className="flex gap-1.5">
                  <span className="sr-only">{`Intento ${i + 1}: ${row.word.toUpperCase()}. ${describeRow(row)}.`}</span>
                  {[...row.word].map((letter, j) => (
                    <LetterTile key={j} letter={letter} tone={toneFor(row.scores[j])} className={cn(TILE, flip)} style={{ "--i": j } as CSSProperties} />
                  ))}
                </li>
              );
            }
            if (i === rows.length && status === "playing") {
              return (
                <li key={`in-${shakeKey}`} className={cn("flex gap-1.5", shakeKey > 0 && "animate-shake")} aria-label={`Tu palabra: ${input.join("").toUpperCase() || "vacía"}`}>
                  {Array.from({ length: WORD_LENGTH }, (_, j) =>
                    input[j] === undefined
                      ? <LetterTile key={j} tone="empty" className={cn(TILE, "border-solid border-pencil/60")} />
                      : <LetterTile key={`${j}-${input[j]}`} letter={input[j]} tone="input" className={TILE} />,
                  )}
                </li>
              );
            }
            return (
              <li key={i} aria-hidden className="flex gap-1.5">
                {Array.from({ length: WORD_LENGTH }, (_, j) => <LetterTile key={j} tone="empty" className={cn(TILE, "opacity-50")} />)}
              </li>
            );
          })}
        </ol>
        {won && <WinBurst delay={900} />}
      </div>
      <p role="status" aria-live="polite" className="min-h-5 text-center text-sm text-muted-foreground">{message}</p>
    </>
  );
}
