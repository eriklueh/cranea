import type { PuentesPuzzle } from "@cranea/core/puentes";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { motion } from "@/lib/motion";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DailyNotice } from "@/components/daily-gate";
import { FinishSlot, ResultLink } from "@/components/finish-slot";
import { GameHeader, gameTitle } from "@/components/game-header";
import { ResultSheet } from "@/components/result-sheet";
import { ResultShareButton, resultLabel, type ResultCard } from "@/components/share-card";
import { PlusNudge } from "@/components/plus-nudge";
import { Button, Row, Text } from "@/components/ui";
import { SHARE_URL } from "@/config";
import { formatTime } from "@/lib/format";
import { useLocale, useT, type T } from "@/lib/i18n";
import { WIN_RESULT_MS } from "@/lib/motion";
import { useProgress } from "@/stores/progress";
import { useTheme } from "@/theme/theme";
import { GAME_ID, levelKey, mistakesText } from "../data";
import { attemptsOf, usePuentes, type Notice } from "../store";
import { PuentesBoard, useBoardGesture } from "./board";
import { useBoardWidth } from "./geometry";

export type GameMode =
  | { kind: "level"; world: number; level: number; next: number | null }
  | { kind: "daily"; date: string; number: number; /** Repetición o archivo: no se guarda ni cuenta para el ranking. */ practice: boolean };


/** El tablero puede usar casi todo el ancho: 12 pt de margen a cada lado (11 × 11 en 360 pt = celdas de 30 pt). */
const BOARD_GUTTER = 24;

function noticeText(n: Notice, status: string, t: T) {
  if (status === "won") return t("puentes.allConnected");
  if (!n) return "";
  if (n.kind === "blocked") return t("puentes.blocked");
  if (n.kind === "wrong") return t("puentes.wrong", { count: n.count });
  return t("puentes.missing", { count: n.missing });
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
  const t = useT();
  const locale = useLocale();

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
    const t = setTimeout(() => setResultOpen(true), WIN_RESULT_MS);
    return () => clearTimeout(t);
  }, [status, current, puzzle, mode]);

  const context = mode.kind === "daily" ? t("puentes.contextDaily") : t("puentes.contextLevel", { size: `${puzzle.width}×${puzzle.height}`, count: puzzle.islands.length });
  const message = ready ? noticeText(notice, status, t) : "";

  return (
    <>
      <Stack.Screen options={{ title: gameTitle("Puentes", mode, locale) }} />
      {/* ScrollView de gesture-handler: espera al arrastre del tablero, así deslizar entre islas no mueve la pantalla. */}
      <ScrollView
        requireToFail={board.pan}
        style={{ flex: 1, backgroundColor: colors.paper }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      >
        <GameHeader
          context={context}
          right={
            <>
              <Text variant="bodyBold" style={mistakes ? { color: colors.margin } : undefined}>
                {mistakes === 0 ? t("puentes.noMistakesCap") : t("common.errors", { count: mistakes })}
              </Text>
              <Timer />
            </>
          }
        />
        {mode.kind === "daily" && <DailyNotice practice={mode.practice} />}
        <Animated.View entering={motion.appear()} style={{ marginHorizontal: -6 }}>
          <PuentesBoard puzzle={puzzle} width={width} board={board} />
        </Animated.View>
        <Text
          variant="small"
          accessibilityLiveRegion="polite"
          style={{ minHeight: 18, textAlign: "center", color: notice?.kind === "wrong" ? colors.margin : colors.mutedForeground }}
        >
          {message}
        </Text>
        {/* Al ganar, "Ver resultado" ocupa el lugar de los controles: la pantalla no cambia de alto. */}
        <FinishSlot finished={status === "won" && ready} done={<ResultLink label={t("puentes.seeResult", { mistakes: mistakesText(mistakes, t) })} onPress={() => setResultOpen(true)} />}>
          <View style={{ gap: 12 }}>
            <View style={{ gap: 8 }}>
              <Row gap={8}>
                <Button title={t("puentes.undo")} icon="arrow-undo" variant="outline" onPress={undo} disabled={!canUndo} style={{ flex: 1, paddingHorizontal: 8 }} />
                <Button title={t("puentes.restart")} icon="refresh" variant="outline" onPress={reset} disabled={!hasBridges} style={{ flex: 1.5, paddingHorizontal: 8 }} />
              </Row>
              <Button title={t("puentes.check")} icon="checkmark" size="lg" onPress={check} disabled={!hasBridges || !playing} />
            </View>
            <Text variant="small" style={{ textAlign: "center" }}>
              {t("puentes.gestureHelp")}
            </Text>
          </View>
        </FinishSlot>
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
  const t = useT();
  const locale = useLocale();
  if (!puzzle || status !== "won") return null;
  const time = formatTime((finishedAt ?? Date.now()) - startedAt);
  const title = mode.kind === "daily" ? gameTitle("Puentes", mode, locale) : t("puentes.levelShort", { world: mode.world, level: mode.level });
  const shareMessage = t("puentes.share", { title, mistakes: mistakesText(mistakes, t), time, url: `${SHARE_URL}/puentes` });
  // Solo dónde están las islas: sin números ni puentes, no se puede copiar la solución.
  const card: ResultCard = {
    game: "Puentes",
    label: resultLabel(mode, locale),
    won: true,
    headline: mistakes === 0 ? t("puentes.noMistakesCap") : t("common.errors", { count: mistakes }),
    detail: t("puentes.cardDetail", { count: puzzle.islands.length, time }),
    visual: { kind: "board", width: puzzle.width, height: puzzle.height, dots: puzzle.islands.map(({ r, c }) => ({ r, c })) },
  };
  return (
    <ResultSheet visible={open} onClose={onClose} title={mistakes === 0 ? t("puentes.wonClean") : t("puentes.won")} description={t("puentes.resultDesc", { title, mistakes: mistakesText(mistakes, t), time })}>
      <View style={{ gap: 8 }}>
        {mode.kind === "level" && mode.next ? (
          <Button
            title={t("puentes.nextLevel")}
            size="lg"
            onPress={() => {
              onClose();
              router.replace({ pathname: "/puentes/nivel/[mundo]/[nivel]", params: { mundo: String(mode.world), nivel: String(mode.next) } });
            }}
          />
        ) : (
          <Button title={t("puentes.backToWorlds")} size="lg" onPress={() => { onClose(); router.navigate("/puentes"); }} />
        )}
        {mode.kind === "daily" && !mode.practice && (
          <Button title={t("puentes.seeRanking")} variant="outline" icon="trophy-outline" onPress={() => { onClose(); router.push({ pathname: "/ranking", params: { juego: GAME_ID, fecha: mode.date } }); }} />
        )}
        <ResultShareButton text={shareMessage} card={card} />
      </View>
      <PlusNudge gameId={GAME_ID} mode={mode} onLeave={onClose} />
    </ResultSheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 12, gap: 12, width: "100%", maxWidth: 560, alignSelf: "center" },
});
