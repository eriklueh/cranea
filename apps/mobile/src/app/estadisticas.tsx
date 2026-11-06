import { todayKey } from "@cranea/core";
import { Stack } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { motion } from "@/lib/motion";
import { ProtectorsRow } from "@/components/protectors";
import { Button, Card, Row, Screen, Text } from "@/components/ui";
import { GAMES } from "@/games/registry";
import { formatTime } from "@/lib/format";
import { useT, useVisibleGames } from "@/lib/i18n";
import { gameStats, useGameProgress } from "@/stores/progress";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";

/** Estadísticas con el progreso del dispositivo (mismo cálculo que /estadisticas en la web): funciona sin sesión ni red. */
export default function Stats() {
  const t = useT();
  // Palabra (en castellano) no aparece en inglés.
  const games = useVisibleGames(GAMES);
  const [picked, setGameId] = useState(GAMES[0].id);
  const gameId = games.some((g) => g.id === picked) ? picked : games[0].id;
  return (
    <>
      <Stack.Screen options={{ title: t("common.stats") }} />
      <Screen>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {games.map((g) => (
            <Button key={g.id} title={g.name} variant={g.id === gameId ? "primary" : "outline"} onPress={() => setGameId(g.id)} />
          ))}
        </ScrollView>
        <ProtectorsRow />
        <GameStatsView key={gameId} gameId={gameId} />
      </Screen>
    </>
  );
}

function GameStatsView({ gameId }: { gameId: string }) {
  const { colors } = useTheme();
  const t = useT();
  const progress = useGameProgress(gameId);
  const s = gameStats(progress, todayKey());
  const winRate = s.played ? Math.round((s.won / s.played) * 100) : 0;
  const tries = Object.keys(s.attempts.counts).map(Number).sort((a, b) => a - b);
  const max = Math.max(1, s.attempts.lost, ...tries.map((t) => s.attempts.counts[t]));

  return (
    <Animated.View entering={motion.fade()} style={{ gap: 14 }}>
      <View style={styles.grid}>
        <Stat label={t("stats.played")} value={String(s.played)} />
        <Stat label={t("stats.winRate")} value={`${winRate}%`} />
        <Stat label={t("common.streak")} value={String(s.streak)} />
        <Stat label={t("stats.bestStreak")} value={String(s.bestStreak)} />
        <Stat label={t("common.levels")} value={String(s.levelsCompleted)} />
        <Stat label={t("stats.bestTime")} value={s.bestTimeMs === null ? "–" : formatTime(s.bestTimeMs)} />
      </View>
      <Card style={{ gap: 8 }}>
        <Text variant="label">{t("stats.byAttempts")}</Text>
        {tries.length === 0 && s.attempts.lost === 0 ? (
          <Text variant="muted">{t("stats.empty")}</Text>
        ) : (
          <>
            {tries.map((t) => <Bar key={t} label={String(t)} value={s.attempts.counts[t]} max={max} color={colors.ok} />)}
            {s.attempts.lost > 0 && <Bar label="X" value={s.attempts.lost} max={max} color={colors.pencil} />}
          </>
        )}
      </Card>
      {s.avgTimeMs !== null && <Text variant="small" style={{ textAlign: "center" }}>{t("stats.avgTime", { time: formatTime(s.avgTimeMs) })}</Text>}
    </Animated.View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.cellWrap}>
      <View style={[styles.cell, { backgroundColor: colors.card, borderColor: colors.border }]} accessible accessibilityLabel={`${label}: ${value}`}>
        <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 24, color: colors.ink }}>{value}</Text>
        <Text variant="small">{label}</Text>
      </View>
    </View>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Row gap={8} accessible accessibilityLabel={`${label === "X" ? t("stats.unsolved") : t("common.attempts", { count: Number(label) })}: ${value}`}>
      <Text variant="bodyBold" style={{ width: 16, textAlign: "center" }}>{label}</Text>
      <View style={{ flex: 1, height: 22, backgroundColor: colors.muted, borderRadius: 4, overflow: "hidden" }}>
        <View style={{ width: `${Math.max(8, (value / max) * 100)}%`, height: "100%", backgroundColor: color, borderRadius: 4, justifyContent: "center", alignItems: "flex-end", paddingRight: 6 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: colors.paper }}>{value}</Text>
        </View>
      </View>
    </Row>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  cellWrap: { width: "33.333%", padding: 4 },
  cell: { borderWidth: 1, borderRadius: radius.lg, paddingVertical: 12, alignItems: "center", gap: 2 },
});
