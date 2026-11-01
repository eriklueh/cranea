import type { PuentesPuzzle } from "@cranea/core/puentes";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DailyNotice } from "@/components/daily-gate";
import { GameHeader } from "@/components/game-header";
import { ResultSheet, shareText } from "@/components/result-sheet";
import { PlusNudge } from "@/components/plus-nudge";
import { Button, Row, Text } from "@/components/ui";
import { SHARE_URL } from "@/config";
import { formatTime } from "@/lib/format";
import { useProgress } from "@/stores/progress";
import { useTheme } from "@/theme/theme";
import { GAME_ID, levelKey, mistakesText } from "../data";
import { attemptsOf, usePuentes, type Notice } from "../store";
import { PuentesBoard, useBoardGesture } from "./board";
import { useBoardWidth } from "./geometry";

export type GameMode =
  | { kind: "level"; world: number; level: number; next: number | null }
  | { kind: "daily"; date: string; number: number; /** Repetición o archivo: no se guarda ni cuenta para el ranking. */ practice: boolean };

/** Lo que espera la hoja de resultado para no tapar la ola de las islas. */
const RESULT_DELAY_MS = 700;
/** El tablero puede usar casi todo el ancho: 12 pt de margen a cada lado (11 × 11 en 360 pt = celdas de 30 pt). */
const BOARD_GUTTER = 24;

function noticeText(n: Notice, status: string) {
  if (status === "won") return "Todas las islas quedaron conectadas.";
  if (!n) return "";
  if (n.kind === "blocked") return "Ese puente cruzaría otro.";
  if (n.kind === "wrong") return n.count === 1 ? "Hay un puente de más. Quedó marcado en rojo." : `Hay ${n.count} puentes de más. Quedaron marcados en rojo.`;
  return n.missing === 1 ? "Vas bien. Falta un puente." : `Vas bien. Faltan ${n.missing} puentes.`;
}

