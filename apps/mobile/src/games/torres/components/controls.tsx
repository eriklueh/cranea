import { duplicateCells } from "@cranea/core/torres";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { motion } from "@/lib/motion";
import { Icon, Row, Text, shadow, type IconName } from "@/components/ui";
import { formatTime } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";
import { attemptLimit, playedMs, useTorres } from "../store";

/** Escribe (o anota) en la casilla elegida, con una vibración distinta si la altura queda repetida. */
function place(v: number, asNote?: boolean) {
  const s = useTorres.getState();
  const before = s.values;
  s.input(v, asNote);
  const after = useTorres.getState();
  if (after.status === "won" || !after.puzzle || after.selected === null) return;
  const placed = after.values !== before && after.values[after.selected] === v;
  haptic(placed && duplicateCells(after.values, after.puzzle.size).has(after.selected) ? "invalid" : "tap");
}

/**
 * Alturas del 1 al N y borrar, en una sola fila al alcance del pulgar.
 * Mantener apretado un número lo anota (o lo escribe, si Notas está activado), como Shift en la web.
 */
export function NumberPad() {
  const { colors } = useTheme();
  const size = useTorres((s) => s.puzzle?.size ?? 0);
  const notesMode = useTorres((s) => s.notesMode);
  const playing = useTorres((s) => s.status === "playing");
  if (!size) return null;
  const key = (pressed: boolean) => [
    styles.key,
    { borderColor: colors.ink, backgroundColor: colors.tile, ...shadow(colors.shadowInk, pressed ? 0 : 2) },
    pressed && { transform: [{ translateY: 2 }, { scale: 0.96 }] },
    notesMode && { borderStyle: "dashed" as const },
    !playing && { opacity: 0.35 },
  ];
  return (
    <View style={styles.pad}>
      {Array.from({ length: size }, (_, k) => k + 1).map((v) => (
        <Pressable
          key={v}
          accessibilityRole="button"
          accessibilityLabel={notesMode ? `Nota ${v}` : `Altura ${v}`}
          accessibilityHint={notesMode ? "Mantené apretado para escribirla" : "Mantené apretado para anotarla"}
          accessibilityState={{ disabled: !playing }}
          disabled={!playing}
          onPress={() => place(v)}
          onLongPress={() => place(v, !notesMode)}
          delayLongPress={350}
          style={({ pressed }) => key(pressed)}
        >
          <Text
            maxFontSizeMultiplier={1.2}
            style={notesMode ? { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.pencil } : { fontFamily: fonts.display, fontSize: 22, color: colors.ink, fontVariant: ["tabular-nums"] }}
          >
            {v}
          </Text>
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Borrar casilla"
        accessibilityState={{ disabled: !playing }}
        disabled={!playing}
        onPress={() => {
          haptic("tap");
          useTorres.getState().erase();
        }}
        style={({ pressed }) => key(pressed)}
      >
        <Icon name="backspace-outline" size={22} />
      </Pressable>
    </View>
  );
}

function Tool({ icon, label, onPress, disabled, active, primary }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean; active?: boolean; primary?: boolean }) {
  const { colors } = useTheme();
  const filled = primary || active;
  const fg = filled ? colors.primaryForeground : colors.ink;
  return (
    <Pressable
      accessibilityRole={active === undefined ? "button" : "togglebutton"}
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled), ...(active !== undefined && { checked: active }) }}
      disabled={disabled}
      onPress={() => {
        haptic("tap");
        onPress();
      }}
      style={({ pressed }) => [
        styles.tool,
        filled
          ? { backgroundColor: colors.primary, borderColor: colors.primary, ...shadow(colors.shadowInk, pressed ? 0 : 2) }
          : { backgroundColor: colors.card, borderColor: colors.ink, ...shadow(colors.shadowInk, pressed ? 0 : 2) },
        pressed && { transform: [{ translateY: 2 }] },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Icon name={icon} size={20} color={fg} />
      <Text maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Notas, deshacer, reiniciar y comprobar (la barra de la web). */
export function Toolbar() {
  const playing = useTorres((s) => s.status === "playing");
  const notesMode = useTorres((s) => s.notesMode);
  const canUndo = useTorres((s) => s.history.length > 0);
  const hasInput = useTorres((s) => s.puzzle !== null && s.values.some((v, i) => v && !s.puzzle!.givens[i]));
  const { toggleNotesMode, undo, reset, runCheck } = useTorres.getState();
  return (
    <Row gap={6}>
      <Tool icon="pencil" label="Notas" active={notesMode} onPress={toggleNotesMode} disabled={!playing} />
      <Tool icon="arrow-undo" label="Deshacer" onPress={undo} disabled={!playing || !canUndo} />
      <Tool icon="refresh" label="Reiniciar" onPress={reset} disabled={!playing || !canUndo} />
      <Tool icon="checkmark" label="Comprobar" primary onPress={runCheck} disabled={!playing || !hasInput} />
    </Row>
  );
}

/** Mensaje breve después de comprobar. Ocupa siempre su lugar, así el teclado no salta. */
export function CheckMessage() {
  const { colors } = useTheme();
  const check = useTorres((s) => s.check);
  const status = useTorres((s) => s.status);
  const mistakes = useTorres((s) => s.mistakes);
  const total = useTorres(attemptLimit);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!check) return setVisible(false);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, [check]);
  const left = total - mistakes;
  const text =
    check?.kind === "ok"
      ? "Todo bien hasta acá."
      : status === "lost"
        ? "Se acabaron los intentos."
        : `Hay casillas para revisar. ${left === 1 ? "Te queda un intento." : `Te quedan ${left} intentos.`}`;
  return (
    <View style={{ minHeight: 22, justifyContent: "center" }} accessibilityLiveRegion="polite">
      {check && visible && (
        <Animated.View key={check.key} entering={motion.fade()} exiting={motion.exit()}>
          <Text variant="bodyBold" style={{ fontSize: 14, textAlign: "center", color: check.kind === "ok" ? colors.ok : colors.margin }}>
            {text}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

/** Intentos que quedan, como corazones (igual que Cifra y Palabra en la app). */
export function Lives() {
  const { colors } = useTheme();
  const mistakes = useTorres((s) => s.mistakes);
  const total = useTorres(attemptLimit);
  const left = Math.max(0, total - mistakes);
  return (
    <Row gap={3} accessibilityLabel={`Te ${left === 1 ? "queda" : "quedan"} ${left} de ${total} intentos`}>
      {Array.from({ length: total }, (_, i) => (
        <Icon key={i} name={i < left ? "heart" : "heart-outline"} size={16} color={i < left ? colors.margin : colors.border} />
      ))}
    </Row>
  );
}

export function Timer() {
  const startedAt = useTorres((s) => s.startedAt);
  const finishedAt = useTorres((s) => s.finishedAt);
  const pausedAt = useTorres((s) => s.pausedAt);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!startedAt || finishedAt) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [startedAt, finishedAt]);
  const time = formatTime(playedMs({ startedAt, finishedAt, pausedAt }));
  return (
    <Text variant="bodyBold" style={{ fontVariant: ["tabular-nums"], minWidth: 40, textAlign: "right" }} accessibilityLabel={`Tiempo ${time}`}>
      {time}
    </Text>
  );
}

const styles = StyleSheet.create({
  pad: { flexDirection: "row", gap: 6 },
  key: { flex: 1, height: 52, borderRadius: radius.md, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  tool: { flex: 1, height: 56, borderRadius: radius.md, borderWidth: 2, alignItems: "center", justifyContent: "center", gap: 2, paddingHorizontal: 2 },
});
