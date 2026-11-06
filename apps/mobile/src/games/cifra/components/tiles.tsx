import type { Clue, Marks, TileMark } from "@cranea/core/cifra";
import { tileMarkState } from "@cranea/core/cifra";
import { useEffect } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { Text, shadow } from "@/components/ui";
import { haptic } from "@/lib/haptics";
import { useT } from "@/lib/i18n";
import { celebrateStep, DURATION, hop as hopTo, motion, MOTION, PRESS_SCALE, pulse, staggerStep, type Entering } from "@/lib/motion";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";

const MARK_LABEL = { none: "cifra.markNone", out: "cifra.markOut", in: "cifra.markIn", here: "cifra.markHere" } as const satisfies Record<TileMark, string>;

export type DigitTone = "clue" | "input" | "empty" | "solution";

/** Ficha de una cifra. En el tablero se toca para anotar la deducción (descartada → va → va ahí). */
export function DigitTile({
  digit,
  mark = "none",
  position = 0,
  onPress,
  disabled,
  size = 48,
  tone = "clue",
  entering,
  hop,
  hopSpan = 0,
}: {
  digit?: number;
  mark?: TileMark;
  position?: number;
  onPress?: () => void;
  disabled?: boolean;
  /** Lado en dp (ver useTileSize). */
  size?: number;
  tone?: DigitTone;
  /** Cómo entra al montarse: `motion.pop()` lo tipeado, `motion.reveal(delay)` una fila recién puntuada. */
  entering?: Entering;
  /** Lugar en la ola de festejo al descifrar el código (`celebrate`), sobre `hopSpan` lugares. */
  hop?: number;
  hopSpan?: number;
}) {
  const { colors } = useTheme();
  const t = useT();
  const dim = size;
  const bump = useSharedValue(1);
  const lift = useSharedValue(0);

  useEffect(() => {
    // `confirm`: un latido corto al marcar "va ahí", sin rebote.
    if (mark === "here") bump.value = pulse(0);
  }, [mark, bump]);
  useEffect(() => {
    if (hop !== undefined) lift.value = hopTo(hop * celebrateStep(hopSpan), -size * MOTION.hop);
  }, [hop, hopSpan, size, lift]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }, { translateY: lift.value }] }));

  const box: StyleProp<ViewStyle> = [
    styles.tile,
    { width: dim, height: dim },
    tone === "empty"
      ? { borderStyle: "dashed", borderColor: colors.pencil, backgroundColor: "transparent", opacity: 0.6 }
      : { borderColor: colors.ink, backgroundColor: colors.tile, ...shadow(colors.shadowInk, 2) },
    tone === "solution" && { borderColor: colors.ok, ...shadow(colors.ok, 2) },
    mark === "here" && { borderColor: colors.ok, backgroundColor: colors.ok, ...shadow(colors.ok, 2) },
  ];
  const color = mark === "here" ? colors.paper : tone === "solution" ? colors.ok : mark === "out" ? colors.pencil : colors.ink;

  const content = (
    <>
      <Text style={{ fontFamily: fonts.display, fontSize: Math.round(size * 0.54), color, opacity: mark === "out" ? 0.6 : 1 }}>{digit ?? ""}</Text>
      {mark === "out" && <View pointerEvents="none" style={[styles.strike, { backgroundColor: colors.margin }]} />}
      {mark === "in" && <View pointerEvents="none" style={[styles.ring, { borderColor: colors.cluePresent }]} />}
    </>
  );


  if (!onPress) {
    return (
      <Animated.View entering={entering} style={[box, animated]}>
        {content}
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={entering} style={animated}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("cifra.tileLabel", { digit: digit ?? "", position: position + 1, mark: t(MARK_LABEL[mark]) }) + (disabled ? "" : t("cifra.tileTapToChange"))}
        disabled={disabled}
        hitSlop={2}
        onPress={() => {
          haptic("tap");
          onPress();
        }}
        style={({ pressed }) => [box, pressed && { transform: [{ scale: PRESS_SCALE }] }]}
      >
        {content}
      </Pressable>
    </Animated.View>
  );
}

