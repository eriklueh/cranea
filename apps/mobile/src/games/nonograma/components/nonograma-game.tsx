import type { NonogramaPuzzle } from "@cranea/core/nonograma";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { DailyNotice } from "@/components/daily-gate";
import { FinishSlot, ResultLink } from "@/components/finish-slot";
import { GameHeader, gameTitle } from "@/components/game-header";
import { ResultSheet } from "@/components/result-sheet";
import { attemptMarks, ResultShareButton, resultLabel, type ResultCard } from "@/components/share-card";
import { PlusNudge } from "@/components/plus-nudge";
import { ExtraAttemptOffer, useExtraAttemptOffer } from "@/components/rewards";
import { Button, Icon, Row, Screen, Text, shadow } from "@/components/ui";
import { SHARE_URL } from "@/config";
import { formatTime } from "@/lib/format";
import { WIN_RESULT_MS } from "@/lib/motion";
import { haptic } from "@/lib/haptics";
import { useSettled } from "@/lib/hooks";
import { useProgress } from "@/stores/progress";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";
import { GAME_ID, levelKey, MAX_ATTEMPTS } from "../data";
import { attemptsOf, checkLimit, useNonograma } from "../store";
import { Board, GAME_PAD, useBoardLayout, type BoardHandle } from "./board";
import { PixelArt, solutionRows } from "./pixel-art";

export type GameMode =
  | { kind: "level"; world: number; level: number; next: { world: number; level: number } | null }
  | { kind: "daily"; date: string; number: number; practice: boolean };

/** Lo que tarda el dibujo en aparecer (o latir) en diagonal antes de la hoja de resultado. */
const RESULT_DELAY = { won: WIN_RESULT_MS, lost: 650 } as const;

export function NonogramaGame({ puzzle, mode }: { puzzle: NonogramaPuzzle; mode: GameMode }) {
  const { colors } = useTheme();
  const start = useNonograma((s) => s.start);
  const current = useNonograma((s) => s.puzzle);
  const status = useNonograma((s) => s.status);
  const [resultOpen, setResultOpen] = useState(false);
  const settled = useSettled(status !== "playing", status === "won" ? RESULT_DELAY.won : RESULT_DELAY.lost);
  const recorded = useRef(false);
  const board = useRef<BoardHandle>(null);
  const [zoomed, setZoomed] = useState(false);
  const layout = useBoardLayout(puzzle);
  const official = mode.kind === "daily" && !mode.practice;
  const offer = useExtraAttemptOffer(GAME_ID, official ? mode.date : null);

  useEffect(() => {
    start(puzzle);
    recorded.current = false;
  }, [puzzle, start]);

  // Guardar el resultado una sola vez, con las mismas claves que la web.
  useEffect(() => {
    if (status === "playing" || recorded.current || current !== puzzle) return;
    recorded.current = true;
    const s = useNonograma.getState();
    const result = { won: status === "won", attempts: attemptsOf(s), timeMs: (s.finishedAt ?? Date.now()) - s.startedAt, at: Date.now() };
    const p = useProgress.getState();
    if (mode.kind === "level") p.recordLevel(GAME_ID, levelKey(mode.world, mode.level), result);
    // Con el intento extra: si sale, reemplaza a la derrota (más intentos, `first`); si no, queda la derrota.
    else if (!mode.practice && (result.won || !s.extraAttempt)) p.recordDaily(GAME_ID, mode.date, result);
  }, [status, current, puzzle, mode]);

  useEffect(() => {
    if (settled) setResultOpen(true);
  }, [settled]);

  const context = mode.kind === "daily" ? "Mismo tablero para todos" : `${puzzle.width}×${puzzle.height}`;
  const ready = current === puzzle;

  return (
    <>
      <Stack.Screen options={{ title: gameTitle("Nonograma", mode) }} />
      <Screen contentStyle={{ paddingHorizontal: GAME_PAD, gap: 10 }}>
        <View style={{ paddingHorizontal: 8 }}>
          <GameHeader context={context} right={ready ? <><ChecksLeft /><Timer /></> : null} />
        </View>
        {mode.kind === "daily" && <View style={{ paddingHorizontal: 8 }}><DailyNotice practice={mode.practice} /></View>}
        {ready && (
          <>
            <Board ref={board} puzzle={puzzle} layout={layout} onZoomChange={setZoomed} />
            <Message daily={mode.kind === "daily"} zoomHint={layout.zoomable && !zoomed} />
            {/* Al terminar, "Ver resultado" ocupa el lugar de los controles: la pantalla no cambia de alto. */}
            <FinishSlot finished={status !== "playing"} done={settled ? <ResultLink onPress={() => setResultOpen(true)} /> : null}>
              <Controls
                zoomable={layout.zoomable}
                zoomed={zoomed}
                onZoom={() => setZoomed(board.current?.toggleZoom() ?? false)}
                canOfferExtra={official && offer.available}
              />
            </FinishSlot>
          </>
        )}
      </Screen>
      <NonogramaResult
        open={resultOpen && settled}
        onClose={() => setResultOpen(false)}
        mode={mode}
        offerAvailable={offer.available}
        onRetry={() => {
          setResultOpen(false);
          recorded.current = false;
          start(puzzle);
        }}
        onExtra={() => {
          setResultOpen(false);
          recorded.current = false;
          useNonograma.getState().continueWithExtra();
        }}
      />
    </>
  );
}

