import { keyboardStates, WORD_LENGTH, type KeyState, type LetterScore, type PalabraPuzzle } from "@cranea/core/palabra";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { FlipInXUp, ZoomIn, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { DailyNotice } from "@/components/daily-gate";
import { FinishSlot, ResultLink } from "@/components/finish-slot";
import { GameHeader, gameTitle } from "@/components/game-header";
import { ResultSheet } from "@/components/result-sheet";
import { ResultShareButton, resultLabel, type ResultCard } from "@/components/share-card";
import { ExtraAttemptOffer, useExtraAttemptOffer } from "@/components/rewards";
import { Button, Icon, Row, Screen, Text, shadow } from "@/components/ui";
import { SHARE_URL } from "@/config";
import { formatTime } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { useOnChange, useSettled } from "@/lib/hooks";
import { useProgress } from "@/stores/progress";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";
import { hop as hopTo, useShake, WIN_RESULT_MS } from "@/lib/motion";
import { GAME_ID, getDictionary, levelKey } from "../data";
import { attemptLimit, usePalabra } from "../store";

export type GameMode =
  | { kind: "level"; world: number; level: number; next: number | null }
  | { kind: "daily"; date: string; number: number; practice: boolean };

const FLIP_STEP = 120;
/** La fila ganadora se da vuelta más rápido y salta enseguida: el festejo entero entra en ~0,8 s. */
const WIN_FLIP_STEP = 60;
const WIN_FLIP_MS = 280;
/** Lo que tarda en darse vuelta una fila (y en saltar, si ganaste): el resultado espera a que termine. */
const REVEAL_MS = { won: WIN_RESULT_MS, lost: 900 } as const;
const SCORE_LABEL: Record<LetterScore, string> = { 2: "en su lugar", 1: "está en otro lugar", 0: "no está" };

export function PalabraGame({ puzzle, mode }: { puzzle: PalabraPuzzle; mode: GameMode }) {
  const { colors } = useTheme();
  const start = usePalabra((s) => s.start);
  const current = usePalabra((s) => s.puzzle);
  const status = usePalabra((s) => s.status);
  const [resultOpen, setResultOpen] = useState(false);
  const revealed = useSettled(status !== "playing", status === "won" ? REVEAL_MS.won : REVEAL_MS.lost);
  const recorded = useRef(false);
  const allowed = useMemo(() => getDictionary().allowed, []);

  useEffect(() => {
    start(puzzle);
    recorded.current = false;
  }, [puzzle, start]);

  // Guardar el resultado una sola vez, con las mismas claves que la web.
  useEffect(() => {
    if (status === "playing" || recorded.current || current !== puzzle) return;
    recorded.current = true;
    const s = usePalabra.getState();
    const result = { won: status === "won", attempts: status === "won" ? s.misses.length + 1 : puzzle.attempts, timeMs: (s.finishedAt ?? Date.now()) - s.startedAt, at: Date.now() };
    const p = useProgress.getState();
    if (mode.kind === "level") p.recordLevel(GAME_ID, levelKey(mode.world, mode.level), result);
    // Con el intento extra: si sale, reemplaza a la derrota (más intentos, `first`); si no, queda la derrota.
    else if (!mode.practice && (result.won || !s.extraAttempt)) p.recordDaily(GAME_ID, mode.date, result);
    setResultOpen(true);
  }, [status, current, puzzle, mode]);

  const context = mode.kind === "daily" ? "Misma palabra para todos" : `${WORD_LENGTH} letras · ${puzzle.attempts} intentos`;
  const ready = current === puzzle;

  return (
    <>
      <Stack.Screen options={{ title: gameTitle("Palabra", mode) }} />
      <Screen>
        <GameHeader context={context} right={ready ? <><Lives /><Timer /></> : null} />
        {mode.kind === "daily" && <DailyNotice practice={mode.practice} />}
        {ready && (
          <>
            <Board />
            {puzzle.hard && <Text variant="small" style={{ textAlign: "center" }}>Modo difícil: usá todo lo que ya descubriste.</Text>}
            {/* Al terminar, "Ver resultado" ocupa el lugar del teclado: nada se corre de lugar. */}
            <FinishSlot finished={status !== "playing"} done={revealed ? <ResultLink onPress={() => setResultOpen(true)} /> : null}>
              <Keyboard onSubmit={() => usePalabra.getState().submit(allowed)} />
            </FinishSlot>
          </>
        )}
      </Screen>
      <PalabraResult
        open={resultOpen && revealed}
        onClose={() => setResultOpen(false)}
        mode={mode}
        onRetry={() => {
          setResultOpen(false);
          recorded.current = false;
          start(puzzle);
        }}
        onExtra={() => {
          setResultOpen(false);
          recorded.current = false;
          usePalabra.getState().continueWithExtra();
        }}
      />
    </>
  );
}

function useTile() {
  const { width } = useWindowDimensions();
  return Math.min(56, Math.floor((Math.min(width, 560) - 36 - 4 * 6) / WORD_LENGTH));
}

/** Una fila por intento, como Wordle: lo probado, la palabra que estás escribiendo y lo que queda. */
function Board() {
  const puzzle = usePalabra((s) => s.puzzle);
  const misses = usePalabra((s) => s.misses);
  const input = usePalabra((s) => s.input);
  const status = usePalabra((s) => s.status);
  const shakeKey = usePalabra((s) => s.shakeKey);
  const message = usePalabra((s) => s.message);
  const total = usePalabra(attemptLimit);
  const tile = useTile();
  const shake = useShake(shakeKey);
  useOnChange(shakeKey, (key) => key > 0 && haptic("invalid"));
  useOnChange(status, (s) => s === "won" && setTimeout(() => haptic("win"), WIN_FLIP_STEP * WORD_LENGTH));
  if (!puzzle) return null;
  const won = status === "won";
  const rows = won ? [...misses, { word: puzzle.answer, scores: Array(WORD_LENGTH).fill(2) as LetterScore[] }] : misses;

  return (
    <View style={{ gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }, (_, i) => {
        const row = rows[i];
        if (row) {
          return (
            <View key={i} style={styles.row} accessible accessibilityLabel={`Intento ${i + 1}: ${row.word.toUpperCase()}. ${[...row.word].map((l, j) => `${l.toUpperCase()} ${SCORE_LABEL[row.scores[j]]}`).join(", ")}.`}>
              {[...row.word].map((letter, j) => (
                <LetterTile
                  key={j}
                  letter={letter}
                  tone={toneFor(row.scores[j])}
                  size={tile}
                  flipDelay={j * (won && i === misses.length ? WIN_FLIP_STEP : FLIP_STEP)}
                  flipMs={won && i === misses.length ? WIN_FLIP_MS : undefined}
                  hop={won && i === misses.length ? j : undefined}
                />
              ))}
            </View>
          );
        }
        if (i === rows.length && status === "playing") {
          return (
            <Animated.View key="input" style={[styles.row, shake]} accessibilityLabel={`Tu palabra: ${input.join("").toUpperCase() || "vacía"}`}>
              {Array.from({ length: WORD_LENGTH }, (_, j) =>
                input[j] === undefined ? <LetterTile key={j} tone="empty" size={tile} /> : <LetterTile key={`${j}-${input[j]}`} letter={input[j]} tone="input" size={tile} />,
              )}
            </Animated.View>
          );
        }
        return (
          <View key={i} style={[styles.row, { opacity: 0.5 }]} importantForAccessibility="no-hide-descendants">
            {Array.from({ length: WORD_LENGTH }, (_, j) => <LetterTile key={j} tone="empty" size={tile} />)}
          </View>
        );
      })}
      <Text variant="small" style={{ minHeight: 20, textAlign: "center" }} accessibilityLiveRegion="polite">{message ?? ""}</Text>
    </View>
  );
}

