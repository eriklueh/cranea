import { todayKey } from "@cranea/core";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { NotFound } from "@/components/not-found";
import { PlusGate } from "@/components/plus";
import { Icon, Loading, Text } from "@/components/ui";
import { usePlus, usePlusReady } from "@/entitlements";
import { ARCHIVE, pastDates } from "@/games/archive";
import { formatTime } from "@/lib/format";
import { useClock } from "@/lib/hooks";
import { useGameProgress, type Result } from "@/stores/progress";
import { useTheme } from "@/theme/theme";
import { radius } from "@/theme/tokens";

const dateLabel = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** Archivo de diarios (Craneá Plus): los de días anteriores, para practicar. No se guardan ni cuentan. */
export default function Archive() {
  const { game } = useLocalSearchParams<{ game: string }>();
  const info = ARCHIVE[game];
  const plus = usePlus();
  const ready = usePlusReady();
  if (!info) return <NotFound title="Juego sin archivo" message="Este juego todavía no tiene diarios anteriores en la app." />;
  return (
    <>
      <Stack.Screen options={{ title: `${info.name}: diarios anteriores` }} />
      {!ready ? (
        <Loading label="Cargando…" />
      ) : plus ? (
        <List game={game} />
      ) : (
        <PlusGate title="Diarios anteriores" message="Con Craneá Plus podés jugar los desafíos de días anteriores para practicar. El de hoy siempre es gratis." reason="archivo" />
      )}
    </>
  );
}

function List({ game }: { game: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  const info = ARCHIVE[game];
  const today = todayKey(new Date(useClock()));
  const progress = useGameProgress(game);
  const dates = pastDates(info.launch, today);

  return (
    <FlatList
      data={dates}
      keyExtractor={(d) => d}
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: 18, gap: 8, width: "100%", maxWidth: 560, alignSelf: "center" }}
      ListHeaderComponent={<Text variant="muted" style={{ marginBottom: 6 }}>Son práctica: no cambian tu racha ni el ranking.</Text>}
      ListEmptyComponent={<Text variant="muted">Todavía no hay diarios anteriores. ¡Volvé mañana!</Text>}
      renderItem={({ item: date }) => {
        const played = progress.daily[date];
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Diario número ${info.number(date)}, ${dateLabel(date)}. ${status(played)}`}
            onPress={() => router.push({ pathname: "/archivo/[game]/[fecha]", params: { game, fecha: date } })}
            style={({ pressed }) => [styles.row, { borderColor: colors.border, backgroundColor: pressed ? colors.accent : colors.card }]}
          >
            <View style={{ flex: 1 }}>
              <Text variant="bodyBold">#{info.number(date)}</Text>
              <Text variant="small" style={{ textTransform: "capitalize" }}>{dateLabel(date)}</Text>
            </View>
            <Text variant="small">{status(played)}</Text>
            <Icon name={played ? (played.won ? "checkmark-circle" : "close-circle-outline") : "play-circle-outline"} color={played?.won ? colors.ok : colors.pencil} />
          </Pressable>
        );
      }}
    />
  );
}

const status = (r: Result | undefined) => (!r ? "Sin jugar" : r.won ? `Resuelto · ${formatTime(r.timeMs)}` : "No salió");

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 60, borderWidth: 1, borderRadius: radius.xl, paddingHorizontal: 14 },
});
