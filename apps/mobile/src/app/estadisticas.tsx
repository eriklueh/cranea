import { todayKey } from "@cranea/core";
import { Stack } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Button, Card, Row, Screen, Text } from "@/components/ui";
import { GAMES } from "@/games/registry";
import { formatTime } from "@/lib/format";
import { gameStats, useGameProgress } from "@/stores/progress";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";

/** Estadísticas con el progreso del dispositivo (mismo cálculo que /estadisticas en la web): funciona sin sesión ni red. */
export default function Stats() {
  const [gameId, setGameId] = useState(GAMES[0].id);
  return (
    <>
      <Stack.Screen options={{ title: "Estadísticas" }} />
      <Screen>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {GAMES.map((g) => (
            <Button key={g.id} title={g.name} variant={g.id === gameId ? "primary" : "outline"} onPress={() => setGameId(g.id)} />
          ))}
        </ScrollView>
        <GameStatsView key={gameId} gameId={gameId} />
      </Screen>
    </>
  );
}

function GameStatsView({ gameId }: { gameId: string }) {
  const { colors } = useTheme();
  const progress = useGameProgress(gameId);
  const s = gameStats(progress, todayKey());
  const winRate = s.played ? Math.round((s.won / s.played) * 100) : 0;
  const tries = Object.keys(s.attempts.counts).map(Number).sort((a, b) => a - b);
  const max = Math.max(1, s.attempts.lost, ...tries.map((t) => s.attempts.counts[t]));

  return (
    <Animated.View entering={FadeIn.duration(200)} style={{ gap: 14 }}>
      <View style={styles.grid}>
        <Stat label="Jugadas" value={String(s.played)} />
        <Stat label="Ganadas" value={`${winRate}%`} />
        <Stat label="Racha" value={String(s.streak)} />
        <Stat label="Mejor racha" value={String(s.bestStreak)} />
        <Stat label="Niveles" value={String(s.levelsCompleted)} />
        <Stat label="Mejor tiempo" value={s.bestTimeMs === null ? "–" : formatTime(s.bestTimeMs)} />
      </View>
      <Card style={{ gap: 8 }}>
        <Text variant="label">Diarios por intentos</Text>
        {tries.length === 0 && s.attempts.lost === 0 ? (
          <Text variant="muted">Jugá un diario para ver tu distribución.</Text>
        ) : (
          <>
            {tries.map((t) => <Bar key={t} label={String(t)} value={s.attempts.counts[t]} max={max} color={colors.ok} />)}
            {s.attempts.lost > 0 && <Bar label="X" value={s.attempts.lost} max={max} color={colors.pencil} />}
          </>
        )}
      </Card>
      {s.avgTimeMs !== null && <Text variant="small" style={{ textAlign: "center" }}>Tiempo promedio de las ganadas: {formatTime(s.avgTimeMs)}</Text>}
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
  return (
    <Row gap={8} accessible accessibilityLabel={`${label === "X" ? "Sin resolver" : `${label} intentos`}: ${value}`}>
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
