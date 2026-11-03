import { todayKey } from "@cranea/core";
import { useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { motion } from "@/lib/motion";
import { Button, Card, Icon, Row, Screen, Text } from "@/components/ui";
import { GAMES } from "@/games/registry";
import { api, accountsEnabled } from "@/lib/convex";
import { formatTime } from "@/lib/format";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function shift(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "31 de octubre", sin depender de Intl. */
function formatDate(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]}`;
}

/** Ranking diario de cada juego (convex/ranking.ts → `day`), igual que /ranking en la web. */
export default function Ranking() {
  const params = useLocalSearchParams<{ juego?: string; fecha?: string }>();
  const today = todayKey();
  const [gameId, setGameId] = useState(GAMES.find((g) => g.id === params.juego)?.id ?? GAMES[0].id);
  const [date, setDate] = useState(params.fecha && DATE.test(params.fecha) && params.fecha <= today ? params.fecha : today);

  return (
    <>
      <Stack.Screen options={{ title: "Ranking" }} />
      <Screen>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {GAMES.map((g) => (
            <Button key={g.id} title={g.name} variant={g.id === gameId ? "primary" : "outline"} onPress={() => setGameId(g.id)} />
          ))}
        </ScrollView>
        <Card raised style={{ gap: 12 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <DayButton icon="chevron-back" label="Día anterior" onPress={() => setDate(shift(date, -1))} />
            <View style={{ alignItems: "center" }}>
              <Text variant="title" style={{ fontSize: 20 }}>{date === today ? "Hoy" : formatDate(date)}</Text>
              <Text variant="small">{date === today ? formatDate(date) : "Diario"}</Text>
            </View>
            <DayButton icon="chevron-forward" label="Día siguiente" disabled={date >= today} onPress={() => setDate(shift(date, 1))} />
          </Row>
          {accountsEnabled ? <Board gameId={gameId} date={date} /> : <Text variant="muted">El ranking necesita conexión con la cuenta, que no está configurada en esta versión.</Text>}
        </Card>
        <Text variant="small" style={{ textAlign: "center" }}>Primero quienes ganaron, después menos intentos y menos tiempo. Cuenta la primera partida del día, con el tiempo medido por el servidor.</Text>
      </Screen>
    </>
  );
}

function DayButton({ icon, label, onPress, disabled }: { icon: "chevron-back" | "chevron-forward"; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} hitSlop={8} style={{ padding: 8, opacity: disabled ? 0.3 : 1 }}>
      <Icon name={icon} size={22} />
    </Pressable>
  );
}

function Board({ gameId, date }: { gameId: string; date: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  const data = useQuery(api.ranking.day, { gameId, date });
  if (data === undefined) return <ActivityIndicator style={{ paddingVertical: 24 }} />;
  if (!data.top.length) {
    return (
      <View style={{ gap: 10, paddingVertical: 8 }}>
        <Text variant="muted" style={{ textAlign: "center" }}>Todavía no hay resultados para este día.</Text>
        <Button title="Iniciar sesión para aparecer" variant="ghost" onPress={() => router.push("/cuenta")} />
      </View>
    );
  }
  const rows = data.me ? [...data.top, data.me] : data.top;
  return (
    <Animated.View entering={motion.fade()} style={{ gap: 4 }}>
      {rows.map((r, i) => (
        <View key={`${r.rank}-${i}`}>
          {data.me && r === data.me && <Text variant="small" style={{ textAlign: "center", paddingVertical: 2 }}>⋯</Text>}
          <Row gap={10} style={[styles.row, r.mine && { backgroundColor: colors.cluePresentBg }]}>
            <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 16, width: 28, textAlign: "right", color: colors.ink }}>{r.rank}</Text>
            <Text variant={r.mine ? "bodyBold" : "body"} style={{ flex: 1 }} numberOfLines={1}>{r.name}{r.mine ? " (vos)" : ""}</Text>
            <Text variant="small" style={{ color: r.won ? colors.ink : colors.mutedForeground }}>{r.won ? `${r.attempts} int.` : "X"}</Text>
            <Text variant="bodyBold" style={{ fontVariant: ["tabular-nums"], width: 52, textAlign: "right" }}>{formatTime(r.timeMs)}</Text>
          </Row>
        </View>
      ))}
      <Text variant="small" style={{ textAlign: "center", marginTop: 6 }}>{data.total} {data.total === 1 ? "jugador" : "jugadores"}{data.capped ? " o más" : ""}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { borderRadius: radius.md, paddingHorizontal: 8, minHeight: 40 },
});
