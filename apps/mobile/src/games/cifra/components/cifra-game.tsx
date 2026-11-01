import type { CifraPuzzle } from "@cranea/core/cifra";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { DailyNotice } from "@/components/daily-gate";
import { FinishSlot, ResultLink } from "@/components/finish-slot";
import { GameHeader, gameTitle } from "@/components/game-header";
import { ResultSheet } from "@/components/result-sheet";
import { attemptMarks, ResultShareButton, resultLabel, type ResultCard } from "@/components/share-card";
import { PlusNudge } from "@/components/plus-nudge";
import { ExtraAttemptOffer, HintOffer, useExtraAttemptOffer } from "@/components/rewards";
import { Button, Icon, Row, Screen, Text } from "@/components/ui";
import { SHARE_URL } from "@/config";
import { FREE_HINTS, usePlus } from "@/entitlements";
import { formatTime } from "@/lib/format";
import { LOSS_RESULT_MS, WIN_RESULT_MS } from "@/lib/motion";
import { useProgress } from "@/stores/progress";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";
import { GAME_ID, MAX_ATTEMPTS, levelKey } from "../data";
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

  const context = mode.kind === "daily" ? "Mismo tablero para todos" : `Código de ${puzzle.length} cifras`;
  const ready = loaded && current === puzzle;

  return (
    <>
      <Stack.Screen options={{ title: gameTitle("Cifra", mode) }} />
      <Screen>
        <GameHeader context={context} right={ready ? <><Lives /><Timer /></> : null} />
        {mode.kind === "daily" && <DailyNotice practice={mode.practice} />}
        {ready && (
          <>
            <Animated.View entering={FadeInDown.duration(260)} style={{ gap: 8 }} accessibilityLabel="Pistas">
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
  return (
    <Row gap={3} accessibilityLabel={`Te ${left === 1 ? "queda" : "quedan"} ${left} ${left === 1 ? "intento" : "intentos"}`}>
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
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  return (
    <Text variant="bodyBold" style={{ fontVariant: ["tabular-nums"], minWidth: 40, textAlign: "right" }} accessibilityLabel={`Tiempo ${formatTime(playedMs({ elapsed, startedAt }))}`}>
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
      <Button title="Pista" icon="bulb-outline" variant="ghost" onPress={ask} accessibilityLabel={hint?.level === 1 ? "Ver la deducción" : "Pedir una pista"} />
      <Button title="Borrar marcas" icon="trash-outline" variant="ghost" disabled={!hasMarks} onPress={() => useCifra.getState().clearMarks()} />
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
    <Animated.View entering={FadeInUp.duration(200)} style={[styles.hint, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityLiveRegion="polite">
      <Icon name="bulb" size={18} color={colors.cluePresent} />
      <View style={{ flex: 1, gap: 6 }}>
        {!step ? (
          <Text>Tus marcas ya muestran todo lo que se puede deducir. Escribí el código.</Text>
        ) : hint.level === 1 ? (
          <>
            <Text>{hintNudge(step)}</Text>
            <Pressable onPress={() => showHint(hint.step)} accessibilityRole="button" hitSlop={8}>
              <Text variant="bodyBold" style={{ textDecorationLine: "underline" }}>¿Qué se deduce?</Text>
            </Pressable>
          </>
        ) : (
          <Text>{step.text}</Text>
        )}
      </View>
      <Pressable onPress={closeHint} accessibilityRole="button" accessibilityLabel="Cerrar pista" hitSlop={10}>
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
  if (!puzzle || status === "playing") return null;

  const won = status === "won";
  const attempts = won ? misses.length + 1 : MAX_ATTEMPTS;
  const time = formatTime(elapsed);
  const title = mode.kind === "daily" ? `Cifra del día #${mode.number}` : `Nivel ${mode.world}-${mode.level}`;
  // Diario perdido con el intento extra a mano: la solución queda tapada hasta que se elige.
  const offering = official && !won && !extraAttempt && offer.available && !revealed;
  const marks = Array.from({ length: misses.length + (won ? 1 : 0) }, (_, i) => (i < misses.length ? "🟥" : "🟩")).join("") + "⬜".repeat(Math.max(0, MAX_ATTEMPTS - misses.length - (won ? 1 : 0)));
  const score = won ? (extraAttempt ? "con un intento extra" : `${attempts}/${MAX_ATTEMPTS}`) : "X";
  const shareMessage = `Craneá · ${title}\n${marks} ${score} en ${time}\n${SHARE_URL}/cifra`;
  // Solo las marcas de los intentos: el código no aparece.
  const card: ResultCard = {
    game: "Cifra",
    label: resultLabel(mode),
    won,
    headline: won ? (extraAttempt ? "Con intento extra" : `${attempts}/${MAX_ATTEMPTS}`) : "No salió",
    detail: won ? `${attempts === 1 ? "Al primer intento" : `${attempts} intentos`} · ${time}` : `Sin resolver · ${time}`,
    marks: attemptMarks(Math.max(MAX_ATTEMPTS, misses.length + (won ? 1 : 0)), misses.length, won),
  };

  return (
    <ResultSheet
      visible={open}
      onClose={onClose}
      title={won ? (extraAttempt ? "¡Salió con el intento extra!" : attempts === 1 ? "Al primer intento" : "Código descifrado") : "Se acabaron los intentos"}
      description={
        won
          ? extraAttempt
            ? `${title}, en ${time}. Suma a tu racha; en el ranking queda como no resuelto.`
            : `${title}, en ${attempts} de ${MAX_ATTEMPTS} intentos y ${time}.`
          : offering
            ? `${title}, sin resolver por ahora.`
            : `${title}, sin resolver. Este era el código:`
      }
    >
      {offering && mode.kind === "daily" ? (
        <ExtraAttemptOffer gameId={GAME_ID} date={mode.date} onGranted={onExtra} onReveal={() => setRevealed(true)} />
      ) : (
        <Row gap={6} style={{ justifyContent: "center" }}>
          {puzzle.solution.map((d, i) => (
            <DigitTile key={i} digit={d} tone="solution" enterDelay={140 + i * 70} />
          ))}
        </Row>
      )}
      {hintsUsed > 0 && <Text variant="small" style={{ textAlign: "center" }}>{hintsUsed === 1 ? "Usaste 1 pista" : `Usaste ${hintsUsed} pistas`}</Text>}
      <View style={{ gap: 8 }}>
        {mode.kind === "level" && mode.next ? (
          <Button
            title="Siguiente nivel"
            size="lg"
            onPress={() => {
              onClose();
              router.replace({ pathname: "/cifra/nivel/[mundo]/[nivel]", params: { mundo: String(mode.world), nivel: String(mode.next) } });
            }}
          />
        ) : (
          <Button title="Volver a los mundos" size="lg" onPress={() => { onClose(); router.navigate("/cifra"); }} />
        )}
        {mode.kind === "level" && !won && <Button title="Reintentar" variant="outline" icon="refresh" onPress={onRetry} />}
        {mode.kind === "daily" && (
          <Button title="Ver ranking" variant="outline" icon="trophy-outline" onPress={() => { onClose(); router.push({ pathname: "/ranking", params: { juego: GAME_ID, fecha: mode.date } }); }} />
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
  return (
    <Row style={{ justifyContent: "center", flexWrap: "wrap" }} gap={16}>
      <Row gap={6}>
        <Symbol kind="exact" color={colors.clueExact} />
        <Text style={{ color: colors.clueExact, fontFamily: fonts.body }}>en su lugar</Text>
      </Row>
      <Row gap={6}>
        <Symbol kind="present" color={colors.cluePresent} />
        <Text style={{ color: colors.cluePresent, fontFamily: fonts.body }}>está, en otro lugar</Text>
      </Row>
    </Row>
  );
}

const styles = StyleSheet.create({
  hint: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderWidth: 1, borderRadius: radius.xl, padding: 12 },
});
