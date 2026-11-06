import { todayKey } from "@cranea/core";
import { useConvexAuth, useMutation } from "convex/react";
import { Stack, useRouter, type Href } from "expo-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { motion } from "@/lib/motion";
import { useAccountReady } from "@/account/progress-sync";
import { PlusNudge } from "@/components/plus-nudge";
import { ProtectorBadge } from "@/components/protectors";
import { ReminderOffer } from "@/components/reminder";
import { Button, Card, Icon, Loading, Row, Screen, Text } from "@/components/ui";
import { api, accountsEnabled } from "@/lib/convex";
import { formatTime } from "@/lib/format";
import { useClock } from "@/lib/hooks";
import { useT, type T } from "@/lib/i18n";
import { isAssisted } from "@/monetization/extra-attempt";
import { dailyStreak, useProgress, type Result } from "@/stores/progress";
import { useTheme } from "@/theme/theme";

/** Sin conexión la cuenta puede no responder: no se bloquea el diario para siempre. */
const ACCOUNT_WAIT_MS = 4000;

interface Props {
  gameId: string;
  /** Nombre del juego, para "Volver a …". */
  game: string;
  home: Href;
  title: (date: string) => string;
  /** La solución de hoy, para mostrar cuando ya se jugó. */
  reveal?: (date: string) => ReactNode;
  /** `practice`: repetición de un diario ya jugado, que no se guarda ni cuenta para el ranking. */
  children: (date: string, practice: boolean) => ReactNode;
}

/**
 * Misma semántica que la web (components/daily-gate.tsx): el diario cuenta una sola vez por día.
 * Antes del tablero espera el progreso del dispositivo y el de la cuenta, así una repetición desde
 * otro dispositivo no pasa por primera partida. La primera partida con sesión abre el intento oficial
 * (`ranking.startDaily`); ya jugado, se puede repetir como práctica, que no se guarda.
 */
export function DailyGate({ gameId, game, home, title, reveal, children }: Props) {
  const hydrated = useProgress((s) => s.hydrated);
  const accountReady = useAccountReady((s) => s.ready);
  const [waited, setWaited] = useState(false);
  const [entry, setEntry] = useState<{ date: string; played: Result | null } | null>(null);
  const [practice, setPractice] = useState(false);
  const t = useT();
  const ready = hydrated && (!accountsEnabled || accountReady || waited);

  useEffect(() => {
    const t = setTimeout(() => setWaited(true), ACCOUNT_WAIT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready || entry) return;
    const date = todayKey();
    setEntry({ date, played: useProgress.getState().games[gameId]?.daily[date] ?? null });
  }, [ready, entry, gameId]);

  if (!entry) return <Loading label={hydrated && !ready ? t("hub.findingGames") : t("hub.preparingBoard")} />;

  if (!entry.played) {
    return (
      <>
        {accountsEnabled && <OfficialStart gameId={gameId} date={entry.date} />}
        {children(entry.date, false)}
      </>
    );
  }
  if (practice) return <>{children(entry.date, true)}</>;
  return (
    <DailyDone
      gameId={gameId}
      game={game}
      home={home}
      date={entry.date}
      title={title(entry.date)}
      result={entry.played}
      reveal={reveal?.(entry.date)}
      onPractice={() => setPractice(true)}
      onNewDay={() => setEntry(null)}
    />
  );
}

/** Con sesión, el servidor anota cuándo se abrió el tablero: ese es el intento oficial para el ranking. */
function OfficialStart({ gameId, date }: { gameId: string; date: string }) {
  const { isAuthenticated } = useConvexAuth();
  const start = useMutation(api.ranking.startDaily);
  const sent = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || sent.current) return;
    sent.current = true;
    start({ gameId, date }).catch(() => {
      sent.current = false;
    });
  }, [isAuthenticated, start, gameId, date]);
  return null;
}

