import type { CifraPuzzle } from "@cranea/core/cifra";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { DailyNotice } from "@/components/daily-gate";
import { FinishSlot, ResultLink } from "@/components/finish-slot";
import { cifraStepText } from "@cranea/core/i18n";
import { GameHeader, gameTitle } from "@/components/game-header";
import { ResultSheet } from "@/components/result-sheet";
import { attemptMarks, ResultShareButton, resultLabel, type ResultCard } from "@/components/share-card";
import { PlusNudge } from "@/components/plus-nudge";
import { ExtraAttemptOffer, HintOffer, useExtraAttemptOffer } from "@/components/rewards";
import { Button, Icon, Row, Screen, Text } from "@/components/ui";
import { SHARE_URL } from "@/config";
import { FREE_HINTS, usePlus } from "@/entitlements";
import { formatTime } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { DURATION, LOSS_RESULT_MS, motion, staggerStep, WIN_RESULT_MS } from "@/lib/motion";
import { useProgress } from "@/stores/progress";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";
import { displayWorld, GAME_ID, MAX_ATTEMPTS, levelKey } from "../data";
import { hintNudge, nextHintStep, traceFor } from "../hints";
import { clearSession, loadSession, saveSession } from "../session";
import { attemptLimit, playedMs, useCifra } from "../store";
import { InputSlots, Keypad } from "./keypad";
import { ClueRow, DigitTile, Symbol, useTileSize } from "./tiles";

export type GameMode =
  | { kind: "level"; world: number; level: number; next: number | null }
  | { kind: "daily"; date: string; number: number; /** Repetición: no se guarda ni cuenta para el ranking. */ practice: boolean };

export function CifraGame({ puzzle, mode }: { puzzle: CifraPuzzle; mode: GameMode }) {
  const { colors } = useTheme();
  const start = useCifra((s) => s.start);
  const current = useCifra((s) => s.puzzle);
  const status = useCifra((s) => s.status);
  const misses = useCifra((s) => s.misses);
  const marks = useCifra((s) => s.marks);
  const cycleMark = useCifra((s) => s.cycleMark);
  const hint = useCifra((s) => s.hint);
  const [loaded, setLoaded] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const recorded = useRef(false);
  const size = useTileSize(puzzle.length);
  const hintRows = hint && hint.step >= 0 ? (traceFor(puzzle).steps[hint.step]?.rows ?? []) : [];
  /** La práctica (repetir el de hoy o un diario del archivo) no se retoma: no se guarda la partida. */
  const persist = !(mode.kind === "daily" && mode.practice);

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
      const s = useCifra.getState();
      // El intento extra de un diario perdido no se retoma: la derrota ya está guardada.
      if (persist && s.puzzle === puzzle && s.status === "playing" && !s.extraAttempt) saveSession(puzzle, s);
    };
    const unsubscribe = useCifra.subscribe((s, prev) => {
      if (s.input !== prev.input || s.misses !== prev.misses || s.marks !== prev.marks || s.hintsUsed !== prev.hintsUsed) save();
    });
    const app = AppState.addEventListener("change", (state) => {
      const s = useCifra.getState();
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

  // Guardar el resultado una sola vez, con las mismas claves que la web.
  useEffect(() => {
    if (!loaded || status === "playing" || recorded.current || current !== puzzle) return;
    recorded.current = true;
    const s = useCifra.getState();
    const result = { won: status === "won", attempts: status === "won" ? s.misses.length + 1 : MAX_ATTEMPTS, timeMs: s.elapsed, at: Date.now() };
    const p = useProgress.getState();
    if (mode.kind === "level") p.recordLevel(GAME_ID, levelKey(mode.world, mode.level), result);
    // Con el intento extra: si sale, reemplaza a la derrota (más intentos, `first`); si no, queda la derrota.
    else if (!mode.practice && (result.won || !s.extraAttempt)) p.recordDaily(GAME_ID, mode.date, result);
    clearSession(puzzle.id);
    const t = setTimeout(() => setResultOpen(true), status === "won" ? WIN_RESULT_MS : LOSS_RESULT_MS);
    return () => clearTimeout(t);
  }, [status, current, puzzle, mode, loaded]);

  const t = useT();
  const locale = useLocale();
  const context = mode.kind === "daily" ? t("cifra.contextDaily") : t("cifra.contextLevel", { n: puzzle.length });
  const ready = loaded && current === puzzle;

  return (
    <>
      <Stack.Screen
        options={{
          title: gameTitle("Cifra", mode.kind === "level" ? { ...mode, world: displayWorld(mode.world) } : mode, locale),
        }}
      />
      <Screen>
        <GameHeader context={context} right={ready ? <><Lives /><Timer /></> : null} />
        {mode.kind === "daily" && <DailyNotice practice={mode.practice} />}
        {ready && (
          <>
            <Animated.View entering={motion.appear()} style={{ gap: 8 }} accessibilityLabel={t("cifra.clues")}>
              {puzzle.clues.map((c, i) => (
                <ClueRow key={i} clue={c} marks={marks} row={i} size={size} highlight={hintRows.includes(i)} onCycleMark={cycleMark} disabled={status !== "playing"} />
              ))}
              {misses.map((c, i) => (
                <ClueRow key={`m${i}`} clue={c} marks={marks} row={puzzle.clues.length + i} size={size} miss reveal onCycleMark={cycleMark} disabled={status !== "playing"} />
              ))}
            </Animated.View>

            <Tools />
            <HintPanel />

            <View style={{ alignItems: "center" }}>
              <InputSlots />
            </View>
            {/* Al terminar, "Ver resultado" ocupa el lugar del teclado: nada se corre de lugar. */}
            <FinishSlot finished={status !== "playing"} done={<ResultLink onPress={() => setResultOpen(true)} />}>
              <Keypad />
            </FinishSlot>
          </>
        )}
      </Screen>
      <CifraResult
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
          useCifra.getState().continueWithExtra();
        }}
      />
    </>
  );
}

