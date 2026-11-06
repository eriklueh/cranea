import { todayKey } from "@cranea/core";
import { gameCopy, worldCopy, type Locale } from "@cranea/core/i18n";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { motion } from "@/lib/motion";
import { PlusBadge, usePlusPaywall } from "@/components/plus";
import { Button, Card, Icon, Row, Screen, Text, shadow } from "@/components/ui";
import { FREE_LEVELS, isFreeLevel, isPlusWorld, plusLevelCount, usePlus, usePlusReady } from "@/entitlements";
import { formatCountdown, formatTime, msToNextDaily } from "@/lib/format";
import { useClock } from "@/lib/hooks";
import { useLocale, useT } from "@/lib/i18n";
import { dailyStreak, useGameProgress, useProgress, type GameProgress } from "@/stores/progress";
import { useTheme } from "@/theme/theme";
import { alpha, fonts, radius } from "@/theme/tokens";
import { doneFor, localized, nextLevel, wonIn, type GameHomeConfig, type HomeWorld } from "./types";

/** Nombre y descripción de un mundo en el idioma activo. */
const worldText = (config: GameHomeConfig, world: HomeWorld, locale: Locale) => worldCopy(config.id, world, locale);

/**
 * Pantalla de inicio de un juego (igual que la web: components/game-home). Una sola acción
 * principal por vez: el diario si falta jugarlo; si no, seguir con los niveles. Debajo, los mundos.
 */
export function GameHome({ config: base }: { config: GameHomeConfig }) {
  const plus = usePlus();
  const plusReady = usePlusReady();
  const t = useT();
  const locale = useLocale();
  const hydrated = useProgress((s) => s.hydrated) && plusReady;
  const config = useMemo(() => (plus ? base : withPlan(base)), [base, plus]);
  const progress = useGameProgress(config.id);
  const now = useClock();
  const today = todayKey(new Date(now));
  const next = hydrated ? nextLevel(config, progress) : null;
  const dailyDone = Boolean(progress.daily[today]);

  const continueCard = !hydrated ? null : next ? (
    <ContinueCard config={config} progress={progress} next={next} highlighted={dailyDone} />
  ) : !plus && plusLevelCount(config.worlds) > 0 ? (
    <FreeDoneCard config={config} />
  ) : (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Icon name="sparkles" />
      <Text variant="bodyBold">{t("hub.allWorldsDone")}</Text>
    </Card>
  );

  return (
    <Screen>
      <Text variant="muted">{locale === "es" ? config.pitch : gameCopy(config.id, locale).tagline}</Text>
      {dailyDone ? (
        <>
          {continueCard}
          <DailyCard config={config} progress={progress} now={now} />
        </>
      ) : (
        <>
          <DailyCard config={config} progress={progress} now={now} />
          {continueCard}
        </>
      )}
      <ArchiveLink config={config} plus={plus} />
      <WorldMap config={config} progress={progress} hydrated={hydrated} initialWorld={next?.world.id ?? config.worlds[0].id} nextKey={next ? `${next.world.id}-${next.level}` : null} />
    </Screen>
  );
}

/**
 * Sin Plus se juegan solo los primeros `FREE_LEVELS` niveles del primer mundo, aunque se cumpla la regla
 * de niveles. `planLocked` distingue ese candado del de progreso, para mostrar el mensaje que corresponde.
 * Así "Seguir jugando" apunta primero a los niveles gratis y, cuando se terminan, aparece `FreeDoneCard`.
 */
function withPlan(config: GameHomeConfig): GameHomeConfig {
  const paidWorld = (w: number) => isPlusWorld(config.worlds, w);
  return {
    ...config,
    isWorldUnlocked: (w, done) => !paidWorld(w) && config.isWorldUnlocked(w, done),
    isLevelUnlocked: (w, l, done) => isFreeLevel(config.worlds, w, l) && config.isLevelUnlocked(w, l, done),
    planLocked: (w, l) => (l === undefined ? paidWorld(w) : !isFreeLevel(config.worlds, w, l)),
  };
}