/** Debajo del tablero: el resultado de la revisión, el dibujo al terminar o cómo acercar. */
function Message({ daily, zoomHint }: { daily: boolean; zoomHint: boolean }) {
  const { colors } = useTheme();
  const status = useNonograma((s) => s.status);
  const title = useNonograma((s) => s.puzzle?.title);
  const lastCheck = useNonograma((s) => s.lastCheck);
  const conceal = useNonograma((s) => s.conceal);
  const extra = useNonograma((s) => s.extraAttempt);
  let text = "";
  let tone: "ok" | "bad" | "muted" = "muted";
  if (status === "won") {
    text = daily ? "Dibujo completo." : `Dibujo completo: ${title}.`;
    tone = "ok";
  } else if (status === "lost") text = conceal ? "Te rendiste." : daily ? "Esta era la solución." : `Era: ${title}.`;
  else if (lastCheck !== null) {
    text = lastCheck === 0 ? "Todo bien hasta acá." : `${lastCheck} ${lastCheck === 1 ? "casilla no va" : "casillas no van"} así. Están marcadas en rojo.`;
    tone = lastCheck === 0 ? "ok" : "bad";
  } else if (extra) text = "Tenés un intento más: el tablero quedó como lo dejaste.";
  else if (zoomHint) text = "Pellizcá con dos dedos para acercar; con un dedo pintás.";
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={{
        // Alto del texto grande: al ganar crece sin empujar lo de abajo.
        minHeight: 28,
        textAlign: "center",
        fontFamily: status === "won" ? fonts.displayHeavy : fonts.bodyBold,
        fontSize: status === "won" ? 20 : 14,
        color: tone === "ok" ? colors.ok : tone === "bad" ? colors.margin : colors.mutedForeground,
      }}
    >
      {text}
    </Text>
  );
}

function Controls({ zoomable, zoomed, onZoom, canOfferExtra }: { zoomable: boolean; zoomed: boolean; onZoom: () => void; canOfferExtra: boolean }) {
  const { colors } = useTheme();
  const tool = useNonograma((s) => s.tool);
  const setTool = useNonograma((s) => s.setTool);
  const canUndo = useNonograma((s) => s.history.length > 0);
  const canReset = useNonograma((s) => s.board.some((c) => c !== 0));
  const checksLeft = useNonograma((s) => checkLimit(s) - s.checks);
  const { undo, reset, check } = useNonograma.getState();

  const giveUp = () =>
    Alert.alert("¿Te rendís?", "Se muestra la solución y el tablero queda sin resolver.", [
      { text: "Seguir jugando", style: "cancel" },
      { text: "Ver la solución", style: "destructive", onPress: () => useNonograma.getState().giveUp(canOfferExtra && !useNonograma.getState().extraAttempt) },
    ]);

  return (
    <View style={{ gap: 10, paddingHorizontal: 8 }}>
      <Row gap={8}>
        <View accessibilityRole="radiogroup" accessibilityLabel="Herramienta" style={[styles.segment, { borderColor: colors.ink, backgroundColor: colors.card, ...shadow(colors.shadowInk, 2) }]}>
          {(["fill", "cross"] as const).map((t) => {
            const selected = tool === t;
            return (
              <Pressable
                key={t}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={t === "fill" ? "Pintar" : "Cruz"}
                onPress={() => {
                  if (selected) return;
                  haptic("tap");
                  setTool(t);
                }}
                style={[styles.segmentItem, selected && { backgroundColor: colors.ink }]}
              >
                {t === "fill" ? (
                  <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: selected ? colors.paper : colors.ink }} />
                ) : (
                  <Icon name="close" size={18} color={selected ? colors.paper : colors.ink} />
                )}
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: selected ? colors.paper : colors.ink }}>{t === "fill" ? "Pintar" : "Cruz"}</Text>
              </Pressable>
            );
          })}
        </View>
        <IconButton icon="arrow-undo" label="Deshacer" disabled={!canUndo} onPress={undo} />
        {zoomable && <IconButton icon={zoomed ? "contract-outline" : "search"} label={zoomed ? "Ver el tablero entero" : "Acercar"} onPress={onZoom} />}
      </Row>
      <Row gap={8}>
        <Button title="Borrar todo" icon="trash-outline" variant="outline" disabled={!canReset} onPress={reset} style={{ flex: 1, paddingHorizontal: 8 }} />
        <Button title={`Revisar (${Math.max(0, checksLeft)})`} icon="search-circle-outline" variant="outline" disabled={checksLeft <= 0 || !canReset} onPress={check} style={{ flex: 1, paddingHorizontal: 8 }} accessibilityLabel={`Revisar, ${Math.max(0, checksLeft)} disponibles`} />
      </Row>
      <Text variant="small" style={{ textAlign: "center" }}>
        Revisar marca lo que está mal y suma un intento.{" "}
        <Text variant="small" accessibilityRole="button" onPress={giveUp} style={{ fontFamily: fonts.bodyBold, color: colors.ink, textDecorationLine: "underline", textDecorationColor: colors.margin }}>
          Me rindo
        </Text>
      </Text>
    </View>
  );
}

