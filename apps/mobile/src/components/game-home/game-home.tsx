import { todayKey } from "@cranea/core";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { PlusBadge, usePlusPaywall } from "@/components/plus";
import { Button, Card, Icon, Row, Screen, Text, shadow } from "@/components/ui";
import { isFreeWorld, usePlus, usePlusReady } from "@/entitlements";
import { formatCountdown, formatTime, msToNextDaily } from "@/lib/format";
import { useClock } from "@/lib/hooks";
import { dailyStreak, useGameProgress, useProgress, type GameProgress } from "@/stores/progress";
import { useTheme } from "@/theme/theme";
import { alpha, fonts, radius } from "@/theme/tokens";
import { doneFor, nextLevel, wonIn, type GameHomeConfig } from "./types";

/**
 * Pantalla de inicio de un juego (igual que la web: components/game-home). Una sola acción
 * principal por vez: el diario si falta jugarlo; si no, seguir con los niveles. Debajo, los mundos.
 */
export function GameHome({ config: base }: { config: GameHomeConfig }) {
  const plus = usePlus();
  const plusReady = usePlusReady();
  const hydrated = useProgress((s) => s.hydrated) && plusReady;
  const config = useMemo(() => (plus ? base : withPlan(base)), [base, plus]);
  const progress = useGameProgress(config.id);
  const now = useClock();
  const today = todayKey(new Date(now));
  const next = hydrated ? nextLevel(config, progress) : null;
  const dailyDone = Boolean(progress.daily[today]);

  const continueCard = !hydrated ? null : next ? (
    <ContinueCard config={config} progress={progress} next={next} highlighted={dailyDone} />
  ) : !plus && config.worlds.some((w) => !isFreeWorld(config.worlds, w.id)) ? (
    <FreeDoneCard config={config} />
  ) : (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Icon name="sparkles" />
      <Text variant="bodyBold">Completaste todos los mundos.</Text>
    </Card>
  );

  return (
    <Screen>
      <Text variant="muted">{config.pitch}</Text>
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
 * Sin Plus, los mundos después de los gratis no se abren aunque se cumpla la regla de niveles.
 * `planLocked` distingue ese candado del de progreso, para mostrar el mensaje que corresponde.
 */
function withPlan(config: GameHomeConfig): GameHomeConfig {
  const free = (w: number) => isFreeWorld(config.worlds, w);
  return {
    ...config,
    isWorldUnlocked: (w, done) => free(w) && config.isWorldUnlocked(w, done),
    isLevelUnlocked: (w, l, done) => free(w) && config.isLevelUnlocked(w, l, done),
    planLocked: (w) => !free(w),
  };
}

/** Ya no quedan niveles gratis por jugar. Un aviso, no un muro: el diario sigue arriba. */
function FreeDoneCard({ config }: { config: GameHomeConfig }) {
  const paywall = usePlusPaywall();
  const more = config.worlds.filter((w) => !isFreeWorld(config.worlds, w.id));
  const levels = more.reduce((n, w) => n + w.levels, 0);
  return (
    <Card style={{ gap: 10 }}>
      <Row gap={10}>
        <Icon name="sparkles" />
        <Text variant="bodyBold" style={{ flex: 1 }}>Completaste los niveles gratis.</Text>
      </Row>
      <Text variant="muted">
        Con Craneá Plus seguís con {more.length === 1 ? "un mundo más" : `${more.length} mundos más`} ({levels} niveles).
      </Text>
      <Button title="Conocer Craneá Plus" icon="star" variant="outline" onPress={() => paywall("mundos")} />
    </Card>
  );
}

/** Diarios de días anteriores para practicar (Plus). */
function ArchiveLink({ config, plus }: { config: GameHomeConfig; plus: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Diarios anteriores${plus ? "" : ", con Craneá Plus"}`}
      onPress={() => router.push({ pathname: "/archivo/[game]", params: { game: config.id } })}
      style={({ pressed }) => [styles.archive, { borderColor: colors.border, backgroundColor: pressed ? colors.accent : "transparent" }]}
    >
      <Icon name="calendar-outline" size={20} />
      <Text variant="bodyBold" style={{ flex: 1 }}>Diarios anteriores</Text>
      {!plus && <PlusBadge />}
      <Icon name="chevron-forward" size={18} color={colors.pencil} />
    </Pressable>
  );
}

function ContinueCard({ config, progress, next, highlighted }: { config: GameHomeConfig; progress: GameProgress; next: NonNullable<ReturnType<typeof nextLevel>>; highlighted: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const fresh = Object.keys(progress.levels).length === 0;
  const worldIndex = config.worlds.indexOf(next.world);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${fresh ? "Empezar los niveles" : "Seguir jugando"}: mundo ${worldIndex + 1}, nivel ${next.level}`}
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
        <Text variant="bodyBold">{fresh ? "Empezar los niveles" : "Seguir jugando"}</Text>
        <Text variant="small">
          Mundo {worldIndex + 1} · Nivel {next.level}
        </Text>
      </View>
      <Icon name="chevron-forward" color={colors.pencil} />
    </Pressable>
  );
}

function DailyCard({ config, progress, now }: { config: GameHomeConfig; progress: GameProgress; now: number }) {
  const { colors } = useTheme();
  const router = useRouter();
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
      <Animated.View entering={FadeInDown.duration(260)}>
        <Card raised>
          <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <Text variant="title">
              Desafío de hoy <Text variant="muted">#{number}</Text>
            </Text>
            {streak > 0 && <Streak days={streak} />}
          </Row>
          <Text variant="muted" style={{ marginTop: 2 }}>
            {resume ? "Tenés una partida empezada." : streak > 0 ? "Jugalo para no cortar la racha." : daily.blurb}
          </Text>
          <Button title={resume ? "Seguir" : "Jugar"} icon="play" size="lg" style={{ marginTop: 14 }} onPress={() => router.push(daily.href)} />
        </Card>
      </Animated.View>
    );
  }

  const fem = article === "la";
  return (
    <Animated.View entering={FadeIn.duration(200)} style={[styles.dailyDone, { backgroundColor: alpha(colors.card, 0.7), borderColor: colors.border }]}>
      <Row gap={12}>
        <View style={[styles.doneDot, { backgroundColor: played.won ? colors.ok : colors.pencil }]}>
          <Icon name={played.won ? "checkmark" : "moon"} size={18} color={colors.card} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyBold">
            Desafío de hoy <Text variant="muted">#{number}</Text>
          </Text>
          <Text variant="small" accessibilityLabel={`${played.won ? (fem ? "Resuelta" : "Resuelto") + " " + config.resultText(played) : "No salió"}, ${formatTime(played.timeMs)}`}>
            <Text variant="small" style={{ color: colors.ink }}>{played.won ? config.resultText(played).replace(/^en /, "") : "No salió"}</Text>
            {` · ${formatTime(played.timeMs)}`}
            {streak > 0 ? ` · 🔥 ${streak}` : ""}
          </Text>
        </View>
        <Link href={{ pathname: "/ranking", params: { juego: config.id } }} asChild>
          <Pressable accessibilityRole="link" style={styles.rankingLink} hitSlop={6}>
            <Icon name="trophy" size={18} color={colors.cluePresent} />
            <Text variant="bodyBold" style={{ fontSize: 14 }}>Ranking</Text>
          </Pressable>
        </Link>
      </Row>
      <Row style={[styles.dailyFooter, { borderTopColor: colors.border }]}>
        <Text variant="small" style={{ flex: 1 }}>
          {fem ? "La próxima" : "El próximo"} en <Text variant="small" style={{ color: colors.ink, fontFamily: fonts.bodyBold }}>{formatCountdown(msToNextDaily(now))}</Text>
        </Text>
        <Pressable accessibilityRole="link" onPress={() => router.push(daily.href)} hitSlop={8} style={{ minHeight: 44, justifyContent: "center" }}>
          <Text variant="bodyBold" style={{ fontSize: 14, textDecorationLine: "underline" }}>Jugar de nuevo</Text>
        </Pressable>
      </Row>
    </Animated.View>
  );
}

