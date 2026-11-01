import { router } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, Linking, Pressable, StyleSheet, Switch, View } from "react-native";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { Button, Card, Icon, Row, Text } from "@/components/ui";
import {
  disableReminder,
  enableReminder,
  formatMinutes,
  onReminderTap,
  remindersAvailable,
  rescheduleReminders,
  useReminder,
} from "@/notifications/reminder";
import { useProgress } from "@/stores/progress";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";

/**
 * Mantiene programados los avisos: al abrir, al volver al frente, al guardar un diario y al cambiar
 * la hora. Al tocar un aviso abre el inicio. Va una vez en la app.
 */
export function ReminderScheduler() {
  const progressHydrated = useProgress((s) => s.hydrated);
  const reminderHydrated = useReminder((s) => s.hydrated);
  const enabled = useReminder((s) => s.enabled);
  const minutes = useReminder((s) => s.minutes);

  useEffect(() => onReminderTap(() => router.navigate("/")), []);

  useEffect(() => {
    if (!progressHydrated || !reminderHydrated) return;
    void rescheduleReminders();
    const app = AppState.addEventListener("change", (s) => s === "active" && void rescheduleReminders());
    const unsubscribe = useProgress.subscribe((s, prev) => {
      if (s.games !== prev.games || s.protectors !== prev.protectors) void rescheduleReminders();
    });
    return () => {
      app.remove();
      unsubscribe();
    };
  }, [progressHydrated, reminderHydrated, enabled, minutes]);

  return null;
}

const STEP = 15;
const wrap = (m: number) => (m + 24 * 60) % (24 * 60);

/** Elegir la hora: horas y cuartos de hora, con botones grandes para el dedo. */
function TimePicker({ minutes, onChange }: { minutes: number; onChange: (m: number) => void }) {
  const { colors } = useTheme();
  const btn = (icon: "remove" | "add", label: string, delta: number) => (
    <Pressable
      onPress={() => onChange(wrap(minutes + delta))}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.step, { borderColor: colors.border, backgroundColor: pressed ? colors.accent : colors.card }]}
    >
      <Icon name={icon} size={22} />
    </Pressable>
  );
  return (
    <Row gap={6} style={{ justifyContent: "center" }} accessibilityRole="adjustable" accessibilityLabel={`Hora del aviso: ${formatMinutes(minutes)}`}>
      {btn("remove", "Una hora antes", -60)}
      {btn("remove", "Un cuarto de hora antes", -STEP)}
      <Text style={{ minWidth: 84, textAlign: "center", fontFamily: fonts.displayHeavy, fontSize: 32, color: colors.ink }}>{formatMinutes(minutes)}</Text>
      {btn("add", "Un cuarto de hora después", STEP)}
      {btn("add", "Una hora después", 60)}
    </Row>
  );
}

function deniedText() {
  return "Las notificaciones están apagadas para Craneá. Prendelas en los ajustes del teléfono.";
}

/** Para la pantalla de cuenta/ajustes. */
export function ReminderSettings() {
  const { colors } = useTheme();
  const hydrated = useReminder((s) => s.hydrated);
  const enabled = useReminder((s) => s.enabled);
  const minutes = useReminder((s) => s.minutes);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const available = remindersAvailable();

  const toggle = async (on: boolean) => {
    setBusy(true);
    setDenied(false);
    if (on) setDenied((await enableReminder(minutes)) === "denied");
    else await disableReminder();
    setBusy(false);
  };

  return (
    <View style={{ gap: 8 }}>
      <Text variant="label">Recordatorio</Text>
      <Card style={{ gap: 12 }}>
        <Row gap={12}>
          <Icon name="notifications-outline" size={22} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyBold">Aviso del diario</Text>
            <Text variant="small">
              {!available
                ? "Los avisos funcionan en la app instalada (no en Expo Go)."
                : enabled
                  ? `Todos los días a las ${formatMinutes(minutes)}, si todavía no jugaste.`
                  : "Un aviso por día, solo si todavía no jugaste."}
            </Text>
          </View>
          <Switch
            value={enabled && available}
            disabled={!available || !hydrated || busy}
            onValueChange={(v) => void toggle(v)}
            accessibilityLabel="Aviso del diario"
            trackColor={{ true: colors.primary }}
          />
        </Row>
        {enabled && available && <TimePicker minutes={minutes} onChange={(m) => useReminder.getState().set({ minutes: m })} />}
        {denied && <DeniedNote />}
      </Card>
    </View>
  );
}

function DeniedNote() {
  return (
    <View style={{ gap: 6 }}>
      <Text variant="small">{deniedText()}</Text>
      <Button title="Abrir ajustes" variant="outline" icon="settings-outline" onPress={() => void Linking.openSettings()} />
    </View>
  );
}

/**
 * "¿Te aviso mañana?": se ofrece una sola vez, después del primer diario. Tranquilo: una tarjeta,
 * no un cartel encima del juego.
 */
export function ReminderOffer() {
  const { colors } = useTheme();
  const hydrated = useReminder((s) => s.hydrated);
  const offered = useReminder((s) => s.offered);
  const enabled = useReminder((s) => s.enabled);
  const playedAny = useProgress((s) => s.hydrated && Object.values(s.games).some((g) => Object.keys(g.daily).length > 0));
  const [minutes, setMinutes] = useState(() => useReminder.getState().minutes);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  if (!hydrated || !remindersAvailable() || !playedAny || enabled || (offered && !denied)) return null;

  const accept = async () => {
    setBusy(true);
    const r = await enableReminder(minutes);
    setBusy(false);
    if (r === "denied") {
      useReminder.getState().set({ offered: true });
      setDenied(true);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(260)} exiting={FadeOut.duration(150)}>
      <Card raised style={{ gap: 12 }}>
        <Row gap={12} style={{ alignItems: "flex-start" }}>
          <View style={[styles.bell, { backgroundColor: colors.muted }]}>
            <Icon name="notifications" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="title" style={{ fontSize: 20 }}>¿Te aviso mañana?</Text>
            <Text variant="muted">
              {denied ? deniedText() : `Un aviso por día a las ${formatMinutes(minutes)}, para no cortar la racha. Si ya jugaste, no te molesto.`}
            </Text>
          </View>
        </Row>
        {denied ? (
          <Row gap={8}>
            <Button title="Abrir ajustes" variant="outline" style={{ flex: 1 }} onPress={() => void Linking.openSettings()} />
            <Button title="Ahora no" variant="ghost" onPress={() => setDenied(false)} />
          </Row>
        ) : (
          <>
            {picking && <TimePicker minutes={minutes} onChange={setMinutes} />}
            <Row gap={8} style={{ flexWrap: "wrap" }}>
              <Button title="Sí, avisame" icon="checkmark" loading={busy} style={{ flexGrow: 1 }} onPress={() => void accept()} />
              {!picking && <Button title="Otra hora" variant="outline" onPress={() => setPicking(true)} />}
            </Row>
            <Pressable
              onPress={() => useReminder.getState().set({ offered: true })}
              accessibilityRole="button"
              style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }}
            >
              <Text variant="bodyBold" style={{ color: colors.mutedForeground }}>No, gracias</Text>
            </Pressable>
          </>
        )}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  step: { width: 40, height: 44, borderRadius: radius.lg, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  bell: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