function Lives() {
  const { colors } = useTheme();
  const misses = useCifra((s) => s.misses.length);
  const total = useCifra(attemptLimit);
  const left = total - misses;
  const t = useT();
  return (
    <Row gap={3} accessibilityLabel={t("cifra.livesLeft", { count: left })}>
      {Array.from({ length: total }, (_, i) => (
        <Icon key={i} name={i < left ? "heart" : "heart-outline"} size={16} color={i < left ? colors.margin : colors.border} />
      ))}
    </Row>
  );
}

function Timer() {
  const elapsed = useCifra((s) => s.elapsed);
  const startedAt = useCifra((s) => s.startedAt);
  const [, tick] = useState(0);
  const t = useT();
  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return (
    <Text variant="bodyBold" style={{ fontVariant: ["tabular-nums"], minWidth: 40, textAlign: "right" }} accessibilityLabel={t("cifra.timeLabel", { time: formatTime(playedMs({ elapsed, startedAt })) })}>
      {formatTime(playedMs({ elapsed, startedAt }))}
    </Text>
  );
}

/** Pista y borrar marcas. */
function Tools() {
  const status = useCifra((s) => s.status);
  const hasMarks = useCifra((s) => Object.keys(s.marks).length > 0);
  const hint = useCifra((s) => s.hint);
  const plus = usePlus();
  const t = useT();
  const playing = status === "playing";
  const ask = () => {
    const s = useCifra.getState();
    if (!s.puzzle || !traceFor(s.puzzle).solved) return;
    s.askHint(nextHintStep(s.puzzle, s.misses, s.marks), plus ? null : FREE_HINTS);
  };
  return (
    // Al terminar quedan invisibles en su lugar: si desaparecieran, el código y el teclado subirían de golpe.
    <Row
      style={[{ justifyContent: "center" }, !playing && { opacity: 0 }]}
      gap={4}
      pointerEvents={playing ? "auto" : "none"}
      importantForAccessibility={playing ? "auto" : "no-hide-descendants"}
    >
      <Button title={t("cifra.hint")} icon="bulb-outline" variant="ghost" onPress={ask} accessibilityLabel={hint?.level === 1 ? t("cifra.hintShowDeduction") : t("cifra.hintAsk")} />
      <Button title={t("cifra.clearMarks")} icon="trash-outline" variant="ghost" disabled={!hasMarks} onPress={() => useCifra.getState().clearMarks()} />
    </Row>
  );
}