function Streak({ days }: { days: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.streak, { backgroundColor: colors.cluePresentBg }]} accessibilityLabel={`${days} ${days === 1 ? "día" : "días"} de racha`}>
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

  return (
    <View style={{ marginTop: 10, gap: 10 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Text variant="label">Niveles</Text>
        {config.howToHref && (
          <Pressable accessibilityRole="link" onPress={() => router.push(config.howToHref!)} style={styles.howTo} hitSlop={6}>
            <Icon name="help-circle-outline" size={18} color={colors.mutedForeground} />
            <Text variant="small" style={{ fontFamily: fonts.bodyBold }}>Cómo se juega</Text>
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
              accessibilityLabel={`Mundo ${i + 1}: ${w.name}. ${wOpen ? `${wWon} de ${w.levels}` : config.planLocked?.(w.id) ? "con Craneá Plus" : "bloqueado"}`}
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
        <Text variant="title" style={{ fontSize: 18, flex: 1 }} numberOfLines={1}>{world.name}</Text>
        <Text variant="small">
          <Text variant="small" style={{ color: colors.ink, fontFamily: fonts.bodyBold }}>{hydrated ? wonIn(world, done) : "–"}</Text>/{world.levels}
        </Text>
      </Row>
      {hydrated && paid && (
        <View style={[styles.locked, { backgroundColor: colors.cluePresentBg, alignItems: "center" }]}>
          <Icon name="star" size={14} color={colors.cluePresent} />
          <Text variant="small" style={{ flex: 1, color: colors.cluePresent }}>Este mundo es parte de Craneá Plus.</Text>
          <Pressable accessibilityRole="button" onPress={() => paywall("mundos")} hitSlop={6} style={{ minHeight: 44, justifyContent: "center" }}>
            <Text variant="small" style={{ fontFamily: fonts.bodyBold, color: colors.cluePresent, textDecorationLine: "underline" }}>Ver Plus</Text>
          </Pressable>
        </View>
      )}
      {hydrated && !open && !paid && (
        <View style={[styles.locked, { backgroundColor: colors.muted }]}>
          <Icon name="lock-closed" size={14} color={colors.mutedForeground} />
          <Text variant="small" style={{ flex: 1 }}>
            Se abre con {world.unlockAfter} niveles de «{previous?.name}».{" "}
            <Text variant="small" style={{ color: colors.ink, fontFamily: fonts.bodyBold }}>Te {missing === 1 ? "falta" : "faltan"} {missing}.</Text>
          </Text>
        </View>
      )}
      {open && <Text variant="small">{world.description}</Text>}

      <View style={styles.grid}>
        {Array.from({ length: world.levels }, (_, i) => (
          <LevelCell key={`${world.id}-${i}`} config={config} progress={progress} hydrated={hydrated} worldId={world.id} n={i + 1} done={done} next={nextKey === `${world.id}-${i + 1}`} onLocked={paid ? () => paywall("mundos") : undefined} />
        ))}
      </View>
    </View>
  );
}

function LevelCell({ config, progress, hydrated, worldId, n, done, next, onLocked }: { config: GameHomeConfig; progress: GameProgress; hydrated: boolean; worldId: number; n: number; done: (w: number, l: number) => boolean; next: boolean; /** Mundo de Plus: tocar un nivel abre Plus. */ onLocked?: () => void }) {
  const { colors } = useTheme();
  const router = useRouter();
  const result = hydrated ? progress.levels[config.levelKey(worldId, n)] : undefined;
  const won = Boolean(result?.won);
  const tried = Boolean(result && !result.won);
  const unlocked = hydrated && config.isLevelUnlocked(worldId, n, done);
  const stars = won ? config.stars(result!) : 0;

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
  const label = `Nivel ${n}${won ? `, resuelto ${config.resultText(result!)}` : tried ? ", sin resolver" : ""}${next ? ", el próximo" : ""}${!unlocked ? (onLocked ? ", con Craneá Plus" : ", bloqueado") : ""}`;

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
        <Text style={{ fontFamily: fonts.display, fontSize: unlocked ? 16 : 14, color }}>{n}</Text>
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
});
