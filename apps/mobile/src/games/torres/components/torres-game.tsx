import type { TorresPuzzle } from "@cranea/core/torres";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";
import Animated from "react-native-reanimated";
import { DailyNotice } from "@/components/daily-gate";
import { FinishSlot, ResultLink } from "@/components/finish-slot";
import { GameHeader, gameTitle } from "@/components/game-header";
import { ResultSheet } from "@/components/result-sheet";
import { attemptMarks, ResultShareButton, resultLabel, type ResultCard } from "@/components/share-card";
import { PlusNudge } from "@/components/plus-nudge";
import { ExtraAttemptOffer, useExtraAttemptOffer } from "@/components/rewards";
import { Button, Screen } from "@/components/ui";
import { SHARE_URL } from "@/config";
import { formatTime } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { useLocale, useT } from "@/lib/i18n";
import { sound } from "@/lib/sound";
import { useOnChange, useSettled } from "@/lib/hooks";
import { DURATION, LOSS_RESULT_MS, motion, useShake, WIN_RESULT_MS } from "@/lib/motion";
import { useProgress } from "@/stores/progress";
import { GAME_ID, MAX_ATTEMPTS, levelKey } from "../data";
import { clearSession, loadSession, saveSession } from "../session";
import { attemptsOf, playedMs, useTorres } from "../store";
import { Board, useBoardWidth } from "./board";
import { CheckMessage, Lives, NumberPad, Timer, Toolbar } from "./controls";

export type GameMode =
  | { kind: "level"; world: number; level: number; next: number | null }
  | { kind: "daily"; date: string; number: number; /** Repetición: no se guarda ni cuenta para el ranking. */ practice: boolean };

