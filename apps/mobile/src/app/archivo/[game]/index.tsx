import { todayKey } from "@cranea/core";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { NotFound } from "@/components/not-found";
import { SpanishOnly } from "@/components/spanish-only";
import { PlusGate } from "@/components/plus";
import { Icon, Loading, Text } from "@/components/ui";
import { usePlus, usePlusReady } from "@/entitlements";
import { ARCHIVE, pastDates } from "@/games/archive";
import { formatTime } from "@/lib/format";
import { useClock } from "@/lib/hooks";
import { useGameCopy, useIntlLocale, useT, type T } from "@/lib/i18n";
import { useGameProgress, type Result } from "@/stores/progress";
import { useTheme } from "@/theme/theme";
import { radius } from "@/theme/tokens";

const dateLabel = (date: string, intl: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString(intl, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** Archivo de diarios (Craneá Plus): los de días anteriores, para practicar. No se guardan ni cuentan. */
export default function Archive() {
  const { game } = useLocalSearchParams<{ game: string }>();
  // Palabra (en castellano): en inglés, el aviso con el atajo a español.
  return (
    <SpanishOnly gameId={game}>
      <ArchiveScreen game={game} />
    </SpanishOnly>
  );
}

function ArchiveScreen({ game }: { game: string }) {
  const info = ARCHIVE[game];
  const plus = usePlus();
  const ready = usePlusReady();
  const t = useT();
  const copy = useGameCopy(game);
  if (!info) return <NotFound title={t("shell.archiveNoGame")} message={t("shell.archiveNoGameBody")} />;
  return (
    <>
      <Stack.Screen options={{ title: t("shell.archiveTitle", { game: copy.name }) }} />
      {!ready ? (
        <Loading label={t("common.loading")} />
      ) : plus ? (
        <List game={game} />
      ) : (
        <PlusGate title={t("shell.archiveGateTitle")} message={t("shell.archiveGateBody")} reason="archivo" />
      )}
    </>
  );
}

function List({ game }: { game: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  const t = useT();
  const intl = useIntlLocale();
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
      ListHeaderComponent={<Text variant="muted" style={{ marginBottom: 6 }}>{t("shell.archivePractice")}</Text>}
      ListEmptyComponent={<Text variant="muted">{t("shell.archiveEmpty")}</Text>}
      renderItem={({ item: date }) => {
        const played = progress.daily[date];
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("shell.archiveRowA11y", { n: info.number(date), date: dateLabel(date, intl), status: status(played, t) })}
            onPress={() => router.push({ pathname: "/archivo/[game]/[fecha]", params: { game, fecha: date } })}
            style={({ pressed }) => [styles.row, { borderColor: colors.border, backgroundColor: pressed ? colors.accent : colors.card }]}
          >
            <View style={{ flex: 1 }}>
              <Text variant="bodyBold">#{info.number(date)}</Text>
              <Text variant="small" style={{ textTransform: "capitalize" }}>{dateLabel(date, intl)}</Text>
            </View>
            <Text variant="small">{status(played, t)}</Text>
            <Icon name={played ? (played.won ? "checkmark-circle" : "close-circle-outline") : "play-circle-outline"} color={played?.won ? colors.ok : colors.pencil} />
          </Pressable>
        );
      }}
    />
  );
}

const status = (r: Result | undefined, t: T) => (!r ? t("shell.statusUnplayed") : r.won ? t("shell.statusSolved", { time: formatTime(r.timeMs) }) : t("shell.statusMissed"));

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 60, borderWidth: 1, borderRadius: radius.xl, paddingHorizontal: 14 },
});