/** Ya no quedan niveles gratis por jugar. Un aviso, no un muro: el diario sigue arriba. */
function FreeDoneCard({ config }: { config: GameHomeConfig }) {
  const paywall = usePlusPaywall();
  const t = useT();
  const levels = plusLevelCount(config.worlds);
  return (
    <Card style={{ gap: 10 }}>
      <Row gap={10}>
        <Icon name="sparkles" />
        <Text variant="bodyBold" style={{ flex: 1 }}>{t("hub.freeDoneTitle")}</Text>
      </Row>
      <Text variant="muted">{t("hub.freeDoneBody", { levels, game: config.name, worlds: config.worlds.length })}</Text>
      <Button title={t("hub.freeDoneAction")} icon="star" variant="outline" onPress={() => paywall("mundos")} />
    </Card>
  );
}

/** Diarios de días anteriores para practicar (Plus). */
function ArchiveLink({ config, plus }: { config: GameHomeConfig; plus: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const t = useT();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={plus ? t("hub.pastDailies") : t("hub.pastDailiesPlus")}
      onPress={() => router.push({ pathname: "/archivo/[game]", params: { game: config.id } })}
      style={({ pressed }) => [styles.archive, { borderColor: colors.border, backgroundColor: pressed ? colors.accent : "transparent" }]}
    >
      <Icon name="calendar-outline" size={20} />
      <Text variant="bodyBold" style={{ flex: 1 }}>{t("hub.pastDailies")}</Text>
      {!plus && <PlusBadge />}
      <Icon name="chevron-forward" size={18} color={colors.pencil} />
    </Pressable>
  );
}

function ContinueCard({ config, progress, next, highlighted }: { config: GameHomeConfig; progress: GameProgress; next: NonNullable<ReturnType<typeof nextLevel>>; highlighted: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const t = useT();
  const fresh = Object.keys(progress.levels).length === 0;
  const worldIndex = config.worlds.indexOf(next.world);
  const action = fresh ? t("hub.startLevels") : t("hub.keepPlaying");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("hub.continueA11y", { action, world: worldIndex + 1, level: next.level })}
      onPress={() => router.push(config.levelHref(next.world.id, next.level))}
      style={({ pressed }) => [
        styles.continue,
        { backgroundColor: colors.card, borderColor: highlighted ? colors.ink : colors.border },
        highlighted && shadow(colors.shadowInk, pressed ? 1 : 4),
        pressed && { transform: [{ translateY: 1 }] },
      ]}
    >
      <View style={[styles.levelBadge, { backgroundColor: highlighted ? colors.ink : colors.muted }]}>
        <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 20, color: highlighted ? colors.paper : colors.ink }}>{next.level}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyBold">{action}</Text>
        <Text variant="small">{t("common.worldLevel", { world: worldIndex + 1, level: next.level })}</Text>
      </View>
      <Icon name="chevron-forward" color={colors.pencil} />
    </Pressable>
  );
}