export function TorresGame({ puzzle, mode }: { puzzle: TorresPuzzle; mode: GameMode }) {
  const start = useTorres((s) => s.start);
  const current = useTorres((s) => s.puzzle);
  const status = useTorres((s) => s.status);
  const check = useTorres((s) => s.check);
  const [loaded, setLoaded] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const recorded = useRef(false);
  /** La práctica (repetir el de hoy o un diario del archivo) no se retoma: no se guarda la partida. */
  const persist = !(mode.kind === "daily" && mode.practice);
  const t = useT();
  const locale = useLocale();

  useOnChange(check, (c) => {
    if (c?.kind === "wrong") haptic("invalid");
    else if (c?.kind === "ok") haptic("line");
  });
  useOnChange(status, (s) => s === "won" && haptic("win"));
  // Sonido al escribir o borrar una altura (como la web; solo con «Sonido» prendido).
  const values = useTorres((s) => s.values);
  useOnChange(values, () => sound("tap"));

  // Retomar la partida guardada en el dispositivo (o empezar de cero).
  useEffect(() => {
    let alive = true;
    setLoaded(false);
    recorded.current = false;
    (persist ? loadSession(puzzle) : Promise.resolve(null)).then((saved) => {
      if (!alive) return;
      start(puzzle, saved);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [puzzle, start, persist]);

  // Guardar la partida en curso. En segundo plano el reloj se pausa.
  useEffect(() => {
    if (!loaded) return;
    const save = () => {
      const s = useTorres.getState();
      // El intento extra de un diario perdido no se retoma: la derrota ya está guardada.
      if (persist && s.puzzle === puzzle && s.status === "playing" && !s.extraAttempt) {
        saveSession(puzzle, { values: s.values, notes: s.notes, mistakes: s.mistakes, elapsed: playedMs(s) });
      }
    };
    const unsubscribe = useTorres.subscribe((s, prev) => {
      if (s.values !== prev.values || s.notes !== prev.notes || s.mistakes !== prev.mistakes) save();
    });
    const app = AppState.addEventListener("change", (state) => {
      const s = useTorres.getState();
      if (s.puzzle !== puzzle) return;
      if (state === "active") s.resume();
      else {
        s.pause();
        save();
      }
    });
    return () => {
      save();
      unsubscribe();
      app.remove();
    };
  }, [puzzle, loaded, persist]);

  // Guardar el resultado una sola vez, con las mismas claves y el mismo formato que la web.
  useEffect(() => {
    if (!loaded || status === "playing" || recorded.current || current !== puzzle) return;
    recorded.current = true;
    const s = useTorres.getState();
    const result = { won: status === "won", attempts: attemptsOf(status, s.mistakes), timeMs: playedMs(s), at: Date.now() };
    const p = useProgress.getState();
    if (mode.kind === "level") p.recordLevel(GAME_ID, levelKey(mode.world, mode.level), result);
    // Con el intento extra: si sale, reemplaza a la derrota (4 intentos > 3, `first`); si no, queda la derrota.
    else if (!mode.practice && (result.won || !s.extraAttempt)) p.recordDaily(GAME_ID, mode.date, result);
    clearSession(puzzle.id);
    const id = setTimeout(() => setResultOpen(true), status === "won" ? WIN_RESULT_MS : LOSS_RESULT_MS);
    return () => clearTimeout(id);
  }, [status, current, puzzle, mode, loaded]);

  const context = mode.kind === "daily" ? t("torres.contextDaily") : t("torres.contextLevel", { size: `${puzzle.size}×${puzzle.size}` });
  const ready = loaded && current === puzzle;

  return (
    <>
      <Stack.Screen options={{ title: gameTitle("Torres", mode, locale) }} />
      <Screen contentStyle={{ flexGrow: 1, gap: 10 }}>
        <GameHeader context={context} right={ready ? <><Lives /><Timer /></> : null} />
        {mode.kind === "daily" && <DailyNotice practice={mode.practice} />}
        {ready && (
          <>
            <Animated.View entering={motion.appear()}>
              <PlayBoard />
            </Animated.View>
            <CheckMessage />
            {/* En pantallas altas, el teclado queda abajo, al alcance del pulgar. */}
            <View style={{ flexGrow: 1 }} />
            {/* Al terminar, "Ver resultado" ocupa el lugar de los controles: la pantalla no cambia de alto. */}
            <FinishSlot finished={status !== "playing"} done={<ResultLink onPress={() => setResultOpen(true)} />}>
              <View style={{ gap: 8 }}>
                <NumberPad />
                <Toolbar />
              </View>
            </FinishSlot>
          </>
        )}
      </Screen>
      <TorresResult
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        mode={mode}
        onRetry={() => {
          setResultOpen(false);
          clearSession(puzzle.id);
          recorded.current = false;
          start(puzzle);
        }}
        onExtra={() => {
          setResultOpen(false);
          recorded.current = false;
          useTorres.getState().continueWithExtra();
        }}
      />
    </>
  );
}

/** El tablero en juego: tiembla cuando una comprobación encuentra errores. */
function PlayBoard() {
  const puzzle = useTorres((s) => s.puzzle);
  const values = useTorres((s) => s.values);
  const notes = useTorres((s) => s.notes);
  const selected = useTorres((s) => s.selected);
  const wrong = useTorres((s) => s.wrong);
  const status = useTorres((s) => s.status);
  const check = useTorres((s) => s.check);
  const select = useTorres((s) => s.select);
  const width = useBoardWidth(puzzle?.size ?? 5);
  const shake = useShake(check?.kind === "wrong" ? check.key : 0);
  const onSelect = useCallback((cell: number) => select(cell), [select]);
  const t = useT();
  if (!puzzle) return null;
  return (
    <Animated.View style={shake} accessibilityLabel={t("torres.city")}>
      <Board
        size={puzzle.size}
        clues={puzzle.clues}
        givens={puzzle.givens}
        values={values}
        notes={notes}
        selected={status === "playing" ? selected : null}
        wrong={wrong}
        onSelect={onSelect}
        readOnly={status !== "playing"}
        rise={status === "playing"}
        wave={status === "won"}
        width={width}
      />
    </Animated.View>
  );
}

function TorresResult({ open, onClose, mode, onRetry, onExtra }: { open: boolean; onClose: () => void; mode: GameMode; onRetry: () => void; onExtra: () => void }) {
  const router = useRouter();
  const puzzle = useTorres((s) => s.puzzle);
  const status = useTorres((s) => s.status);
  const mistakes = useTorres((s) => s.mistakes);
  const extraAttempt = useTorres((s) => s.extraAttempt);
  const startedAt = useTorres((s) => s.startedAt);
  const finishedAt = useTorres((s) => s.finishedAt);
  const official = mode.kind === "daily" && !mode.practice;
  const offer = useExtraAttemptOffer(GAME_ID, official ? mode.date : null);
  const [revealed, setRevealed] = useState(false);
  // La ciudad resuelta se levanta en ola apenas sube la hoja.
  const settled = useSettled(open, DURATION.slow);
  const t = useT();
  const locale = useLocale();
  if (!puzzle || status === "playing") return null;

  const won = status === "won";
  const attempts = attemptsOf(status, mistakes);
  const time = formatTime(playedMs({ startedAt, finishedAt, pausedAt: null }));
  const title = mode.kind === "daily" ? gameTitle("Torres", mode, locale) : t("torres.levelShort", { world: mode.world, level: mode.level });
  // Diario perdido con el intento extra a mano: la solución queda tapada hasta que se elige.
  const offering = official && !won && !extraAttempt && offer.available && !revealed;
  const marks = Array.from({ length: MAX_ATTEMPTS + (extraAttempt ? 1 : 0) }, (_, i) => (i < mistakes ? "🟥" : won && i === mistakes ? "🟩" : "⬜")).join("");
  const score = won ? (extraAttempt ? t("torres.extraScore") : `${attempts}/${MAX_ATTEMPTS}`) : "X";
  const shareMessage = t("torres.share", { title, marks, score, time, url: `${SHARE_URL}/torres` });
  // La cuadrícula vacía de la ciudad: ni pistas ni alturas.
  const card: ResultCard = {
    game: "Torres",
    label: resultLabel(mode, locale),
    won,
    headline: won ? (extraAttempt ? t("torres.cardExtra") : `${attempts}/${MAX_ATTEMPTS}`) : t("torres.cardLost"),
    detail: won ? `${puzzle.size}×${puzzle.size} · ${mistakes === 0 ? t("torres.noMistakes") : t("common.errors", { count: mistakes })} · ${time}` : t("torres.unsolvedTime", { time }),
    visual: { kind: "board", width: puzzle.size, height: puzzle.size },
    marks: attemptMarks(MAX_ATTEMPTS + (extraAttempt ? 1 : 0), mistakes, won),
  };

  return (
    <ResultSheet
      visible={open}
      onClose={onClose}
      title={won ? (extraAttempt ? t("torres.wonExtraTitle") : attempts === 1 ? t("torres.wonCleanTitle") : t("torres.wonTitle")) : t("torres.lostTitle")}
      description={
        won
          ? extraAttempt
            ? t("torres.wonExtraDesc", { title, time })
            : t("torres.wonDesc", { title, attempts, max: MAX_ATTEMPTS, time })
          : offering
            ? t("torres.pendingDesc", { title })
            : t("torres.lostDesc", { title })
      }
    >
      {offering && mode.kind === "daily" ? (
        <ExtraAttemptOffer gameId={GAME_ID} date={mode.date} onGranted={onExtra} onReveal={() => setRevealed(true)} />
      ) : (
        <Board size={puzzle.size} clues={puzzle.clues} givens={puzzle.givens} values={puzzle.solution} readOnly feedback={false} wave={settled} width={Math.min(260, puzzle.size * 40 + 56)} />
      )}
      <View style={{ gap: 8 }}>
        {mode.kind === "level" && mode.next ? (
          <Button
            title={t("torres.nextLevel")}
            size="lg"
            onPress={() => {
              onClose();
              router.replace({ pathname: "/torres/nivel/[mundo]/[nivel]", params: { mundo: String(mode.world), nivel: String(mode.next) } });
            }}
          />
        ) : (
          <Button title={t("torres.backToWorlds")} size="lg" onPress={() => { onClose(); router.navigate("/torres"); }} />
        )}
        {mode.kind === "level" && !won && <Button title={t("common.retry")} variant="outline" icon="refresh" onPress={onRetry} />}
        {mode.kind === "daily" && (
          <Button title={t("torres.seeRanking")} variant="outline" icon="trophy-outline" onPress={() => { onClose(); router.push({ pathname: "/ranking", params: { juego: GAME_ID, fecha: mode.date } }); }} />
        )}
        <ResultShareButton text={shareMessage} card={card} />
      </View>
      <PlusNudge gameId={GAME_ID} mode={mode} won={won} onLeave={onClose} />
    </ResultSheet>
  );
}
