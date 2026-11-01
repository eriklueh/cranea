import { todayKey } from "@cranea/core";
import { useConvexAuth, useMutation } from "convex/react";
import { Stack, useRouter, type Href } from "expo-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAccountReady } from "@/account/progress-sync";
import { Button, Card, Icon, Loading, Row, Screen, Text } from "@/components/ui";
import { api, accountsEnabled } from "@/lib/convex";
import { formatTime } from "@/lib/format";
import { useClock } from "@/lib/hooks";
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

  if (!entry) return <Loading label={hydrated && !ready ? "Buscando tus partidas…" : "Preparando el tablero…"} />;

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
  if (practice) return <NoticeText icon="refresh" text="Práctica: no se guarda ni cuenta para el ranking." />;
  return accountsEnabled ? <SignedOutNotice /> : null;
}

function SignedOutNotice() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  if (isLoading || isAuthenticated) return null;
  return <NoticeText icon="person-outline" text="Jugás sin sesión: este diario no va a entrar al ranking." />;
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

function untilTomorrow(now: number) {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  const min = Math.max(1, Math.ceil((next.getTime() - now) / 60_000));
  const h = Math.floor(min / 60);
  return h ? `${h} h ${min % 60} min` : `${min} min`;
}

function DailyDone({ gameId, game, home, date, title, result, reveal, onPractice, onNewDay }: {
  gameId: string; game: string; home: Href; date: string; title: string; result: Result; reveal?: ReactNode; onPractice: () => void; onNewDay: () => void;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const streak = useProgress((s) => dailyStreak(s.games[gameId]?.daily ?? {}, date));
  const now = useClock();
  const tomorrow = todayKey(new Date(now)) !== date;

  return (
    <Screen>
      {/* El título ("Puentes del día #2") va en la barra, no repetido en la pantalla. */}
      <Stack.Screen options={{ title }} />
      <Animated.View entering={FadeInDown.duration(260)}>
        <Card raised>
          <Row gap={12}>
            <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: result.won ? colors.clueExactBg : colors.muted }}>
              <Icon name={result.won ? "checkmark" : "close"} size={24} color={result.won ? colors.clueExact : colors.margin} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="title" style={{ fontSize: 20 }}>{result.won ? "Ya lo resolviste" : "Hoy no salió"}</Text>
              <Text variant="small">
                {result.won
                  ? `${isAssisted(gameId, result.attempts) ? "Con un intento extra" : `${result.attempts} ${result.attempts === 1 ? "intento" : "intentos"}`} · ${formatTime(result.timeMs)}`
                  : "Para el ranking cuenta la primera partida."}
              </Text>
            </View>
          </Row>
          {reveal && <View style={{ marginTop: 18, alignItems: "center" }}>{reveal}</View>}
          <Row style={{ marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border }} gap={0}>
            <View style={{ flex: 1 }}>
              <Text variant="small">Racha</Text>
              <Row gap={4}>
                <Icon name="flame" size={16} color={colors.margin} />
                <Text variant="title" style={{ fontSize: 18 }}>{streak} {streak === 1 ? "día" : "días"}</Text>
              </Row>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="small">Próximo diario</Text>
              <Text variant="title" style={{ fontSize: 18 }}>{tomorrow ? "¡Ya está!" : `en ${untilTomorrow(now)}`}</Text>
            </View>
          </Row>
        </Card>
      </Animated.View>
      <View style={{ gap: 8 }}>
        {tomorrow ? (
          <Button title="Jugar el de hoy" size="lg" onPress={onNewDay} />
        ) : (
          <Button title="Ver ranking del día" size="lg" icon="trophy" onPress={() => router.push({ pathname: "/ranking", params: { juego: gameId } })} />
        )}
        {!tomorrow && <Button title="Jugar de nuevo (práctica)" variant="outline" size="lg" icon="refresh" onPress={onPractice} />}
        <Button title={`Volver a ${game}`} variant="ghost" size="lg" onPress={() => router.navigate(home)} />
      </View>
    </Screen>
  );
}
