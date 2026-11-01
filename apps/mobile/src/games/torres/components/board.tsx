import { clueState, duplicateCells, type ClueState, type Side, type TorresClues } from "@cranea/core/torres";
import { memo, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Keyframe, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { shadow, Text } from "@/components/ui";
import { useOnChange, useReducedMotion } from "@/lib/hooks";
import { hop as hopTo, waveStep } from "@/lib/motion";
import { useTheme } from "@/theme/theme";
import { alpha, fonts, radius } from "@/theme/tokens";

const SIDE_LABEL: Record<Side, string> = { top: "arriba", bottom: "abajo", left: "la izquierda", right: "la derecha" };
const STATE_LABEL: Record<ClueState, string> = { none: "", pending: "", ok: ", cumplida", conflict: ", no se cumple" };
/** Paso de la ola al ganar, por diagonal (como `--step` en la web). */
const WAVE_STEP = 45;
const MAX_CELL = 64;
const MIN_CLUE = 22;
const FRAME = 2;
const FRAME_SHADOW = 3;

/** Medidas de un tablero de `size` casillas que entra en `width`: casillas lo más grandes posible y carriles para las pistas. */
export function boardMetrics(size: number, width: number) {
  let cell = Math.min(MAX_CELL, Math.floor(width / (size + 1.2)));
  const clue = Math.max(MIN_CLUE, Math.floor(Math.min(cell * 0.62, (width - size * cell) / 2)));
  if (size * cell + 2 * clue > width) cell = Math.floor((width - 2 * clue) / size);
  return { cell, clue, width: size * cell + 2 * clue };
}

/**
 * Ancho del tablero en la pantalla de juego: todo el ancho (comiéndose parte del margen) y, en
 * pantallas bajas, lo que deje lugar al teclado sin hacer scroll, sin bajar de 36 pt por casilla.
 */
export function useBoardWidth(size: number) {
  const { width, height } = useWindowDimensions();
  const byWidth = Math.min(width, 560) - 20;
  const byHeight = height - 340;
  const floor = size * 36 + 2 * MIN_CLUE;
  return Math.max(Math.min(byWidth, floor), Math.min(byWidth, byHeight));
}

interface Props {
  size: number;
  clues: TorresClues;
  givens: readonly number[];
  values: readonly number[];
  notes?: readonly number[];
  selected?: number | null;
  wrong?: readonly number[];
  onSelect?: (cell: number) => void;
  /** Sin interacción: para el resultado, el diario ya jugado y el instructivo. */
  readOnly?: boolean;
  /** Muestra si cada pista se cumple. */
  feedback?: boolean;
  /** Las torres se levantan en una ola en diagonal (al ganar y en la solución). */
  wave?: boolean;
  /** Las torres que se escriben suben al aparecer. */
  rise?: boolean;
  width: number;
  style?: StyleProp<ViewStyle>;
}

/** Tablero de Torres: casillas en el centro y pistas de borde alrededor (apps/web/src/games/torres/components/board.tsx). */
export function Board({ size, clues, givens, values, notes, selected = null, wrong = [], onSelect, readOnly = false, feedback = true, wave = false, rise = false, width, style }: Props) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const { cell, clue, width: total } = boardMetrics(size, width);
  const dupes = useMemo(() => duplicateCells(values, size), [values, size]);
  const wrongSet = useMemo(() => new Set(wrong), [wrong]);
  const range = Array.from({ length: size }, (_, i) => i);
  const selRow = selected === null ? -1 : Math.floor(selected / size);
  const selCol = selected === null ? -1 : selected % size;
  const selValue = selected === null ? 0 : values[selected];
  const state = (side: Side, i: number) => (feedback ? clueState(values, size, side, i, clues[side][i]) : "pending");
  const clueProps = { size: clue, reduced };

  const lane = (side: "top" | "bottom") => (
    <View style={{ flexDirection: "row", height: clue }}>
      {range.map((i) => (
        <View key={i} style={{ width: cell, alignItems: "center", justifyContent: "center" }}>
          <Clue side={side} index={i} value={clues[side][i]} state={state(side, i)} {...clueProps} />
        </View>
      ))}
    </View>
  );
  const column = (side: "left" | "right") => (
    <View style={{ width: clue, paddingVertical: clue }}>
      {range.map((i) => (
        <View key={i} style={{ height: cell, alignItems: "center", justifyContent: "center" }}>
          <Clue side={side} index={i} value={clues[side][i]} state={state(side, i)} {...clueProps} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={[{ width: total, flexDirection: "row", alignSelf: "center" }, style]} accessibilityLabel={`Tablero de ${size} por ${size}`}>
      {column("left")}
      <View>
        {lane("top")}
        {/* Marco: el borde va por fuera de las casillas (margen negativo), así miden exactamente `cell`. */}
        <View
          style={[
            styles.frame,
            { margin: -FRAME, marginBottom: -FRAME - FRAME_SHADOW, borderColor: colors.ink, backgroundColor: colors.card, ...shadow(colors.shadowInk, FRAME_SHADOW) },
          ]}
        >
          {range.map((r) => (
            <View key={r} style={{ flexDirection: "row" }}>
              {range.map((c) => {
                const i = r * size + c;
                const v = values[i];
                const isSel = i === selected;
                return (
                  <Cell
                    key={c}
                    index={i}
                    row={r}
                    col={c}
                    size={size}
                    cell={cell}
                    value={v}
                    given={Boolean(givens[i])}
                    notes={v ? 0 : (notes?.[i] ?? 0)}
                    selected={isSel}
                    related={!isSel && (r === selRow || c === selCol)}
                    sameValue={!isSel && v !== 0 && v === selValue}
                    conflict={dupes.has(i)}
                    wrong={wrongSet.has(i)}
                    readOnly={readOnly}
                    rise={rise && !reduced}
                    wave={wave && !reduced}
                    onSelect={onSelect}
                  />
                );
              })}
            </View>
          ))}
        </View>
        {lane("bottom")}
      </View>
      {column("right")}
    </View>
  );
}

const Clue = memo(function Clue({ side, index, value, state, size, reduced }: { side: Side; index: number; value: number; state: ClueState; size: number; reduced: boolean }) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const x = useSharedValue(0);
  // Cada cambio de estado tiene su propio gesto: un salto al cumplirse, un temblor al no cumplirse.
  useOnChange(state, (s) => {
    if (reduced) return;
    if (s === "ok") scale.value = withSequence(withTiming(1.18, { duration: 120 }), withSpring(1, { damping: 9, stiffness: 260 }));
    else if (s === "conflict") x.value = withSequence(...[-2.5, 2.5, -2.5, 2.5, 0].map((v) => withTiming(v, { duration: 55 })));
  });
  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { scale: scale.value }] }));
  if (!value) return null;
  const line = side === "top" || side === "bottom" ? `columna ${index + 1}` : `fila ${index + 1}`;
  const d = Math.min(size - 2, 32);
  const tone =
    state === "ok" ? { bg: colors.clueExactBg, fg: colors.clueExact } : state === "conflict" ? { bg: colors.margin, fg: colors.paper } : { bg: "transparent", fg: colors.ink };
  return (
    <Animated.View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Desde ${SIDE_LABEL[side]}, ${line}: se ven ${value}${STATE_LABEL[state]}`}
      style={[{ width: d, height: d, borderRadius: d / 2, alignItems: "center", justifyContent: "center", backgroundColor: tone.bg }, anim]}
    >
      <Text maxFontSizeMultiplier={1} style={{ fontFamily: fonts.display, fontSize: Math.round(d * 0.62), lineHeight: Math.round(d * 0.8), color: tone.fg, fontVariant: ["tabular-nums"] }}>
        {value}
      </Text>
    </Animated.View>
  );
});

interface CellProps {
  index: number;
  row: number;
  col: number;
  size: number;
  cell: number;
  value: number;
  given: boolean;
  notes: number;
  selected: boolean;
  related: boolean;
  sameValue: boolean;
  conflict: boolean;
  wrong: boolean;
  readOnly: boolean;
  rise: boolean;
  wave: boolean;
  onSelect?: (cell: number) => void;
}

const Cell = memo(function Cell({ index, row, col, size, cell, value, given, notes, selected, related, sameValue, conflict, wrong, readOnly, rise, wave, onSelect }: CellProps) {
  const { colors } = useTheme();
  const noteList = notes ? Array.from({ length: size }, (_, k) => k + 1).filter((v) => notes & (1 << (v - 1))) : [];
  const label = `Fila ${row + 1}, columna ${col + 1}: ${value ? `altura ${value}` : "vacía"}${given ? ", dada" : ""}${conflict ? ", repetida" : ""}${wrong ? ", incorrecta" : ""}${noteList.length ? `, notas ${noteList.join(" ")}` : ""}`;
  const bg = wrong ? alpha(colors.margin, 0.15) : selected ? colors.tile : sameValue ? colors.cluePresentBg : related ? alpha(colors.accent, 0.75) : "transparent";
  const fg = wrong || conflict ? colors.margin : given ? colors.ink : colors.ring;
  const line = alpha(colors.ink, 0.2);
  const box: ViewStyle = {
    width: cell,
    height: cell,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: bg,
    borderRightWidth: col < size - 1 ? 1 : 0, // 1 punto: "hairline" desaparecía en algunas pantallas
    borderBottomWidth: row < size - 1 ? 1 : 0,
    borderColor: line,
  };
  const content = (
    <>
      {value ? (
        <Tower key={value} value={value} color={fg} cell={cell} rise={rise && !given} wave={wave} delay={(row + col) * waveStep(2 * size - 2, 320, WAVE_STEP)} />
      ) : notes ? (
        <Notes mask={notes} size={size} cell={cell} />
      ) : null}
      {given && <View style={[styles.givenMark, { backgroundColor: alpha(colors.ink, 0.35), left: cell * 0.32, right: cell * 0.32, bottom: cell * 0.13 }]} />}
      {wrong && <Strike cell={cell} color={colors.margin} />}
      {selected && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderWidth: 3, borderColor: colors.ring }]} />}
    </>
  );
  if (readOnly) return <View style={box} accessible accessibilityLabel={label}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPressIn={() => onSelect?.(index)}
      style={box}
    >
      {content}
    </Pressable>
  );
});

/** Una torre escrita: sube desde abajo al aparecer y salta en la ola de la victoria. */
function Tower({ value, color, cell, rise, wave, delay }: { value: number; color: string; cell: number; rise: boolean; wave: boolean; delay: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (!wave) return;
    y.value = hopTo(delay, -cell * 0.22);
  }, [wave, delay, cell, y]);
  const hop = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const entering = useMemo(
    () =>
      rise
        ? new Keyframe({
            0: { opacity: 0, transform: [{ translateY: cell * 0.3 }, { scaleY: 0.6 }] },
            60: { opacity: 1, transform: [{ translateY: -cell * 0.05 }, { scaleY: 1.06 }] },
            100: { opacity: 1, transform: [{ translateY: 0 }, { scaleY: 1 }] },
          }).duration(320)
        : undefined,
    [rise, cell],
  );
  return (
    <Animated.View entering={entering} style={hop}>
      <Text maxFontSizeMultiplier={1} style={{ fontFamily: fonts.display, fontSize: Math.round(cell * 0.52), lineHeight: Math.round(cell * 0.66), color, fontVariant: ["tabular-nums"] }}>
        {value}
      </Text>
    </Animated.View>
  );
}

function Notes({ mask, size, cell }: { mask: number; size: number; cell: number }) {
  const { colors } = useTheme();
  const cols = size <= 4 ? 2 : 3;
  const inner = cell * 0.84;
  const w = inner / cols;
  const h = inner / Math.ceil(size / cols);
  const font = Math.max(9, Math.round(Math.min(w, h) * 0.78));
  return (
    <View pointerEvents="none" style={{ width: inner, height: inner, flexDirection: "row", flexWrap: "wrap" }}>
      {Array.from({ length: size }, (_, k) => (
        <View key={k} style={{ width: w, height: h, alignItems: "center", justifyContent: "center" }}>
          {mask & (1 << k) ? (
            <Text maxFontSizeMultiplier={1} style={{ fontFamily: fonts.bodyBold, fontSize: font, lineHeight: font + 1, color: colors.pencil }}>
              {k + 1}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** La raya roja de una casilla equivocada, que se dibuja de izquierda a derecha. */
function Strike({ cell, color }: { cell: number; color: string }) {
  const w = cell * 0.56;
  const entering = useMemo(
    () => new Keyframe({ 0: { transform: [{ rotate: "-12deg" }, { scaleX: 0 }] }, 100: { transform: [{ rotate: "-12deg" }, { scaleX: 1 }] } }).duration(200),
    [],
  );
  return (
    <Animated.View
      pointerEvents="none"
      entering={entering}
      style={{ position: "absolute", top: cell / 2 - 1, left: (cell - w) / 2, width: w, height: 2, borderRadius: 1, backgroundColor: color, transform: [{ rotate: "-12deg" }] }}
    />
  );
}

const styles = StyleSheet.create({
  frame: { borderWidth: FRAME, borderRadius: radius.md, overflow: "hidden" },
  givenMark: { position: "absolute", height: 2, borderRadius: 1 },
});