function DailyCard({ config, progress, now }: { config: GameHomeConfig; progress: GameProgress; now: number }) {
  const { colors } = useTheme();
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const { daily, article } = config;
  const today = todayKey(new Date(now));
  const number = daily.number(today);
  const played = progress.daily[today];
  const streak = dailyStreak(progress.daily, today);
  const [resume, setResume] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      daily.inProgress?.(today).then((v) => alive && setResume(v));
      return () => {
        alive = false;
      };
    }, [daily, today]),
  );

  if (!played) {
    return (
      <Animated.View entering={motion.appear()}>
        <Card raised>
          <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <Text variant="title">
              {t("hub.todayChallenge")} <Text variant="muted">#{number}</Text>
            </Text>
            {streak > 0 && <Streak days={streak} />}
          </Row>
          <Text variant="muted" style={{ marginTop: 2 }}>
            {resume ? t("hub.inProgress") : streak > 0 ? t("hub.keepStreak") : localized(daily.blurb, locale)}
          </Text>
          <Button title={resume ? t("hub.resume") : t("common.play")} icon="play" size="lg" style={{ marginTop: 14 }} onPress={() => router.push(daily.href)} />
        </Card>
      </Animated.View>
    );
  }

  const resultText = played.won ? config.resultText(played, locale) : "";
  return (
    <Animated.View entering={motion.fade()} style={[styles.dailyDone, { backgroundColor: alpha(colors.card, 0.7), borderColor: colors.border }]}>
      <Row gap={12}>
        <View style={[styles.doneDot, { backgroundColor: played.won ? colors.ok : colors.pencil }]}>
          <Icon name={played.won ? "checkmark" : "moon"} size={18} color={colors.card} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyBold">
            {t("hub.todayChallenge")} <Text variant="muted">#{number}</Text>
          </Text>
          <Text variant="small" accessibilityLabel={`${played.won ? t("hub.solved", { article }) + " " + resultText : t("hub.notSolved")}, ${formatTime(played.timeMs)}`}>
            <Text variant="small" style={{ color: colors.ink }}>{played.won ? resultText.replace(/^(en|in) /, "") : t("hub.notSolved")}</Text>
            {` · ${formatTime(played.timeMs)}`}
            {streak > 0 ? ` · 🔥 ${streak}` : ""}
          </Text>
        </View>
        <Link href={{ pathname: "/ranking", params: { juego: config.id } }} asChild>
          <Pressable accessibilityRole="link" style={styles.rankingLink} hitSlop={6}>
            <Icon name="trophy" size={18} color={colors.cluePresent} />
            <Text variant="bodyBold" style={{ fontSize: 14 }}>{t("common.ranking")}</Text>
          </Pressable>
        </Link>
      </Row>
      <Row style={[styles.dailyFooter, { borderTopColor: colors.border }]}>
        <Text variant="small" style={{ flex: 1 }}>
          {t("hub.nextIn", { article })} <Text variant="small" style={{ color: colors.ink, fontFamily: fonts.bodyBold }}>{formatCountdown(msToNextDaily(now), locale)}</Text>
        </Text>
        <Pressable accessibilityRole="link" onPress={() => router.push(daily.href)} hitSlop={8} style={{ minHeight: 44, justifyContent: "center" }}>
          <Text variant="bodyBold" style={{ fontSize: 14, textDecorationLine: "underline" }}>{t("hub.playAgain")}</Text>
        </Pressable>
      </Row>
    </Animated.View>
  );
}

function Streak({ days }: { days: number }) {
  const { colors } = useTheme();
  const t = useT();
  return (
    <View style={[styles.streak, { backgroundColor: colors.cluePresentBg }]} accessibilityLabel={t("hub.streakDays", { count: days })}>
      <Icon name="flame" size={14} color={colors.cluePresent} />
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.cluePresent }}>{days}</Text>
    </View>
  );
}

