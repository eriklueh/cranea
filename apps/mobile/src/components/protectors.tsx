import { todayKey } from "@cranea/core";
import { DAYS_PER_PROTECTOR, grantPlus, MAX_PROTECTORS, sameProtectors, unseenCovered } from "@cranea/core/protectors";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { AppState, Modal, Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { motion } from "@/lib/motion";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { create } from "zustand";
import { useAccountReady } from "@/account/progress-sync";
import { Button, Icon, Row, Text, shadow } from "@/components/ui";
import { usePlus } from "@/entitlements";
import { GAMES } from "@/games/registry";
import { api, accountsEnabled } from "@/lib/convex";
import { useClock } from "@/lib/hooks";
import { dailyStreak, protectorsOf, useProgress, type ProtectorState } from "@/stores/progress";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";

/** Igual que la web (components/protectors.tsx). Reglas en `@cranea/core/protectors`. */

const READY_TIMEOUT_MS = 5000;
const TOAST_DELAY_MS = 900;
const TOAST_MS = 5000;

/** Stock de protectores para hoy. */
export function useProtectors() {
  const now = useClock(60_000);
  const games = useProgress((s) => s.games);
  const protectors = useProgress((s) => s.protectors);
  return protectorsOf({ games, protectors }, todayKey(new Date(now))).status;
}

export const usedText = (used: number, streak: number) =>
  `${used > 1 ? `Usaste ${used} protectores` : "Usaste un protector"}: ${streak > 0 ? `tu racha sigue en ${streak}` : "tu racha sigue viva"}`;

function liveStreak(today: string) {
  const { games } = useProgress.getState();
  return Math.max(0, ...GAMES.map((g) => dailyStreak(games[g.id]?.daily ?? {}, today)));
}

/** Va una vez en la app: crea el estado, anota el regalo de Plus, avisa al usar uno y sincroniza. */
export function Protectors({ synced }: { synced: boolean }) {
  return (
    <>
      {synced ? <ProtectorsSync /> : null}
      <ProtectorsWatcher synced={synced} />
    </>
  );
}

const useRemoteReady = create<{ ready: boolean }>(() => ({ ready: false }));
const setRemoteReady = (ready: boolean) => useRemoteReady.setState({ ready });

function ProtectorsWatcher({ synced }: { synced: boolean }) {
  const hydrated = useProgress((s) => s.hydrated);
  const progressReady = useAccountReady((s) => s.ready);
  const remote = useRemoteReady((s) => s.ready);
  const [timedOut, setTimedOut] = useState(false);
  const ready = hydrated && (!synced || (progressReady && remote) || timedOut);
  const plus = usePlus();
  const now = useClock(60_000);
  const today = todayKey(new Date(now));
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), READY_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const p = useProgress.getState();
    if (!p.protectors) p.mergeProtectors(undefined, today);
    const s = useProgress.getState().protectors;
    if (plus && s) p.mergeProtectors(grantPlus(s, today));
  }, [ready, plus, today]);

  useEffect(() => {
    if (!ready) return;
    const check = () => {
      const st = useProgress.getState();
      if (!st.protectors) return;
      const fresh = unseenCovered(protectorsOf(st, today).status, st.protectors);
      if (!fresh.length) return;
      st.mergeProtectors({ ...st.protectors, seen: [...st.protectors.seen, ...fresh] });
      setToast({ key: Date.now(), text: usedText(fresh.length, liveStreak(today)) });
    };
    check();
    return useProgress.subscribe((s, prev) => {
      if (s.games !== prev.games || s.protectors !== prev.protectors) check();
    });
  }, [ready, today]);

  return toast ? <ProtectorToast key={toast.key} text={toast.text} onDone={() => setToast(null)} /> : null;
}

function ProtectorToast({ text, onDone }: { text: string; onDone: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const show = setTimeout(() => setVisible(true), TOAST_DELAY_MS);
    const hide = setTimeout(() => done.current(), TOAST_DELAY_MS + TOAST_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);
  if (!visible) return null;
  return (
    <View pointerEvents="box-none" style={[styles.toastWrap, { top: insets.top + 8 }]}>
      <Animated.View
        entering={motion.appear()}
        exiting={motion.exit()}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[styles.toast, { backgroundColor: colors.card, borderColor: colors.ink, ...shadow(colors.shadowInk, 3) }]}
      >
        <View style={[styles.toastIcon, { backgroundColor: colors.muted }]}>
          <Icon name="shield-checkmark" size={22} color={colors.primary} />
        </View>
        <Text style={{ flex: 1, fontFamily: fonts.displayHeavy, fontSize: 16, lineHeight: 20, color: colors.ink }}>{text}</Text>
        <Pressable onPress={onDone} accessibilityRole="button" accessibilityLabel="Cerrar aviso" hitSlop={8} style={{ padding: 8 }}>
          <Icon name="close" size={20} color={colors.mutedForeground} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** Con sesión: trae los protectores de la cuenta, los combina y sube los cambios. */
function ProtectorsSync() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const hydrated = useProgress((s) => s.hydrated);
  const remote = useQuery(api.protectors.mine, isAuthenticated ? {} : "skip");
  const save = useMutation(api.protectors.save);
  const known = useRef<ProtectorState | undefined>(undefined);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setRemoteReady(true);
    else if (isAuthenticated && remote === undefined) setRemoteReady(false);
  }, [isLoading, isAuthenticated, remote === undefined]);

  useEffect(() => {
    if (remote === undefined || !hydrated) return;
    known.current = remote ?? undefined;
    if (remote) useProgress.getState().mergeProtectors(remote);
    setRemoteReady(true);
  }, [remote, hydrated]);

  useEffect(() => {
    if (!isAuthenticated || remote === undefined || !hydrated) return;
    const push = () => {
      const local = useProgress.getState().protectors;
      if (!local || sameProtectors(local, known.current)) return;
      save({ state: local }).then(() => (known.current = local), () => {});
    };
    push();
    const unsubscribe = useProgress.subscribe((s, prev) => {
      if (s.protectors !== prev.protectors) push();
    });
    const app = AppState.addEventListener("change", (state) => state === "active" && push());
    return () => {
      unsubscribe();
      app.remove();
    };
  }, [isAuthenticated, remote === undefined, hydrated, save]);

  return null;
}