type Tone = "exact" | "present" | "absent" | "input" | "empty" | "solution";
const toneFor = (score: LetterScore): Tone => (score === 2 ? "exact" : score === 1 ? "present" : "absent");

export function LetterTile({ letter, tone = "absent", size = 48, flipDelay, flipMs = 320, hop }: { letter?: string; tone?: Tone; size?: number; flipDelay?: number; flipMs?: number; hop?: number }) {
  const { colors } = useTheme();
  const lift = useSharedValue(0);
  useEffect(() => {
    if (hop !== undefined) lift.value = hopTo(WIN_FLIP_STEP * (WORD_LENGTH - 1) + WIN_FLIP_MS - 60 + hop * 40, -12);
  }, [hop, lift]);
  const hopStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));

  const look =
    tone === "exact"
      ? { borderColor: colors.clueExact, backgroundColor: colors.clueExact, color: colors.paper, ...shadow(colors.shadowInk, 2) }
      : tone === "present"
        ? { borderColor: colors.cluePresent, backgroundColor: colors.cluePresentBg, color: colors.cluePresent, ...shadow(colors.shadowInk, 2) }
        : tone === "absent"
          ? { borderColor: colors.border, backgroundColor: colors.tile, color: colors.pencil }
          : tone === "input"
            ? { borderColor: colors.ink, backgroundColor: colors.tile, color: colors.ink, ...shadow(colors.shadowInk, 2) }
            : tone === "solution"
              ? { borderColor: colors.ok, backgroundColor: colors.tile, color: colors.ok, ...shadow(colors.ok, 2) }
              : { borderColor: colors.pencil, backgroundColor: "transparent", color: colors.ink, borderStyle: "dashed" as const };
  const { color, ...box } = look;
  const entering = flipDelay !== undefined ? FlipInXUp.delay(flipDelay).duration(flipMs) : tone === "input" ? ZoomIn.duration(120) : undefined;
  const score = tone === "exact" ? 2 : tone === "present" ? 1 : 0;

  return (
    <Animated.View style={hopStyle}>
      <Animated.View entering={entering} style={[styles.tile, { width: size, height: size }, box, tone === "empty" && { opacity: 0.6 }]}>
        <Text style={{ fontFamily: fonts.display, fontSize: Math.round(size * 0.52), color }}>{letter?.toUpperCase() ?? ""}</Text>
        {/* El color nunca es la única señal: punto lleno = en su lugar, aro = en otro lugar. */}
        {score > 0 && <View style={[styles.mark, score === 2 ? { backgroundColor: color } : { borderWidth: 1.5, borderColor: color }]} />}
      </Animated.View>
    </Animated.View>
  );
}