/** Mundos como pestañas y la grilla de niveles del mundo elegido. */
function WorldMap({ config, progress, hydrated, initialWorld, nextKey }: { config: GameHomeConfig; progress: GameProgress; hydrated: boolean; initialWorld: number; nextKey: string | null }) {
  const { colors } = useTheme();
  const router = useRouter();
  const [picked, setPicked] = useState<number | null>(null);
  const { worlds } = config;
  const selectedId = picked ?? initialWorld;
  const done = hydrated ? doneFor(config, progress) : () => false;
  const index = Math.max(0, worlds.findIndex((w) => w.id === selectedId));
  const world = worlds[index];
  const open = hydrated && config.isWorldUnlocked(world.id, done);
  const previous = worlds[index - 1];
  const missing = previous ? Math.max(0, world.unlockAfter - wonIn(previous, done)) : 0;
  const paid = Boolean(config.planLocked?.(world.id));
  const paywall = usePlusPaywall();
  const t = useT();
  const locale = useLocale();
  const copy = worldText(config, world, locale);

  return (
    <View style={{ marginTop: 10, gap: 10 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Text variant="label">{t("common.levels")}</Text>
        {config.howToHref && (
          <Pressable accessibilityRole="link" onPress={() => router.push(config.howToHref!)} style={styles.howTo} hitSlop={6}>
            <Icon name="help-circle-outline" size={18} color={colors.mutedForeground} />
            <Text variant="small" style={{ fontFamily: fonts.bodyBold }}>{t("hub.howItWorks")}</Text>
          </Pressable>
        )}
      </Row>

      <View accessibilityRole="tablist" style={[styles.tabs, { backgroundColor: colors.muted }]}>
        {worlds.map((w, i) => {
          const selected = w.id === world.id;
          const wOpen = hydrated && config.isWorldUnlocked(w.id, done);
          const wWon = wonIn(w, done);
          return (
            <Pressable
              key={w.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={t("hub.worldTab", { n: i + 1, name: worldText(config, w, locale).name, state: wOpen ? t("hub.worldProgress", { won: wWon, total: w.levels }) : config.planLocked?.(w.id) ? t("hub.withPlus") : t("hub.locked") })}
              onPress={() => setPicked(w.id)}
              style={[styles.tab, selected && { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Row gap={3}>
                <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 16, color: selected ? colors.ink : colors.mutedForeground }}>{i + 1}</Text>
                {hydrated && !wOpen && (config.planLocked?.(w.id) ? <Icon name="star" size={11} color={colors.cluePresent} /> : <Icon name="lock-closed" size={11} color={colors.mutedForeground} />)}
              </Row>
              <View style={[styles.bar, { backgroundColor: alpha(colors.border, 0.7) }]}>
                <View style={{ height: "100%", width: `${(wWon / w.levels) * 100}%`, backgroundColor: colors.ok, borderRadius: 2 }} />
              </View>
            </Pressable>
          );
        })}
      </View>

      <Row style={{ justifyContent: "space-between" }}>
        <Text variant="title" style={{ fontSize: 18, flex: 1 }} numberOfLines={1}>{copy.name}</Text>
        <Text variant="small">
          <Text variant="small" style={{ color: colors.ink, fontFamily: fonts.bodyBold }}>{hydrated ? wonIn(world, done) : "–"}</Text>/{world.levels}
        </Text>
      </Row>
      {hydrated && paid && (
        <View style={[styles.locked, { backgroundColor: colors.cluePresentBg, alignItems: "center" }]}>
          <Icon name="star" size={14} color={colors.cluePresent} />
          <Text variant="small" style={{ flex: 1, color: colors.cluePresent }}>{t("hub.plusWorld")}</Text>
          <Pressable accessibilityRole="button" onPress={() => paywall("mundos")} hitSlop={6} style={{ minHeight: 44, justifyContent: "center" }}>
            <Text variant="small" style={{ fontFamily: fonts.bodyBold, color: colors.cluePresent, textDecorationLine: "underline" }}>{t("hub.seePlus")}</Text>
          </Pressable>
        </View>
      )}
      {hydrated && !paid && config.planLocked && (
        <View style={[styles.locked, { backgroundColor: colors.cluePresentBg, alignItems: "center" }]}>
          <Icon name="star" size={14} color={colors.cluePresent} />
          <Text variant="small" style={{ flex: 1, color: colors.cluePresent }}>{t("hub.freeLevels", { count: FREE_LEVELS })}</Text>
          <Pressable accessibilityRole="button" onPress={() => paywall("mundos")} hitSlop={6} style={{ minHeight: 44, justifyContent: "center" }}>
            <Text variant="small" style={{ fontFamily: fonts.bodyBold, color: colors.cluePresent, textDecorationLine: "underline" }}>{t("hub.seePlus")}</Text>
          </Pressable>
        </View>
      )}
      {hydrated && !open && !paid && (
        <View style={[styles.locked, { backgroundColor: colors.muted }]}>
          <Icon name="lock-closed" size={14} color={colors.mutedForeground} />
          <Text variant="small" style={{ flex: 1 }}>
            {t("hub.unlocksAfter", { count: world.unlockAfter, world: previous ? worldText(config, previous, locale).name : "" })}{" "}
            <Text variant="small" style={{ color: colors.ink, fontFamily: fonts.bodyBold }}>{t("hub.missing", { count: missing })}</Text>
          </Text>
        </View>
      )}
      {open && <Text variant="small">{copy.description}</Text>}

      <View style={styles.grid}>
        {Array.from({ length: world.levels }, (_, i) => (
          <LevelCell key={`${world.id}-${i}`} config={config} progress={progress} hydrated={hydrated} worldId={world.id} n={i + 1} done={done} next={nextKey === `${world.id}-${i + 1}`} onLocked={config.planLocked?.(world.id, i + 1) ? () => paywall("mundos") : undefined} badge={!paid && Boolean(config.planLocked?.(world.id, i + 1))} />
        ))}
      </View>
    </View>
  );
}

function LevelCell({ config, progress, hydrated, worldId, n, done, next, onLocked, badge }: { config: GameHomeConfig; progress: GameProgress; hydrated: boolean; worldId: number; n: number; done: (w: number, l: number) => boolean; next: boolean; /** Nivel de Plus: tocarlo abre Plus. */ onLocked?: () => void; /** Estrellita de Plus en la esquina (en el mundo con niveles gratis). */ badge?: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const result = hydrated ? progress.levels[config.levelKey(worldId, n)] : undefined;
  const won = Boolean(result?.won);
  const tried = Boolean(result && !result.won);
  const unlocked = hydrated && config.isLevelUnlocked(worldId, n, done);
  const stars = won ? config.stars(result!) : 0;
  const thumb = won ? config.thumbnail?.(worldId, n) : null;
  const title = won ? config.levelTitle?.(worldId, n, locale) : "";

  const cell = [
    styles.cell,
    !hydrated && { backgroundColor: alpha(colors.muted, 0.6), borderColor: "transparent" },
    won && { borderColor: colors.ink, backgroundColor: colors.tile },
    next && { backgroundColor: colors.ink, borderColor: colors.ink, ...shadow(colors.shadowInk, 3) },
    tried && !next && { borderColor: colors.margin },
    !won && !tried && !next && unlocked && { borderColor: colors.border, backgroundColor: colors.card },
    hydrated && !unlocked && { borderColor: "transparent" },
  ];
  const color = next ? colors.paper : tried ? colors.margin : !unlocked ? alpha(colors.pencil, 0.4) : colors.ink;
  const label = `${t("common.level", { n })}${title ? `, ${title}` : ""}${won ? t("hub.cellSolved", { result: config.resultText(result!, locale) }) : tried ? t("hub.cellUnsolved") : ""}${next ? t("hub.cellNext") : ""}${!unlocked ? (onLocked ? t("hub.cellPlus") : t("hub.cellLocked")) : ""}`;

  return (
    <View style={styles.cellWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !unlocked && !onLocked }}
        disabled={!unlocked && !onLocked}
        onPress={() => (unlocked ? router.push(config.levelHref(worldId, n)) : onLocked?.())}
        style={({ pressed }) => [...cell, pressed && { transform: [{ scale: 0.95 }] }]}
      >
        {thumb ?? <Text style={{ fontFamily: fonts.display, fontSize: unlocked ? 16 : 14, color }}>{n}</Text>}
        {hydrated && badge && !unlocked && (
          <View style={[styles.plusDot, { backgroundColor: colors.cluePresentBg }]}>
            <Icon name="star" size={8} color={colors.cluePresent} />
          </View>
        )}
        {won && (
          <View style={styles.stars}>
            {[0, 1, 2].map((k) => (
              <View key={k} style={[styles.star, { backgroundColor: k < stars ? colors.ok : colors.border }]} />
            ))}
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  archive: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 52, borderWidth: 1, borderRadius: radius.xl, paddingHorizontal: 14 },
  continue: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 2, borderRadius: radius.xl, padding: 10, paddingRight: 12 },
  levelBadge: { width: 48, height: 48, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  dailyDone: { borderRadius: radius.xl, borderWidth: 1, paddingVertical: 8, paddingLeft: 12, paddingRight: 8 },
  doneDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  rankingLink: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, paddingHorizontal: 8 },
  dailyFooter: { marginTop: 4, paddingTop: 2, paddingLeft: 48, borderTopWidth: 1, borderStyle: "dashed", justifyContent: "space-between" },
  streak: { flexDirection: "row", alignItems: "center", gap: 2, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  howTo: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44 },
  tabs: { flexDirection: "row", gap: 4, borderRadius: radius.xl, padding: 4 },
  tab: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 5, borderRadius: radius.lg, borderWidth: 1, borderColor: "transparent" },
  bar: { height: 4, width: "60%", borderRadius: 2, overflow: "hidden" },
  locked: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: radius.lg, padding: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 },
  cellWrap: { width: `${100 / 6}%`, padding: 3 },
  cell: { aspectRatio: 1, minHeight: 44, borderRadius: radius.md, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  stars: { position: "absolute", bottom: 3, flexDirection: "row", gap: 2 },
  star: { width: 5, height: 5, borderRadius: 3 },
  plusDot: { position: "absolute", top: 2, right: 2, width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center" },
});
