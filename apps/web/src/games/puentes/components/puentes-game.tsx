"use client";
import Link from "next/link";
import { CheckIcon, ChevronLeftIcon, RotateCcwIcon, Undo2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PuentesPuzzle } from "@cranea/core/puentes";
import { FinishSlot } from "@/components/finish-slot";
import { Button } from "@/components/ui/button";
import { WIN_RESULT_MS } from "@/lib/motion";
import { useProgress } from "@/stores/progress";
import { GAME_ID, levelKey } from "../data";
import { attemptsOf, usePuentes, type Notice } from "../store";
import { PuentesBoard } from "./board";
import { mistakesCount, mistakesText, ResultDialog, type GameMode } from "./result-dialog";
import { Timer } from "./timer";
import type { TutorialMode } from "@/components/tutorial/mode";
import { useT, type T } from "@/lib/i18n";

function noticeText(n: Notice, status: string, t: T) {
  if (status === "won") return t("puentes.noticeWon");
  if (status === "review") return t("puentes.noticeReview");
  if (!n) return "";
  if (n.kind === "blocked") return t("puentes.noticeBlocked");
  if (n.kind === "wrong") return t("puentes.noticeWrong", { count: n.count });
  return t("puentes.noticeOk", { count: n.missing });
}

export function PuentesGame({ puzzle, mode, alreadyPlayed = false }: { puzzle: PuentesPuzzle; mode: GameMode | TutorialMode; alreadyPlayed?: boolean }) {
  const t = useT();
  const start = usePuentes((s) => s.start);
  const review = usePuentes((s) => s.review);
  const current = usePuentes((s) => s.puzzle);
  const status = usePuentes((s) => s.status);
  const mistakes = usePuentes((s) => s.mistakes);
  const notice = usePuentes((s) => s.notice);
  const canUndo = usePuentes((s) => s.history.length > 0);
  const hasBridges = usePuentes((s) => s.bridges.some((b) => b > 0));
  const { undo, reset, check } = usePuentes.getState();
  const [resultOpen, setResultOpen] = useState(false);
  const recorded = useRef(false);

  useEffect(() => {
    if (alreadyPlayed) review(puzzle);
    else start(puzzle);
    recorded.current = false;
    setResultOpen(false);
  }, [puzzle, alreadyPlayed, start, review]);

  // Deshacer con Ctrl/Cmd + Z.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z" || e.shiftKey) return;
      if (e.target instanceof Element && e.target.closest('[role="dialog"], input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      usePuentes.getState().undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Guardar el resultado una sola vez.
  useEffect(() => {
    if (status !== "won" || recorded.current || current !== puzzle || mode.kind === "tutorial") return;
    recorded.current = true;
    const s = usePuentes.getState();
    const result = { won: true, attempts: attemptsOf(s.mistakes), timeMs: (s.finishedAt ?? Date.now()) - s.startedAt, at: Date.now() };
    const p = useProgress.getState();
    if (mode.kind === "level") p.recordLevel(GAME_ID, levelKey(mode.world, mode.level), result);
    else if (!mode.practice) p.recordDaily(GAME_ID, mode.date, result);
    const timer = setTimeout(() => setResultOpen(true), WIN_RESULT_MS);
    return () => clearTimeout(timer);
  }, [status, current, puzzle, mode]);

  const title = mode.kind === "tutorial" ? t("common.tutorial") : mode.kind === "daily" ? t("puentes.dailyTitle", { n: mode.number }) : t("common.level", { n: mode.level });
  const subtitle = mode.kind === "tutorial" ? "Puentes" : mode.kind === "daily" ? t("puentes.sameBoard") : t("common.world", { n: mode.world });
  const message = noticeText(notice, status, t);

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <Link href="/puentes" className="mb-1 inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeftIcon className="size-4" /> {subtitle}
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        </div>
        {status !== "review" && (
          <div className="flex items-center gap-4 pb-1 text-sm font-semibold">
            <span className={mistakes ? "text-margin" : undefined}>{mistakesCount(mistakes, t)}</span>
            <Timer />
          </div>
        )}
      </div>

      <section aria-label={t("puentes.boardLabel")} className="anim-appear mb-3">
        <PuentesBoard puzzle={puzzle} />
      </section>

      <p aria-live="polite" className={`mb-4 min-h-6 text-center text-sm ${notice?.kind === "wrong" ? "text-margin" : "text-muted-foreground"}`}>
        {message}
      </p>

      {status === "review" ? (
        <div className="flex justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/puentes">{t("puentes.backToWorlds")}</Link>
          </Button>
        </div>
      ) : (
        // Al ganar, "Ver resultado" ocupa el lugar de los controles sin cambiar el alto de la página.
        <FinishSlot
          finished={status === "won"}
          done={
            <button className="min-h-11 text-sm font-semibold underline decoration-margin decoration-2 underline-offset-4" onClick={() => setResultOpen(true)}>
              {t("puentes.seeResult", { result: mistakesText(mistakes, t), short: mistakesCount(mistakes, t).toLowerCase() })}
            </button>
          }
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" size="lg" onClick={undo} disabled={!canUndo}>
              <Undo2Icon /> {t("puentes.undo")}
            </Button>
            <Button variant="outline" size="lg" onClick={reset} disabled={!hasBridges}>
              <RotateCcwIcon /> {t("puentes.reset")}
            </Button>
            <Button size="lg" onClick={check} disabled={!hasBridges}>
              <CheckIcon /> {t("puentes.check")}
            </Button>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("puentes.controlsHelp")}
          </p>
        </FinishSlot>
      )}

      {mode.kind !== "tutorial" && <ResultDialog open={resultOpen} onOpenChange={setResultOpen} mode={mode} />}
    </main>
  );
}