type Kind = "exact" | "present";

/** Puntaje de una fila: círculo lleno = en su lugar; aro = en otro lugar. Mismo ancho aunque sea cero. */
export function Indicator({ kind, value, entering }: { kind: Kind; value: number; entering?: Entering }) {
  const { colors } = useTheme();
  const fg = kind === "exact" ? colors.clueExact : colors.cluePresent;
  const t = useT();
  return (
    <Animated.View
      entering={entering}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t(kind === "exact" ? "cifra.exactCount" : "cifra.presentCount", { n: value })}
      style={[styles.indicator, { backgroundColor: kind === "exact" ? colors.clueExactBg : colors.cluePresentBg, opacity: value === 0 ? 0.5 : 1 }]}
    >
      <Symbol kind={kind} color={fg} />
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: fg }}>{value}</Text>
    </Animated.View>
  );
}

export function Symbol({ kind, color }: { kind: Kind; color: string }) {
  return <View style={[styles.symbol, kind === "exact" ? { backgroundColor: color } : { borderWidth: 2, borderColor: color }]} />;
}

/** Lado de las fichas para que una fila de `length` cifras entre en el ancho del teléfono (máximo 48 dp). */
export function useTileSize(length: number, withScores = true) {
  const { width } = useWindowDimensions();
  const available = Math.min(width, 560) - 36 - (withScores ? 2 * 40 + 16 : 0);
  return Math.max(34, Math.min(48, Math.floor((available - (length - 1) * 6) / length)));
}

/** Una pista (o un intento fallido): puntaje exacto, fichas, puntaje en otro lugar. */
export function ClueRow({
  clue,
  marks,
  row = 0,
  onCycleMark,
  disabled,
  miss,
  highlight,
  reveal,
  size = 48,
}: {
  clue: Clue;
  marks?: Marks;
  row?: number;
  onCycleMark?: (row: number, position: number) => void;
  disabled?: boolean;
  miss?: boolean;
  highlight?: boolean;
  /** Fila recién agregada (`reveal`): las fichas se dan vuelta una por una y después aparece el puntaje, todo en ≤ 600 ms. */
  reveal?: boolean;
  size?: number;
}) {
  const { colors } = useTheme();
  const step = staggerStep(clue.guess.length + 1, DURATION.base);
  const score = reveal ? motion.pop(clue.guess.length * step) : undefined;
  return (
    <View style={[styles.row, highlight && { backgroundColor: colors.cluePresentBg }]}>
      <Indicator kind="exact" value={clue.feedback.exact} entering={score} />
      <View style={[styles.tiles, miss && { borderBottomWidth: 2, borderBottomColor: colors.margin, paddingBottom: 5 }]}>
        {clue.guess.map((d, i) => (
          <DigitTile
            key={i}
            digit={d}
            position={i}
            size={size}
            mark={marks ? tileMarkState(marks, row, i) : "none"}
            onPress={onCycleMark ? () => onCycleMark(row, i) : undefined}
            disabled={disabled}
            entering={reveal ? motion.reveal(i * step) : undefined}
          />
        ))}
      </View>
      <Indicator kind="present" value={clue.feedback.present} entering={score} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.md, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  strike: { position: "absolute", left: 8, right: 8, top: "50%", height: 2, borderRadius: 1, transform: [{ rotate: "-12deg" }] },
  ring: { position: "absolute", top: 5, left: 5, right: 5, bottom: 5, borderRadius: 999, borderWidth: 2 },
  indicator: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, width: 40, height: 30, borderRadius: radius.sm },
  symbol: { width: 11, height: 11, borderRadius: 6 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.lg, paddingVertical: 3 },
  tiles: { flexDirection: "row", gap: 6 },
});