export function PuentesGame({ puzzle, mode }: { puzzle: PuentesPuzzle; mode: GameMode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const start = usePuentes((s) => s.start);
  const current = usePuentes((s) => s.puzzle);
  const status = usePuentes((s) => s.status);
  const mistakes = usePuentes((s) => s.mistakes);
  const notice = usePuentes((s) => s.notice);
  const canUndo = usePuentes((s) => s.history.length > 0);
  const hasBridges = usePuentes((s) => s.bridges.some((b) => b > 0));
  const { undo, reset, check } = usePuentes.getState();
  const [resultOpen, setResultOpen] = useState(false);
  const recorded = useRef(false);
  const ready = current === puzzle;
  const playing = ready && status === "playing";
  const board = useBoardGesture(playing);
  const width = useBoardWidth(puzzle.width, BOARD_GUTTER);

  useEffect(() => {
    start(puzzle);
    recorded.current = false;
    setResultOpen(false);
  }, [puzzle, start]);

  // Guardar el resultado una sola vez, con las mismas claves y forma que la web.
  useEffect(() => {
    if (status !== "won" || recorded.current || current !== puzzle) return;
    recorded.current = true;
    const s = usePuentes.getState();
    const result = { won: true, attempts: attemptsOf(s.mistakes), timeMs: (s.finishedAt ?? Date.now()) - s.startedAt, at: Date.now() };
    const p = useProgress.getState();
    if (mode.kind === "level") p.recordLevel(GAME_ID, levelKey(mode.world, mode.level), result);
    else if (!mode.practice) p.recordDaily(GAME_ID, mode.date, result);
    const t = setTimeout(() => setResultOpen(true), RESULT_DELAY_MS);
    return () => clearTimeout(t);
  }, [status, current, puzzle, mode]);

  const title = mode.kind === "daily" ? `Puentes del día #${mode.number}` : `Nivel ${mode.level}`;
  const subtitle = mode.kind === "daily" ? "Mismo tablero para todos" : `Mundo ${mode.world}`;
  const message = ready ? noticeText(notice, status) : "";

  return (
    <>
      <Stack.Screen options={{ title: mode.kind === "daily" ? "Puentes del día" : `Puentes · ${mode.world}-${mode.level}` }} />
      {/* ScrollView de gesture-handler: espera al arrastre del tablero, así deslizar entre islas no mueve la pantalla. */}
      <ScrollView
        requireToFail={board.pan}
        style={{ flex: 1, backgroundColor: colors.paper }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      >
        <GameHeader
          title={title}
          subtitle={subtitle}
          right={
            <>
              <Text variant="bodyBold" style={mistakes ? { color: colors.margin } : undefined}>
                {mistakes === 0 ? "Sin errores" : mistakes === 1 ? "1 error" : `${mistakes} errores`}
              </Text>
              <Timer />
            </>
          }
        />
        {mode.kind === "daily" && <DailyNotice practice={mode.practice} />}
        <Animated.View entering={FadeInDown.duration(260)} style={{ marginHorizontal: -6 }}>
          <PuentesBoard puzzle={puzzle} width={width} board={board} />
        </Animated.View>
        <Text
          variant="small"
          accessibilityLiveRegion="polite"
          style={{ minHeight: 18, textAlign: "center", color: notice?.kind === "wrong" ? colors.margin : colors.mutedForeground }}
        >
          {message}
        </Text>
        {status === "won" && ready ? (
          <Pressable onPress={() => setResultOpen(true)} accessibilityRole="button" style={{ minHeight: 44, alignSelf: "center", justifyContent: "center" }}>
            <Text variant="bodyBold" style={{ textDecorationLine: "underline", textDecorationColor: colors.margin }}>
              Ver resultado ({mistakesText(mistakes)})
            </Text>
          </Pressable>
        ) : (
          <View style={{ gap: 8 }}>
            <Row gap={8}>
              <Button title="Deshacer" icon="arrow-undo" variant="outline" onPress={undo} disabled={!canUndo} style={{ flex: 1, paddingHorizontal: 8 }} />
              <Button title="Empezar de nuevo" icon="refresh" variant="outline" onPress={reset} disabled={!hasBridges} style={{ flex: 1.5, paddingHorizontal: 8 }} />
            </Row>
            <Button title="Revisar" icon="checkmark" size="lg" onPress={check} disabled={!hasBridges || !playing} />
          </View>
        )}
        {playing && (
          <Text variant="small" style={{ textAlign: "center" }}>
            Deslizá desde una isla o tocá dos islas para tender un puente. Tocá el puente para sumar el segundo o sacarlo.
          </Text>
        )}
      </ScrollView>
      <PuentesResult open={resultOpen} onClose={() => setResultOpen(false)} mode={mode} />
    </>
  );
}

function Timer() {
  const startedAt = usePuentes((s) => s.startedAt);
  const finishedAt = usePuentes((s) => s.finishedAt);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (finishedAt || !startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [finishedAt, startedAt]);
  const ms = startedAt ? (finishedAt ?? now) - startedAt : 0;
  return <Text variant="bodyBold" style={{ fontVariant: ["tabular-nums"], minWidth: 40, textAlign: "right" }}>{formatTime(Math.max(0, ms))}</Text>;
}

function PuentesResult({ open, onClose, mode }: { open: boolean; onClose: () => void; mode: GameMode }) {
  const router = useRouter();
  const puzzle = usePuentes((s) => s.puzzle);
  const status = usePuentes((s) => s.status);
  const mistakes = usePuentes((s) => s.mistakes);
  const startedAt = usePuentes((s) => s.startedAt);
  const finishedAt = usePuentes((s) => s.finishedAt);
  if (!puzzle || status !== "won") return null;
  const time = formatTime((finishedAt ?? Date.now()) - startedAt);
  const title = mode.kind === "daily" ? `Puentes del día #${mode.number}` : `Puentes ${mode.world}-${mode.level}`;
  const share = () => void shareText(`Craneá · ${title}\n🌉 ${mistakesText(mistakes)} en ${time}\n${SHARE_URL}/puentes`);
  return (
    <ResultSheet visible={open} onClose={onClose} title={mistakes === 0 ? "Todo conectado, sin errores" : "Todo conectado"} description={`${title}, ${mistakesText(mistakes)} y en ${time}.`}>
      <View style={{ gap: 8 }}>
        {mode.kind === "level" && mode.next ? (
          <Button
            title="Siguiente nivel"
            size="lg"
            onPress={() => {
              onClose();
              router.replace({ pathname: "/puentes/nivel/[mundo]/[nivel]", params: { mundo: String(mode.world), nivel: String(mode.next) } });
            }}
          />
        ) : (
          <Button title="Volver a los mundos" size="lg" onPress={() => { onClose(); router.navigate("/puentes"); }} />
        )}
        {mode.kind === "daily" && !mode.practice && (
          <Button title="Ver ranking" variant="outline" icon="trophy-outline" onPress={() => { onClose(); router.push({ pathname: "/ranking", params: { juego: GAME_ID, fecha: mode.date } }); }} />
        )}
        <Button title="Compartir resultado" variant="outline" icon="share-outline" onPress={share} />
      </View>
      <PlusNudge gameId={GAME_ID} mode={mode} onLeave={onClose} />
    </ResultSheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 12, gap: 12, width: "100%", maxWidth: 560, alignSelf: "center" },
});