function HintPanel() {
  const { colors } = useTheme();
  const hint = useCifra((s) => s.hint);
  const puzzle = useCifra((s) => s.puzzle);
  const status = useCifra((s) => s.status);
  const showHint = useCifra((s) => s.showHint);
  const closeHint = useCifra((s) => s.closeHint);
  const outOfHints = useCifra((s) => s.outOfHints);
  const t = useT();
  const locale = useLocale();
  if (!puzzle) return null;
  // Al terminar, la pista abierta se queda (si desapareciera, todo lo de abajo saltaría); la oferta, no.
  if (outOfHints && status === "playing") {
    return (
      <HintOffer
        onClose={closeHint}
        onEarned={() => {
          const s = useCifra.getState();
          s.grantHint();
          s.askHint(nextHintStep(puzzle, s.misses, s.marks), FREE_HINTS);
        }}
      />
    );
  }
  if (!hint) return null;
  const step = hint.step >= 0 ? traceFor(puzzle).steps[hint.step] : null;
  return (
    <Animated.View entering={motion.appear()} style={[styles.hint, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityLiveRegion="polite">
      <Icon name="bulb" size={18} color={colors.cluePresent} />
      <View style={{ flex: 1, gap: 6 }}>
        {!step ? (
          <Text>{t("cifra.hintAllShown")}</Text>
        ) : hint.level === 1 ? (
          <>
            <Text>{hintNudge(step, t, locale)}</Text>
            <Pressable onPress={() => showHint(hint.step)} accessibilityRole="button" hitSlop={8}>
              <Text variant="bodyBold" style={{ textDecorationLine: "underline" }}>{t("cifra.hintWhat")}</Text>
            </Pressable>
          </>
        ) : (
          <Text>{cifraStepText(step, locale).text}</Text>
        )}
      </View>
      <Pressable onPress={closeHint} accessibilityRole="button" accessibilityLabel={t("cifra.hintClose")} hitSlop={10}>
        <Icon name="close" size={18} color={colors.mutedForeground} />
      </Pressable>
    </Animated.View>
  );
}

function CifraResult({ open, onClose, mode, onRetry, onExtra }: { open: boolean; onClose: () => void; mode: GameMode; onRetry: () => void; onExtra: () => void }) {
  const router = useRouter();
  const extraAttempt = useCifra((s) => s.extraAttempt);
  const official = mode.kind === "daily" && !mode.practice;
  const offer = useExtraAttemptOffer(GAME_ID, official ? mode.date : null);
  const [revealed, setRevealed] = useState(false);
  const puzzle = useCifra((s) => s.puzzle);
  const status = useCifra((s) => s.status);
  const misses = useCifra((s) => s.misses);
  const elapsed = useCifra((s) => s.elapsed);
  const hintsUsed = useCifra((s) => s.hintsUsed);
  const t = useT();
  const locale = useLocale();
  if (!puzzle || status === "playing") return null;

  const won = status === "won";
  const attempts = won ? misses.length + 1 : MAX_ATTEMPTS;
  const time = formatTime(elapsed);
  const title = mode.kind === "daily" ? gameTitle("Cifra", mode, locale) : t("common.level", { n: `${displayWorld(mode.world)}-${mode.level}` });
  // Diario perdido con el intento extra a mano: la solución queda tapada hasta que se elige.
  const offering = official && !won && !extraAttempt && offer.available && !revealed;
  const marks = Array.from({ length: misses.length + (won ? 1 : 0) }, (_, i) => (i < misses.length ? "🟥" : "🟩")).join("") + "⬜".repeat(Math.max(0, MAX_ATTEMPTS - misses.length - (won ? 1 : 0)));
  const score = won ? (extraAttempt ? t("cifra.extraScore") : `${attempts}/${MAX_ATTEMPTS}`) : "X";
  const shareMessage = t("cifra.share", { title, marks, score, time, url: `${SHARE_URL}/cifra` });
  // Solo las marcas de los intentos: el código no aparece.
  const card: ResultCard = {
    game: "Cifra",
    label: resultLabel(mode.kind === "level" ? { ...mode, world: displayWorld(mode.world) } : mode, locale),
    won,
    headline: won ? (extraAttempt ? t("cifra.cardExtra") : `${attempts}/${MAX_ATTEMPTS}`) : t("cifra.cardLost"),
    detail: won ? `${attempts === 1 ? t("cifra.firstTry") : t("common.attempts", { count: attempts })} · ${time}` : t("cifra.unsolvedTime", { time }),
    marks: attemptMarks(Math.max(MAX_ATTEMPTS, misses.length + (won ? 1 : 0)), misses.length, won),
  };

  return (
    <ResultSheet
      visible={open}
      onClose={onClose}
      title={won ? (extraAttempt ? t("cifra.wonExtraTitle") : attempts === 1 ? t("cifra.firstTry") : t("cifra.wonTitle")) : t("cifra.lostTitle")}
      description={
        won
          ? extraAttempt
            ? t("cifra.wonExtraDesc", { title, time })
            : t("cifra.wonDesc", { title, attempts, max: MAX_ATTEMPTS, time })
          : offering
            ? t("cifra.pendingDesc", { title })
            : t("cifra.lostDesc", { title })
      }
    >
      {offering && mode.kind === "daily" ? (
        <ExtraAttemptOffer gameId={GAME_ID} date={mode.date} onGranted={onExtra} onReveal={() => setRevealed(true)} />
      ) : (
        <Row gap={6} style={{ justifyContent: "center" }}>
          {puzzle.solution.map((d, i) => (
            <DigitTile key={i} digit={d} tone="solution" entering={motion.pop(DURATION.slow + i * staggerStep(puzzle.solution.length, DURATION.fast))} />
          ))}
        </Row>
      )}
      {hintsUsed > 0 && <Text variant="small" style={{ textAlign: "center" }}>{t("cifra.hintsUsed", { count: hintsUsed })}</Text>}
      <View style={{ gap: 8 }}>
        {mode.kind === "level" && mode.next ? (
          <Button
            title={t("cifra.nextLevel")}
            size="lg"
            onPress={() => {
              onClose();
              router.replace({ pathname: "/cifra/nivel/[mundo]/[nivel]", params: { mundo: String(mode.world), nivel: String(mode.next) } });
            }}
          />
        ) : (
          <Button title={t("cifra.backToWorlds")} size="lg" onPress={() => { onClose(); router.navigate("/cifra"); }} />
        )}
        {mode.kind === "level" && !won && <Button title={t("common.retry")} variant="outline" icon="refresh" onPress={onRetry} />}
        {mode.kind === "daily" && (
          <Button title={t("cifra.seeRanking")} variant="outline" icon="trophy-outline" onPress={() => { onClose(); router.push({ pathname: "/ranking", params: { juego: GAME_ID, fecha: mode.date } }); }} />
        )}
        <ResultShareButton text={shareMessage} card={card} />
      </View>
      <PlusNudge gameId={GAME_ID} mode={mode} won={won} onLeave={onClose} />
    </ResultSheet>
  );
}

/** Leyenda de los puntajes, para "Cómo se juega". */
export function PegLegend() {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Row style={{ justifyContent: "center", flexWrap: "wrap" }} gap={16}>
      <Row gap={6}>
        <Symbol kind="exact" color={colors.clueExact} />
        <Text style={{ color: colors.clueExact, fontFamily: fonts.body }}>{t("cifra.legendExact")}</Text>
      </Row>
      <Row gap={6}>
        <Symbol kind="present" color={colors.cluePresent} />
        <Text style={{ color: colors.cluePresent, fontFamily: fonts.body }}>{t("cifra.legendPresent")}</Text>
      </Row>
    </Row>
  );
}

const styles = StyleSheet.create({
  hint: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderWidth: 1, borderRadius: radius.xl, padding: 12 },
});
