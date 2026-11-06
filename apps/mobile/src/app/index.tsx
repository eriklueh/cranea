import { todayKey } from "@cranea/core";
import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { ProtectorBadge } from "@/components/protectors";
import { ReminderOffer } from "@/components/reminder";
import { Icon, Row, Screen, Text, shadow } from "@/components/ui";
import { DigitTile, Indicator } from "@/games/cifra/components/tiles";
import { LetterTile } from "@/games/palabra/components/palabra-game";
import { TorresPreview } from "@/games/torres/components/preview";
import { PuentesPreview } from "@/games/puentes/components/preview";
import { NonogramaPreview } from "@/games/nonograma/components/examples";
import { GAMES, type MobileGame } from "@/games/registry";
import { useClock } from "@/lib/hooks";
import { useGameCopy, useT, useVisibleGames } from "@/lib/i18n";
import { motion, staggerStep } from "@/lib/motion";
import { dailyStreak, useProgress } from "@/stores/progress";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";

export default function Home() {
  const { colors } = useTheme();
  const router = useRouter();
  const t = useT();
  // Palabra (en castellano) no aparece en inglés.
  const games = useVisibleGames(GAMES);
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 24, color: colors.ink }}>{t("common.appName")}</Text>,
          headerRight: () => (
            <Row gap={4}>
              <HeaderButton icon="stats-chart-outline" label={t("common.stats")} onPress={() => router.push("/estadisticas")} />
              <HeaderButton icon="settings-outline" label={t("common.settings")} onPress={() => router.push("/ajustes")} />
              <HeaderButton icon="person-circle-outline" label={t("shell.accountTitle")} onPress={() => router.push("/cuenta")} />
            </Row>
          ),
        }}
      />
      <Screen>
        <TodayStrip />
        <ReminderOffer />
        {games.map((g, i) => (
          <Animated.View key={g.id} entering={motion.appear(i * staggerStep(games.length))}>
            <GameCard game={g} />
          </Animated.View>
        ))}
      </Screen>
    </>
  );
}

function HeaderButton({ icon, label, onPress }: { icon: "stats-chart-outline" | "settings-outline" | "person-circle-outline"; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8} style={{ padding: 6 }}>
      <Icon name={icon} size={24} />
    </Pressable>
  );
}

/** Los diarios de hoy de un vistazo: cuántos faltan. */
function TodayStrip() {
  const { colors } = useTheme();
  const now = useClock();
  const today = todayKey(new Date(now));
  const hydrated = useProgress((s) => s.hydrated);
  const games = useProgress((s) => s.games);
  const t = useT();
  const live = useVisibleGames(GAMES).filter((g) => g.mobile === "live");
  const done = live.filter((g) => games[g.id]?.daily[today]).length;
  if (!hydrated) return null;
  return (
    <Row gap={8} style={[styles.strip, { backgroundColor: colors.muted }]}>
      <Icon name={done === live.length ? "checkmark-circle" : "calendar-outline"} size={18} color={done === live.length ? colors.ok : colors.ink} />
      <Text variant="small" style={{ flex: 1, color: colors.ink }}>
        {done === live.length ? t("shell.todayAllDone") : t("shell.todayProgress", { done, total: live.length })}
      </Text>
      <ProtectorBadge />
    </Row>
  );
}

function GameCard({ game }: { game: MobileGame }) {
  const { colors } = useTheme();
  const router = useRouter();
  const t = useT();
  // En inglés, el nombre (marca) lleva su subtítulo: «Puentes · Bridges».
  const copy = useGameCopy(game.id);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${copy.name}${copy.subtitle ? ` (${copy.subtitle})` : ""}. ${copy.tagline}${game.mobile === "soon" ? ` ${t("shell.soonInApp")}` : ""}`}
      onPress={() => router.push(game.href)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.ink, ...shadow(colors.shadowInk, pressed ? 1 : 4) },
        pressed && { transform: [{ translateY: 2 }] },
        game.mobile === "soon" && { borderColor: colors.border, ...shadow(colors.border, pressed ? 1 : 4) },
      ]}
    >
      <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 28, color: colors.ink, flexShrink: 1 }}>
          {copy.name}
          {copy.subtitle ? <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.mutedForeground }}> · {copy.subtitle}</Text> : null}
        </Text>
        {game.mobile === "live" ? <DailyBadge gameId={game.id} /> : <SoonBadge />}
      </Row>
      <Text variant="muted">{copy.tagline}</Text>
      {game.id === "cifra" && <CifraPreview />}
      {game.id === "palabra" && <PalabraPreview />}
      {game.id === "torres" && <View style={styles.preview}><TorresPreview /></View>}
      {game.id === "puentes" && <PuentesPreview />}
      {game.id === "nonograma" && <View style={styles.preview}><NonogramaPreview cell={18} /></View>}
    </Pressable>
  );
}

/** Estado del diario de hoy en la tarjeta: por jugar, resuelto, o no salió. Con racha si hay. */
function DailyBadge({ gameId }: { gameId: string }) {
  const { colors } = useTheme();
  const now = useClock();
  const today = todayKey(new Date(now));
  const hydrated = useProgress((s) => s.hydrated);
  const played = useProgress((s) => s.games[gameId]?.daily[today]);
  const streak = useProgress((s) => dailyStreak(s.games[gameId]?.daily ?? {}, today));
  const t = useT();
  if (!hydrated) return null;
  const tone = played ? (played.won ? { bg: colors.clueExactBg, fg: colors.clueExact } : { bg: colors.muted, fg: colors.pencil }) : { bg: colors.cluePresentBg, fg: colors.cluePresent };
  const label = played ? (played.won ? t("shell.dailySolved") : t("shell.dailyMissed")) : t("shell.dailyUnplayed");
  return (
    <Row gap={4} style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Icon name={played ? (played.won ? "checkmark" : "moon") : "sunny"} size={14} color={tone.fg} />
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: tone.fg }}>{label}</Text>
      {streak > 0 && <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: tone.fg }}>· 🔥{streak}</Text>}
    </Row>
  );
}

function SoonBadge() {
  const { colors } = useTheme();
  const t = useT();
  return (
    <View style={[styles.badge, { backgroundColor: colors.muted }]}>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.mutedForeground }}>{t("shell.soon")}</Text>
    </View>
  );
}

function CifraPreview() {
  return (
    <Row gap={8} style={styles.preview} importantForAccessibility="no-hide-descendants">
      <Indicator kind="exact" value={1} />
      <Row gap={5}>
        {[4, 0, 7, 2].map((d, i) => (
          <DigitTile key={i} digit={d} size={38} mark={d === 0 ? "out" : "none"} />
        ))}
      </Row>
      <Indicator kind="present" value={2} />
    </Row>
  );
}

function PalabraPreview() {
  const tones = ["absent", "present", "exact", "absent", "exact"] as const;
  return (
    <Row gap={5} style={styles.preview} importantForAccessibility="no-hide-descendants">
      {[..."TECLA"].map((l, i) => (
        <LetterTile key={i} letter={l} tone={tones[i]} size={38} />
      ))}
    </Row>
  );
}

const styles = StyleSheet.create({
  strip: { borderRadius: radius.lg, paddingHorizontal: 12, paddingVertical: 10 },
  card: { borderWidth: 2, borderRadius: radius.xl, padding: 16, gap: 4 },
  badge: { flexDirection: "row", alignItems: "center", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  preview: { justifyContent: "center", marginTop: 12 },
});