/** Aviso arriba del tablero del diario: práctica, o que sin sesión no entra al ranking. */
export function DailyNotice({ practice }: { practice: boolean }) {
  const t = useT();
  if (practice) return <NoticeText icon="refresh" text={t("hub.practiceNotice")} />;
  return accountsEnabled ? <SignedOutNotice /> : null;
}

function SignedOutNotice() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const t = useT();
  if (isLoading || isAuthenticated) return null;
  return <NoticeText icon="person-outline" text={t("hub.signedOutNotice")} />;
}

function NoticeText({ icon, text }: { icon: "refresh" | "person-outline"; text: string }) {
  const { colors } = useTheme();
  return (
    <Row gap={6} style={{ marginBottom: -4 }}>
      <Icon name={icon} size={14} color={colors.mutedForeground} />
      <Text variant="small" style={{ flex: 1 }} accessibilityRole="text">{text}</Text>
    </Row>
  );
}

function untilTomorrow(now: number, t: T) {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  const min = Math.max(1, Math.ceil((next.getTime() - now) / 60_000));
  const h = Math.floor(min / 60);
  return h ? t("hub.durationHm", { h, m: min % 60 }) : t("hub.countdownM", { m: min });
}

function DailyDone({ gameId, game, home, date, title, result, reveal, onPractice, onNewDay }: {
  gameId: string; game: string; home: Href; date: string; title: string; result: Result; reveal?: ReactNode; onPractice: () => void; onNewDay: () => void;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const t = useT();
  const streak = useProgress((s) => dailyStreak(s.games[gameId]?.daily ?? {}, date));
  const now = useClock();
  const tomorrow = todayKey(new Date(now)) !== date;

  return (
    <Screen>
      {/* El título ("Puentes del día #2") va en la barra, no repetido en la pantalla. */}
      <Stack.Screen options={{ title }} />
      <Animated.View entering={motion.appear()}>
        <Card raised>
          <Row gap={12}>
            <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: result.won ? colors.clueExactBg : colors.muted }}>
              <Icon name={result.won ? "checkmark" : "close"} size={24} color={result.won ? colors.clueExact : colors.margin} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="title" style={{ fontSize: 20 }}>{result.won ? t("hub.alreadySolved") : t("hub.notToday")}</Text>
              <Text variant="small">
                {result.won
                  ? `${isAssisted(gameId, result.attempts) ? t("hub.extraAttemptUsed") : t("common.attempts", { count: result.attempts })} · ${formatTime(result.timeMs)}`
                  : t("hub.firstGameCounts")}
              </Text>
            </View>
          </Row>
          {reveal && <View style={{ marginTop: 18, alignItems: "center" }}>{reveal}</View>}
          <Row style={{ marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border }} gap={0}>
            <View style={{ flex: 1 }}>
              <Text variant="small">{t("common.streak")}</Text>
              <Row gap={4}>
                <Icon name="flame" size={16} color={colors.margin} />
                <Text variant="title" style={{ fontSize: 18 }}>{t("common.days", { count: streak })}</Text>
                <ProtectorBadge />
              </Row>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="small">{t("hub.nextDaily")}</Text>
              <Text variant="title" style={{ fontSize: 18 }}>{tomorrow ? t("hub.nextReady") : t("hub.inTime", { time: untilTomorrow(now, t) })}</Text>
            </View>
          </Row>
        </Card>
      </Animated.View>
      <ReminderOffer />
      <View style={{ gap: 8 }}>
        {tomorrow ? (
          <Button title={t("hub.playToday")} size="lg" onPress={onNewDay} />
        ) : (
          <Button title={t("hub.seeDailyRanking")} size="lg" icon="trophy" onPress={() => router.push({ pathname: "/ranking", params: { juego: gameId } })} />
        )}
        {!tomorrow && <Button title={t("hub.practiceAgain")} variant="outline" size="lg" icon="refresh" onPress={onPractice} />}
        <Button title={t("hub.backTo", { game })} variant="ghost" size="lg" onPress={() => router.navigate(home)} />
      </View>
      <PlusNudge gameId={gameId} mode={{ kind: "daily", date }} won />
    </Screen>
  );
}