function IconButton({ icon, label, onPress, disabled }: { icon: "arrow-undo" | "search" | "contract-outline"; label: string; onPress: () => void; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => {
        haptic("tap");
        onPress();
      }}
      style={({ pressed }) => [
        styles.iconButton,
        { borderColor: colors.ink, backgroundColor: colors.card, ...shadow(colors.shadowInk, pressed ? 0 : 2) },
        pressed && { transform: [{ translateY: 2 }] },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Icon name={icon} size={20} />
    </Pressable>
  );
}

/** Intentos que quedan: una rayita por intento (1 + revisiones). */
function ChecksLeft() {
  const { colors } = useTheme();
  const status = useNonograma((s) => s.status);
  const checks = useNonograma((s) => s.checks);
  const extra = useNonograma((s) => s.extraAttempt);
  const total = MAX_ATTEMPTS + (extra ? 1 : 0);
  const left = status === "lost" ? 0 : total - checks;
  const attempt = Math.min(total, checks + 1);
  return (
    <Row gap={3} accessibilityRole="image" accessibilityLabel={`Intento ${attempt} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ width: 6, height: i < left ? 16 : 10, borderRadius: 3, backgroundColor: i < left ? colors.ink : colors.margin, opacity: i < left ? 1 : 0.4 }} />
      ))}
    </Row>
  );
}

function Timer() {
  const startedAt = useNonograma((s) => s.startedAt);
  const finishedAt = useNonograma((s) => s.finishedAt);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (finishedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [finishedAt, startedAt]);
  return <Text variant="bodyBold" style={{ fontVariant: ["tabular-nums"], minWidth: 40, textAlign: "right" }}>{formatTime(Math.max(0, (finishedAt ?? now) - startedAt))}</Text>;
}

/** El dibujo resuelto, en un marco de tinta. */
export function Picture({ puzzle, size = 84 }: { puzzle: NonogramaPuzzle; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.picture, { borderColor: colors.ink, backgroundColor: colors.tile, ...shadow(colors.shadowInk, 3) }]}>
      <PixelArt rows={solutionRows(puzzle.solution, puzzle.width)} size={size} label={puzzle.title} />
    </View>
  );
}

function NonogramaResult({ open, onClose, mode, offerAvailable, onRetry, onExtra }: { open: boolean; onClose: () => void; mode: GameMode; offerAvailable: boolean; onRetry: () => void; onExtra: () => void }) {
  const router = useRouter();
  const puzzle = useNonograma((s) => s.puzzle);
  const status = useNonograma((s) => s.status);
  const checks = useNonograma((s) => s.checks);
  const extraAttempt = useNonograma((s) => s.extraAttempt);
  const conceal = useNonograma((s) => s.conceal);
  const startedAt = useNonograma((s) => s.startedAt);
  const finishedAt = useNonograma((s) => s.finishedAt);
  const setConceal = useNonograma((s) => s.setConceal);
  // Si el intento extra ya no se puede ofrecer (se usó en otro lado), la solución no queda tapada.
  useEffect(() => {
    if (conceal && !offerAvailable) setConceal(false);
  }, [conceal, offerAvailable, setConceal]);
  if (!puzzle || status === "playing") return null;

  const won = status === "won";
  const attempts = attemptsOf({ status, checks, extraAttempt });
  const time = formatTime((finishedAt ?? Date.now()) - startedAt);
  const title = mode.kind === "daily" ? `Nonograma del día #${mode.number}` : `Nonograma ${mode.world}-${mode.level}`;
  const picture = mode.kind === "daily" ? "el dibujo del día" : `«${puzzle.title}»`;
  const offering = mode.kind === "daily" && !mode.practice && !won && conceal && offerAvailable;

  const marks = Array.from({ length: MAX_ATTEMPTS }, (_, i) => (won && !extraAttempt && i === attempts - 1 ? "🟩" : i < attempts - 1 || !won || extraAttempt ? "🟥" : "⬜")).join("");
  const score = won ? (extraAttempt ? "con un intento extra" : `${attempts}/${MAX_ATTEMPTS}`) : "X";
  const shareMessage = `Craneá · ${title}\n${marks} ${score} en ${time}\n${SHARE_URL}/nonograma`;
  // La silueta del tablero, sin una sola casilla pintada: el dibujo no se revela.
  const card: ResultCard = {
    game: "Nonograma",
    label: resultLabel(mode),
    won,
    headline: won ? (extraAttempt ? "Con intento extra" : `${attempts}/${MAX_ATTEMPTS}`) : "No salió",
    detail: won ? `${puzzle.width}×${puzzle.height} · ${attempts === 1 ? "sin revisar" : `${attempts} intentos`} · ${time}` : `Sin resolver · ${time}`,
    visual: { kind: "board", width: puzzle.width, height: puzzle.height, blocks: 5 },
    marks: attemptMarks(MAX_ATTEMPTS, won && !extraAttempt ? attempts - 1 : MAX_ATTEMPTS, won && !extraAttempt),
  };

  return (
    <ResultSheet
      visible={open}
      onClose={onClose}
      title={won ? (extraAttempt ? "¡Salió con el intento extra!" : attempts === 1 ? "Sin revisar ni una vez" : "Dibujo completo") : "Esta vez no salió"}
      description={
        won
          ? extraAttempt
            ? `${title}, en ${time}. Suma a tu racha; en el ranking queda como no resuelto.`
            : `${title}: ${picture}, en ${attempts} de ${MAX_ATTEMPTS} intentos y ${time}.`
          : offering
            ? `${title}, sin resolver por ahora.`
            : `${title}, sin resolver. Era ${picture}.`
      }
    >
      {offering && mode.kind === "daily" ? (
        <ExtraAttemptOffer gameId={GAME_ID} date={mode.date} onGranted={onExtra} onReveal={() => setConceal(false)} />
      ) : (
        <Row gap={16}>
          <Animated.View entering={ZoomIn.delay(120).springify().damping(14)}>
            <Picture puzzle={puzzle} />
          </Animated.View>
          {mode.kind === "level" && <Text variant="title" style={{ flex: 1 }}>{puzzle.title}</Text>}
        </Row>
      )}
      <View style={{ gap: 8 }}>
        {mode.kind === "level" && mode.next ? (
          <Button
            title="Siguiente nivel"
            size="lg"
            onPress={() => {
              onClose();
              router.replace({ pathname: "/nonograma/nivel/[mundo]/[nivel]", params: { mundo: String(mode.next!.world), nivel: String(mode.next!.level) } });
            }}
          />
        ) : (
          <Button title="Volver a los mundos" size="lg" onPress={() => { onClose(); router.navigate("/nonograma"); }} />
        )}
        {mode.kind === "level" && (!won || attempts > 1) && <Button title="Reintentar" variant="outline" icon="refresh" onPress={onRetry} />}
        {mode.kind === "daily" && (
          <Button title="Ver ranking" variant="outline" icon="trophy-outline" onPress={() => { onClose(); router.push({ pathname: "/ranking", params: { juego: GAME_ID, fecha: mode.date } }); }} />
        )}
        <ResultShareButton text={shareMessage} card={card} />
      </View>
      <PlusNudge gameId={GAME_ID} mode={mode} won={won} onLeave={onClose} />
    </ResultSheet>
  );
}

const styles = StyleSheet.create({
  segment: { flex: 1, flexDirection: "row", borderWidth: 2, borderRadius: radius.lg, padding: 3, gap: 3 },
  segmentItem: { flex: 1, minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: radius.md },
  iconButton: { width: 50, height: 50, borderWidth: 2, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  picture: { borderWidth: 2, borderRadius: radius.md, padding: 8, alignSelf: "flex-start" },
});