function Lives() {
  const { colors } = useTheme();
  const attempts = usePalabra(attemptLimit);
  const used = usePalabra((s) => s.misses.length);
  const left = attempts - used;
  return (
    <Row gap={2} accessibilityLabel={`Te ${left === 1 ? "queda" : "quedan"} ${left} ${left === 1 ? "intento" : "intentos"}`}>
      {Array.from({ length: attempts }, (_, i) => (
        <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i < left ? colors.margin : colors.border }} />
      ))}
    </Row>
  );
}

function Timer() {
  const startedAt = usePalabra((s) => s.startedAt);
  const finishedAt = usePalabra((s) => s.finishedAt);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (finishedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [finishedAt]);
  const ms = (finishedAt ?? now) - startedAt;
  return <Text variant="bodyBold" style={{ fontVariant: ["tabular-nums"], minWidth: 40, textAlign: "right" }}>{formatTime(Math.max(0, ms))}</Text>;
}

const ROWS = ["qwertyuiop", "asdfghjklñ", "zxcvbnm"];

/** Teclado en pantalla (QWERTY español, con Ñ). Cada tecla toma su color cuando la fila termina de darse vuelta. */
function Keyboard({ onSubmit }: { onSubmit: () => void }) {
  const { colors } = useTheme();
  const misses = usePalabra((s) => s.misses);
  const input = usePalabra((s) => s.input);
  const status = usePalabra((s) => s.status);
  const press = usePalabra((s) => s.press);
  const backspace = usePalabra((s) => s.backspace);
  const [shown, setShown] = useState(misses);
  useEffect(() => {
    const t = setTimeout(() => setShown(misses), misses.length ? FLIP_STEP * WORD_LENGTH + 200 : 0);
    return () => clearTimeout(t);
  }, [misses]);
  const states = useMemo(() => keyboardStates(shown), [shown]);
  const playing = status === "playing";
  const full = input.length === WORD_LENGTH;

  const keyLook = (state: KeyState | undefined) =>
    state === 2
      ? { backgroundColor: colors.clueExact, borderColor: colors.clueExact, color: colors.paper }
      : state === 1
        ? { backgroundColor: colors.cluePresentBg, borderColor: colors.cluePresent, color: colors.cluePresent }
        : state === 0
          ? { backgroundColor: colors.muted, borderColor: colors.border, color: colors.pencil }
          : { backgroundColor: colors.tile, borderColor: colors.ink, color: colors.ink };

  return (
    <View style={{ gap: 6 }} accessibilityLabel="Teclado">
      {ROWS.map((row, r) => (
        <View key={row} style={{ flexDirection: "row", gap: 4 }}>
          {r === 2 && (
            <Key flex={1.7} label="Probar" a11y="Probar palabra" disabled={!playing || !full} onPress={onSubmit} look={{ backgroundColor: colors.primary, borderColor: colors.primary, color: colors.primaryForeground }} small />
          )}
          {[...row].map((letter) => {
            const state = states[letter];
            return (
              <Key
                key={letter}
                label={letter.toUpperCase()}
                a11y={`${letter.toUpperCase()}${state !== undefined && state !== "unknown" ? `, ${SCORE_LABEL[state]}` : ""}`}
                disabled={!playing || full}
                onPress={() => press(letter)}
                look={keyLook(state)}
                flat={state === 0}
              />
            );
          })}
          {r === 2 && <Key flex={1.7} icon a11y="Borrar letra" disabled={!playing || input.length === 0} onPress={backspace} look={keyLook(undefined)} />}
        </View>
      ))}
    </View>
  );
}