/** 🛡️×N al lado de la racha; al tocarlo, una hoja explica cómo funcionan. */
export function ProtectorBadge({ size = 13 }: { size?: number }) {
  const { colors } = useTheme();
  const hydrated = useProgress((s) => s.hydrated);
  const status = useProtectors();
  const [open, setOpen] = useState(false);
  if (!hydrated) return null;
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${status.stock} ${status.stock === 1 ? "protector" : "protectores"} de racha. Qué es`}
        hitSlop={10}
        style={({ pressed }) => [styles.badge, { backgroundColor: pressed ? colors.accent : colors.muted }]}
      >
        <Icon name="shield-half" size={size} color={status.stock ? colors.primary : colors.mutedForeground} />
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: size, color: status.stock ? colors.primary : colors.mutedForeground }}>×{status.stock}</Text>
      </Pressable>
      <ProtectorsSheet open={open} onClose={() => setOpen(false)} stock={status.stock} nextIn={status.nextIn} />
    </>
  );
}

/** Fila para Estadísticas. */
export function ProtectorsRow() {
  const { colors } = useTheme();
  const status = useProtectors();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.row, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { backgroundColor: colors.accent }]}
      >
        <Icon name="shield-half" size={24} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyBold">Protectores de racha</Text>
          <Text variant="small">
            {status.stock} de {MAX_PROTECTORS}
            {status.stock < MAX_PROTECTORS ? ` · el próximo en ${status.nextIn} ${status.nextIn === 1 ? "día" : "días"}` : ""}
          </Text>
        </View>
        <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 22, color: colors.primary }}>×{status.stock}</Text>
      </Pressable>
      <ProtectorsSheet open={open} onClose={() => setOpen(false)} stock={status.stock} nextIn={status.nextIn} />
    </>
  );
}

function ProtectorsSheet({ open, onClose, stock, nextIn }: { open: boolean; onClose: () => void; stock: number; nextIn: number }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const lines = [
    "Si un día no jugás ningún diario, se usa solo y tu racha sigue.",
    `Ganás uno cada ${DAYS_PER_PROTECTOR} días seguidos jugando. Guardás hasta ${MAX_PROTECTORS}.`,
    `Con Craneá Plus, cada mes arrancás con ${MAX_PROTECTORS}.`,
    "Cuida la racha de cada juego. Si faltás más días de los que cubrís, la racha se corta y los guardás.",
  ];
  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      {open && (
        <Animated.View entering={motion.fade()} style={StyleSheet.absoluteFill}>
          <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
        </Animated.View>
      )}
      {open && (
      <Animated.View entering={motion.sheetIn()} style={[styles.sheet, { backgroundColor: colors.paper, borderColor: colors.ink, paddingBottom: insets.bottom + 18 }]}>
        <Row gap={10}>
          <Icon name="shield-half" size={28} color={colors.primary} />
          <Text variant="title">Protector de racha</Text>
        </Row>
        <Text variant="muted">
          {stock === 0 ? "Todavía no tenés ninguno." : `Tenés ${stock} ${stock === 1 ? "guardado" : "guardados"}.`}
          {stock < MAX_PROTECTORS ? ` Te ${nextIn === 1 ? "falta 1 día" : `faltan ${nextIn} días`} para el próximo.` : ""}
        </Text>
        <View style={{ gap: 8 }}>
          {lines.map((l) => (
            <Row key={l} gap={8} style={{ alignItems: "flex-start" }}>
              <Text style={{ color: colors.primary, fontFamily: fonts.bodyBold }}>•</Text>
              <Text style={{ flex: 1 }}>{l}</Text>
            </Row>
          ))}
        </View>
        <Button title="Entendido" size="lg" onPress={onClose} />
      </Animated.View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  toastWrap: { position: "absolute", left: 0, right: 0, alignItems: "center", paddingHorizontal: 12, zIndex: 100, elevation: 100 },
  toast: { flexDirection: "row", alignItems: "center", gap: 10, width: "100%", maxWidth: 420, borderWidth: 2, borderRadius: radius.xl, padding: 8, paddingLeft: 10 },
  toastIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  badge: { flexDirection: "row", alignItems: "center", gap: 2, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: radius.xl, padding: 14 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 2, borderBottomWidth: 0, padding: 20, gap: 14 },
});
