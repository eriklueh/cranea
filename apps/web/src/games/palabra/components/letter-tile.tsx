import type { CSSProperties } from "react";
import type { LetterScore } from "@cranea/core/palabra";
import { cn } from "@/lib/utils";

export const SCORE_LABEL: Record<LetterScore, string> = { 2: "en su lugar", 1: "está en otro lugar", 0: "no está" };

type Tone = "exact" | "present" | "absent" | "input" | "empty" | "solution";

export const toneFor = (score: LetterScore): Tone => (score === 2 ? "exact" : score === 1 ? "present" : "absent");

/** Símbolo chico en la esquina: el color nunca es la única señal (los mismos que usa Cifra). */
export function ScoreSymbol({ score, className }: { score: LetterScore; className?: string }) {
  if (score === 0) return null;
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full", score === 2 ? "bg-current" : "border-[1.5px] border-current", className)} />;
}

interface Props {
  letter?: string;
  tone?: Tone;
  size?: "sm" | "md";
  className?: string;
  style?: CSSProperties;
}

export function LetterTile({ letter, tone = "absent", size = "md", className, style }: Props) {
  const score: LetterScore | null = tone === "exact" ? 2 : tone === "present" ? 1 : null;
  return (
    <span
      style={style}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-md border-2 font-display font-bold uppercase select-none",
        size === "md" ? "size-12 text-[1.6rem]" : "size-9 text-lg",
        tone === "exact" && "border-clue-exact bg-clue-exact text-paper shadow-[0_2px_0_0_var(--shadow-ink)]",
        tone === "present" && "border-clue-present bg-clue-present-bg text-clue-present shadow-[0_2px_0_0_var(--shadow-ink)]",
        tone === "absent" && "border-pencil/40 bg-tile text-pencil",
        tone === "input" && "animate-pop border-ink bg-tile text-ink shadow-[0_2px_0_0_var(--shadow-ink)]",
        tone === "empty" && "border-dashed border-pencil/50 bg-transparent",
        tone === "solution" && "border-ok bg-tile text-ok shadow-[0_2px_0_0_var(--ok)]",
        className,
      )}
    >
      {letter?.toUpperCase() ?? ""}
      {score !== null && <ScoreSymbol score={score} className={cn("absolute", size === "md" ? "top-1 right-1" : "top-0.5 right-0.5 size-1.5")} />}
    </span>
  );
}
