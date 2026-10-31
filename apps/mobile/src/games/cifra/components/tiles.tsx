import type { Clue, Marks, TileMark } from "@cranea/core/cifra";
import { tileMarkState } from "@cranea/core/cifra";
import { useEffect } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming, ZoomIn } from "react-native-reanimated";
import { Text, shadow } from "@/components/ui";
import { haptic } from "@/lib/haptics";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";

const MARK_LABEL: Record<TileMark, string> = { none: "sin marcar", out: "descartada", in: "va", here: "va ahí" };

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
  enterDelay,
  hop,
}: {
  digit?: number;
  mark?: TileMark;
  position?: number;
  onPress?: () => void;
  disabled?: boolean;
  /** Lado en dp (ver useTileSize). */
  size?: number;
  tone?: DigitTone;
  /** Aparece con un giro, `enterDelay` ms después de montarse (filas recién agregadas). */
  enterDelay?: number;
  /** Salto al descifrar el código. */
  hop?: number;
}) {
  const { colors } = useTheme();
  const dim = size;
  const bump = useSharedValue(1);
  const lift = useSharedValue(0);

  useEffect(() => {
    if (mark === "here") bump.value = withSequence(withTiming(1.12, { duration: 90 }), withSpring(1, { damping: 8 }));
  }, [mark, bump]);
  useEffect(() => {
    if (hop !== undefined) lift.value = withDelay(hop * 80, withSequence(withTiming(-10, { duration: 140 }), withSpring(0, { damping: 6 })));
  }, [hop, lift]);

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

  const entering = enterDelay !== undefined ? ZoomIn.delay(enterDelay).springify().damping(14) : undefined;

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
        accessibilityLabel={`Cifra ${digit}, posición ${position + 1}: ${MARK_LABEL[mark]}.${disabled ? "" : " Tocá para cambiar."}`}
        disabled={disabled}
        hitSlop={2}
        onPress={() => {
          haptic("tap");
          onPress();
        }}
        style={({ pressed }) => [box, pressed && { transform: [{ scale: 0.94 }] }]}
      >
        {content}
      </Pressable>
    </Animated.View>
  );
}

type Kind = "exact" | "present";

/** Puntaje de una fila: círculo lleno = en su lugar; aro = en otro lugar. Mismo ancho aunque sea cero. */
export function Indicator({ kind, value, enterDelay }: { kind: Kind; value: number; enterDelay?: number }) {
  const { colors } = useTheme();
  const fg = kind === "exact" ? colors.clueExact : colors.cluePresent;
  return (
    <Animated.View
      entering={enterDelay !== undefined ? ZoomIn.delay(enterDelay) : undefined}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${value} ${kind === "exact" ? "en su lugar" : "en otro lugar"}`}
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
  /** Fila recién agregada: las fichas aparecen una por una y después el puntaje. */
  reveal?: boolean;
  size?: number;
}) {
  const { colors } = useTheme();
  const scoreDelay = reveal ? clue.guess.length * 70 + 120 : undefined;
  return (
    <View style={[styles.row, highlight && { backgroundColor: colors.cluePresentBg }]}>
      <Indicator kind="exact" value={clue.feedback.exact} enterDelay={scoreDelay} />
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
            enterDelay={reveal ? i * 70 : undefined}
          />
        ))}
      </View>
      <Indicator kind="present" value={clue.feedback.present} enterDelay={scoreDelay} />
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