function Key({ label, a11y, onPress, disabled, look, flex = 1, small, icon, flat }: { label?: string; a11y: string; onPress: () => void; disabled: boolean; look: { backgroundColor: string; borderColor: string; color: string }; flex?: number; small?: boolean; icon?: boolean; flat?: boolean }) {
  const { colors } = useTheme();
  const { color, ...box } = look;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        haptic("tap");
        onPress();
      }}
      style={({ pressed }) => [
        styles.key,
        { flex },
        box,
        !flat && shadow(colors.shadowInk, pressed ? 0 : 2),
        pressed && { transform: [{ translateY: 1 }, { scale: 0.95 }] },
        disabled && { opacity: 0.4 },
      ]}
    >
      {icon ? <Icon name="backspace-outline" size={20} color={color} /> : <Text style={{ fontFamily: fonts.display, fontSize: small ? 14 : 18, color }}>{label}</Text>}
    </Pressable>
  );
}

function PalabraResult({ open, onClose, mode, onRetry, onExtra }: { open: boolean; onClose: () => void; mode: GameMode; onRetry: () => void; onExtra: () => void }) {
  const router = useRouter();
  const extraAttempt = usePalabra((s) => s.extraAttempt);
  const official = mode.kind === "daily" && !mode.practice;
  const offer = useExtraAttemptOffer(GAME_ID, official ? mode.date : null);
  const [revealed, setRevealed] = useState(false);
  const puzzle = usePalabra((s) => s.puzzle);
  const status = usePalabra((s) => s.status);
  const misses = usePalabra((s) => s.misses);
  const startedAt = usePalabra((s) => s.startedAt);
  const finishedAt = usePalabra((s) => s.finishedAt);
  if (!puzzle || status === "playing") return null;
  const won = status === "won";
  const attempts = won ? misses.length + 1 : puzzle.attempts;
  const time = formatTime((finishedAt ?? Date.now()) - startedAt);
  const title = mode.kind === "daily" ? `Palabra del día #${mode.number}` : `Nivel ${mode.world}-${mode.level}`;
  // Diario perdido con el intento extra a mano: la palabra queda tapada hasta que se elige.
  const offering = official && !won && !extraAttempt && offer.available && !revealed;
  // Como Wordle: los colores de cada intento, sin las letras.
  const rows: LetterScore[][] = [...misses.map((m) => m.scores), ...(won ? [Array(WORD_LENGTH).fill(2) as LetterScore[]] : [])];
  const grid = rows.map((row) => row.map((s) => (s === 2 ? "🟩" : s === 1 ? "🟨" : "⬜")).join("")).join("\n");
  const score = won ? (extraAttempt ? "con un intento extra" : `${attempts}/${puzzle.attempts}`) : `X/${puzzle.attempts}`;
  const shareMessage = `Craneá · ${title}\n${score} en ${time}\n${grid}\n${SHARE_URL}/palabra`;
  const card: ResultCard = {
    game: "Palabra",
    label: resultLabel(mode),
    won,
    headline: won ? (extraAttempt ? "Con intento extra" : `${attempts}/${puzzle.attempts}`) : "No salió",
    detail: won ? `${attempts} ${attempts === 1 ? "intento" : "intentos"} · ${time}` : `X/${puzzle.attempts} · ${time}`,
    visual: { kind: "colors", rows },
  };
  return (
    <ResultSheet
      visible={open}
      onClose={onClose}
      title={won ? (extraAttempt ? "¡Salió con el intento extra!" : attempts === 1 ? "¡A la primera!" : "¡Encontraste la palabra!") : "Se acabaron los intentos"}
      description={
        won
          ? extraAttempt
            ? `${title}, en ${time}. Suma a tu racha; en el ranking queda como no resuelto.`
            : `${title}, en ${attempts} de ${puzzle.attempts} intentos y ${time}.`
          : offering
            ? `${title}, sin resolver por ahora.`
            : `${title}, sin resolver. La palabra era «${puzzle.display}».`
      }
    >
      {offering && mode.kind === "daily" ? (
        <ExtraAttemptOffer gameId={GAME_ID} date={mode.date} onGranted={onExtra} onReveal={() => setRevealed(true)} />
      ) : (
        <Row gap={6} style={{ justifyContent: "center" }}>
          {[...puzzle.answer].map((l, i) => (
            <LetterTile key={i} letter={l} tone="solution" />
          ))}
        </Row>
      )}
      <View style={{ gap: 8 }}>
        {mode.kind === "level" && mode.next ? (
          <Button
            title="Siguiente nivel"
            size="lg"
            onPress={() => {
              onClose();
              router.replace({ pathname: "/palabra/nivel/[mundo]/[nivel]", params: { mundo: String(mode.world), nivel: String(mode.next) } });
            }}
          />
        ) : (
          <Button title="Volver a los mundos" size="lg" onPress={() => { onClose(); router.navigate("/palabra"); }} />
        )}
        {mode.kind === "level" && !won && <Button title="Reintentar" variant="outline" icon="refresh" onPress={onRetry} />}
        {mode.kind === "daily" && (
          <Button title="Ver ranking" variant="outline" icon="trophy-outline" onPress={() => { onClose(); router.push({ pathname: "/ranking", params: { juego: GAME_ID, fecha: mode.date } }); }} />
        )}
        <ResultShareButton text={shareMessage} card={card} />
      </View>
    </ResultSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6 },
  tile: { borderRadius: radius.md, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  mark: { position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: 4 },
  key: { height: 52, minWidth: 0, borderRadius: radius.sm, borderWidth: 2, alignItems: "center", justifyContent: "center" },
});
