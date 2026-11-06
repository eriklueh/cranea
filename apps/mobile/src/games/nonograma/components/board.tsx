import { colCells, EMPTY, FILLED, lineDone, rowCells, type Cell, type LineClue, type NonogramaPuzzle } from "@cranea/core/nonograma";

import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { StyleSheet, View, useWindowDimensions, PixelRatio } from "react-native";
import { GestureDetector, usePanGesture, usePinchGesture, useSimultaneousGestures } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Text, shadow } from "@/components/ui";
import { haptic } from "@/lib/haptics";
import { useT } from "@/lib/i18n";
import { sound } from "@/lib/sound";
import { useOnChange } from "@/lib/hooks";
import { celebrateStep, DURATION, motion, MOTION, pulse, timing, useMotionReduced, useShake } from "@/lib/motion";
import { useTheme } from "@/theme/theme";
import { alpha, fonts } from "@/theme/tokens";
import { useNonograma } from "../store";
import { hintLineOf } from "./hint";

/**
 * Tablero con pistas (components/board.tsx de la web).
 *
 * Rendimiento: un solo detector de gestos sobre la grilla calcula la casilla a partir de las
 * coordenadas; no hay un manejador por casilla. Cada casilla es un componente memo que se suscribe
 * solo a su valor del store (y a si su fila o columna está resaltada), así un paso del dedo vuelve a
 * dibujar únicamente las casillas que cambiaron, no las 225.
 *
 * Tamaño: en un teléfono de 360 pt un 15×15 queda con casillas de ~17 pt (las pistas de las filas
 * ocupan ~65 pt); el diario de 10×10, ~27 pt. Por debajo de 22 pt se habilita el zoom: pellizcar con dos dedos acerca y arrastrar
 * con dos dedos mueve; un dedo siempre pinta. Las pistas no se agrandan, pero acompañan el zoom
 * (se separan y se desplazan con sus filas y columnas), así siempre se leen las de lo que se ve.
 * Un botón (lupa) hace lo mismo sin pellizcar.
 */

/** Margen horizontal de la pantalla del juego (más chico que el resto, para ganar tablero). */
export const GAME_PAD = 10;
const BORDER = 2;
/** Debajo de este tamaño de casilla el dedo tapa demasiado: se ofrece el zoom. */
const MIN_CELL = 22;

const STATE_LABEL = { 0: "nonograma.cellEmpty", 1: "nonograma.cellFilled", 2: "nonograma.cellCrossed" } as const satisfies Record<Cell, string>;

export interface BoardLayout {
  cell: number;
  font: number;
  clueW: number;
  clueH: number;
  lineH: number;
  zoomable: boolean;
  maxScale: number;
}

export function useBoardLayout(puzzle: NonogramaPuzzle): BoardLayout {
  const { width } = useWindowDimensions();
  return useMemo(() => {
    const W = puzzle.width;
    const avail = Math.min(width, 560) - GAME_PAD * 2;
    const font = W <= 5 ? 22 : W <= 10 ? 14 : 11;
    // Ancho de la pista más larga: ~0,6 em por cifra y ~0,3 em por espacio (Bricolage, cifras tabulares).
    // Si una fuente rara ocupa más, el texto se achica solo (adjustsFontSizeToFit).
    const rowEm = Math.max(1, ...puzzle.rows.map((c) => {
      const nums = c.length ? c : [0];
      return nums.join("").length * 0.6 + (nums.length - 1) * 0.3;
    }));
    const colCount = Math.max(1, ...puzzle.cols.map((c) => Math.max(1, c.length)));
    const clueW = Math.ceil(rowEm * font + 10);
    const lineH = Math.round(font * 1.18);
    const clueH = colCount * lineH + 6;
    const maxCell = W <= 5 ? 52 : W <= 10 ? 34 : 30;
    const cell = PixelRatio.roundToNearestPixel(Math.max(12, Math.min(maxCell, Math.floor((avail - clueW - BORDER * 2) / W))));
    const zoomable = cell < MIN_CELL;
    const maxScale = zoomable ? Math.min(2.5, Math.max(1.5, 30 / cell)) : 1;
    return { cell, font, clueW, clueH, lineH, zoomable, maxScale };
  }, [puzzle, width]);
}

export interface BoardHandle {
  /** Acerca (centrado en la última casilla tocada) o vuelve al tablero entero. Devuelve si quedó con zoom. */
  toggleZoom: () => boolean;
}

/** Lo que se ve en una casilla: al terminar (y salvo que el intento extra esté en oferta), la solución. */
const shown = (s: ReturnType<typeof useNonograma.getState>, i: number): Cell =>
  s.status !== "playing" && !s.conceal ? (s.puzzle?.solution[i] ? FILLED : 0) : (s.board[i] ?? 0);

const clamp = (v: number, lo: number, hi: number) => {
  "worklet";
  return Math.min(hi, Math.max(lo, v));
};

export const Board = forwardRef<BoardHandle, { puzzle: NonogramaPuzzle; layout: BoardLayout; onZoomChange?: (zoomed: boolean) => void }>(function Board({ puzzle, layout, onZoomChange }, ref) {
  const { colors } = useTheme();
  const t = useT();
  const reduced = useMotionReduced();
  const { width: W, height: H } = puzzle;
  const { cell, zoomable, maxScale, clueW, clueH } = layout;
  const gridW = W * cell;
  const gridH = H * cell;
  // Al terminar, el dibujo aparece (o late, si ganaste) en una ola diagonal de ≤ 600 ms.
  const step = celebrateStep(W + H - 2);

  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const last = useRef(-1);
  const multi = useRef(false);

  const status = useNonograma((s) => s.status);
  const checks = useNonograma((s) => s.checks);
  const [shakeKey, setShakeKey] = useState(0);
  const shake = useShake(reduced ? 0 : shakeKey);

  useOnChange(checks, (n, before) => {
    if (n <= before) return;
    const wrong = useNonograma.getState().lastCheck ?? 0;
    if (wrong > 0) {
      haptic("invalid");
      setShakeKey((k) => k + 1);
    } else haptic("tap");
  });
  useOnChange(status, (s) => {
    if (s === "won") setTimeout(() => haptic("win"), DURATION.fast);
  });

  const indexAt = useCallback(
    (x: number, y: number) => {
      const s = scale.value;
      const c = Math.min(W - 1, Math.max(0, Math.floor((x - tx.value) / s / cell)));
      const r = Math.min(H - 1, Math.max(0, Math.floor((y - ty.value) / s / cell)));
      return r * W + c;
    },
    [W, H, cell, scale, tx, ty],
  );

  /** Entró un segundo dedo: es zoom, no pintura. El trazo empezado se deshace. */
  const cancelForZoom = useCallback(() => {
    multi.current = true;
    useNonograma.getState().cancelStroke();
  }, []);
  const zoomChanged = useCallback((z: boolean) => onZoomChange?.(z), [onZoomChange]);

  const paint = usePanGesture({
    // Sin maxPointers: si entra un segundo dedo el pan sigue vivo (y no confirma el trazo al fallar);
    // `multi` lo marca como zoom y al soltar el trazo se descarta.
    minDistance: 0,
    runOnJS: true,
    shouldCancelWhenOutside: false,
    // El trazo empieza al apoyar el dedo (onBegin llega siempre, aunque el pan no llegue a activarse):
    // un toque sin movimiento también pinta, y se ve en el acto.
    onBegin: (e) => {
      multi.current = false;
      last.current = -1;
      const s = useNonograma.getState();
      if (s.status !== "playing") return;
      const i = indexAt(e.x, e.y);
      last.current = i;
      s.beginStroke(i);
      haptic("tap");
    },
    onUpdate: (e) => {
      if (multi.current || e.numberOfPointers > 1 || last.current < 0) return;
      const i = indexAt(e.x, e.y);
      if (i === last.current) return;
      last.current = i;
      useNonograma.getState().moveStroke(i);
    },
    onTouchesDown: (e) => {
      if (e.numberOfTouches > 1 && !multi.current) cancelForZoom();
    },
    onFinalize: () => {
      last.current = -1;
      if (multi.current) useNonograma.getState().cancelStroke();
      else useNonograma.getState().endStroke();
    },
  });

  const settle = () => {
    "worklet";
    if (scale.value < 1.05) {
      scale.value = withTiming(1, timing("base"));
      tx.value = withTiming(0, timing("base"));
      ty.value = withTiming(0, timing("base"));
      scheduleOnRN(zoomChanged, false);
    } else scheduleOnRN(zoomChanged, true);
  };

  const pinch = usePinchGesture({
    enabled: zoomable,
    onBegin: () => {
      "worklet";
      scheduleOnRN(cancelForZoom);
    },
    onUpdate: (e) => {
      "worklet";
      const s0 = scale.value;
      const s1 = clamp(s0 * e.scaleChange, 1, maxScale);
      tx.value = clamp(e.focalX - (e.focalX - tx.value) * (s1 / s0), gridW * (1 - s1), 0);
      ty.value = clamp(e.focalY - (e.focalY - ty.value) * (s1 / s0), gridH * (1 - s1), 0);
      scale.value = s1;
    },
    onFinalize: () => {
      "worklet";
      settle();
    },
  });

  const pan2 = usePanGesture({
    enabled: zoomable,
    minPointers: 2,
    minDistance: 4,
    onActivate: () => {
      "worklet";
      scheduleOnRN(cancelForZoom);
    },
    onUpdate: (e) => {
      "worklet";
      tx.value = clamp(tx.value + e.changeX, gridW * (1 - scale.value), 0);
      ty.value = clamp(ty.value + e.changeY, gridH * (1 - scale.value), 0);
    },
  });

  const gesture = useSimultaneousGestures(paint, pinch, pan2);

  useImperativeHandle(
    ref,
    () => ({
      toggleZoom: () => {
        // Acercar o alejar es un movimiento grande: `slow`. Con movimiento reducido, salta.
        const move = reduced ? { duration: 0 } : timing("slow");
        if (scale.value > 1.01) {
          scale.value = withTiming(1, move);
          tx.value = withTiming(0, move);
          ty.value = withTiming(0, move);
          return false;
        }
        const cursor = useNonograma.getState().cursor ?? Math.floor(H / 2) * W + Math.floor(W / 2);
        const S = maxScale;
        const cx = ((cursor % W) + 0.5) * cell;
        const cy = (Math.floor(cursor / W) + 0.5) * cell;
        scale.value = withTiming(S, move);
        tx.value = withTiming(clamp(gridW / 2 - cx * S, gridW * (1 - S), 0), move);
        ty.value = withTiming(clamp(gridH / 2 - cy * S, gridH * (1 - S), 0), move);
        return true;
      },
    }),
    [reduced, scale, tx, ty, H, W, maxScale, cell, gridW, gridH],
  );

  const content = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }] }));
  return (
    <Animated.View style={[{ alignSelf: "center" }, shake]}>
      <LineFeedback puzzle={puzzle} />
      <View style={{ flexDirection: "row" }}>
        {/* Pistas de las filas, alineadas con la grilla (y con el zoom). */}
        <View style={{ width: clueW, height: gridH, marginTop: clueH + BORDER, overflow: "hidden" }} importantForAccessibility="no-hide-descendants">
          {puzzle.rows.map((clue, r) => (
            <RowClue key={r} r={r} clue={clue} W={W} layout={layout} ty={ty} scale={scale} />
          ))}
        </View>
        <View>
          <View style={{ width: gridW, height: clueH, marginLeft: BORDER, overflow: "hidden" }} importantForAccessibility="no-hide-descendants">
            {puzzle.cols.map((clue, c) => (
              <ColClue key={c} c={c} clue={clue} W={W} layout={layout} tx={tx} scale={scale} />
            ))}
          </View>
          <View
            style={[
              styles.frame,
              { borderColor: status === "won" ? colors.ok : colors.ink, backgroundColor: colors.tile, ...shadow(status === "won" ? colors.ok : colors.shadowInk, 4) },
            ]}
          >
            <GestureDetector gesture={gesture}>
              <View style={{ width: gridW, height: gridH, overflow: "hidden" }} accessibilityLabel={t("nonograma.board", { w: W, h: H })}>
                <Animated.View style={[{ width: gridW, height: gridH, transformOrigin: [0, 0, 0] }, content]}>
                  {Array.from({ length: H }, (_, r) => (
                    <View key={r} style={{ flexDirection: "row" }}>
                      {Array.from({ length: W }, (_, c) => (
                        <CellView key={c} i={r * W + c} r={r} c={c} W={W} H={H} size={cell} rowClue={puzzle.rows[r]} colClue={puzzle.cols[c]} delay={(r + c) * step} reduced={reduced} />
                      ))}
                    </View>
                  ))}
                  {!reduced && puzzle.rows.map((clue, r) => <LineSweep key={`r${r}`} kind="row" index={r} clue={clue} W={W} cell={cell} length={gridW} />)}
                  {!reduced && puzzle.cols.map((clue, c) => <LineSweep key={`c${c}`} kind="col" index={c} clue={clue} W={W} cell={cell} length={gridH} />)}
                  <HintLine cell={cell} gridW={gridW} gridH={gridH} reduced={reduced} />
                </Animated.View>
              </View>
            </GestureDetector>
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

/** `stamp`: la tinta entra en 120 ms (0,6 → 1). */
const STAMP = motion.stamp();

/** Una casilla. Memo y suscrita solo a lo suyo: pintar una no vuelve a dibujar las demás. */
const CellView = memo(function CellView({ i, r, c, W, H, size, rowClue, colClue, delay, reduced }: { i: number; r: number; c: number; W: number; H: number; size: number; rowClue: LineClue; colClue: LineClue; delay: number; reduced: boolean }) {
  const { colors } = useTheme();
  const state = useNonograma((s) => shown(s, i));
  const near = useNonograma((s) => s.status === "playing" && s.cursor !== null && (Math.floor(s.cursor / W) === r || s.cursor % W === c));
  const flagged = useNonograma((s) => s.flagged.length > 0 && s.flagged.includes(i));
  const finished = useNonograma((s) => s.status !== "playing" && !s.conceal);
  const won = useNonograma((s) => s.status === "won");
  const t = useT();

  // `stamp` al pintar; al terminar, el dibujo aparece en diagonal y, si ganaste, late en ola (`celebrate`).
  const stamp = useMemo(() => (reduced ? undefined : finished ? motion.stamp(delay) : STAMP), [reduced, finished, delay]);
  const beat = useSharedValue(1);
  useEffect(() => {
    if (won && state === FILLED && !reduced) beat.value = pulse(delay, MOTION.dip);
  }, [won, state, reduced, delay, beat]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: beat.value }] }));

  const thickR = (c + 1) % 5 === 0;
  const thickB = (r + 1) % 5 === 0;
  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={t("nonograma.cell", { row: r + 1, rowClue: rowClue.join(" ") || "0", col: c + 1, colClue: colClue.join(" ") || "0", state: t(STATE_LABEL[state]) }) + (flagged ? t("nonograma.cellFlagged") : "")}
      accessibilityActions={[{ name: "activate" }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName !== "activate") return;
        const s = useNonograma.getState();
        s.beginStroke(i);
        s.endStroke();
      }}
      style={{
        width: size,
        height: size,
        backgroundColor: near ? colors.accent : colors.tile,
        // Líneas de 1 punto (no "hairline": en algunas pantallas caían entre pixeles y desaparecían).
        borderRightWidth: c < W - 1 ? (thickR ? 2 : 1) : 0,
        borderBottomWidth: r < H - 1 ? (thickB ? 2 : 1) : 0,
        borderRightColor: alpha(colors.ink, thickR ? 0.6 : 0.22),
        borderBottomColor: alpha(colors.ink, thickB ? 0.6 : 0.22),
      }}
    >
      {state === FILLED && <Animated.View entering={stamp} style={[StyleSheet.absoluteFill, { backgroundColor: colors.ink }, pulseStyle]} />}
      {state === EMPTY && <Cross size={size} color={colors.pencil} animate={!reduced} />}
      {flagged && <Animated.View entering={reduced ? undefined : FLAG} style={[StyleSheet.absoluteFill, { backgroundColor: alpha(colors.margin, 0.25), borderWidth: 2, borderColor: colors.margin }]} />}
    </View>
  );
});

const FLAG = motion.fade();
const CROSS = motion.pop();

/** La cruz: dos palitos de lápiz (`pop` al ponerla). */
export function Cross({ size, color, animate = false }: { size: number; color: string; animate?: boolean }) {
  const inner = size * 0.56;
  const len = inner * 1.3;
  const thick = Math.max(1.5, size * 0.075);
  const bar = { position: "absolute" as const, left: (inner - len) / 2, top: (inner - thick) / 2, width: len, height: thick, borderRadius: thick, backgroundColor: color };
  return (
    <Animated.View entering={animate ? CROSS : undefined} pointerEvents="none" style={{ position: "absolute", left: (size - inner) / 2, top: (size - inner) / 2, width: inner, height: inner }}>
      <View style={[bar, { transform: [{ rotate: "45deg" }] }]} />
      <View style={[bar, { transform: [{ rotate: "-45deg" }] }]} />
    </Animated.View>
  );
}

const rowDone = (W: number, r: number, clue: LineClue) => (s: ReturnType<typeof useNonograma.getState>) => s.board.length > 0 && lineDone(rowCells(s.board, W, r), clue);
const colDone = (W: number, c: number, clue: LineClue) => (s: ReturnType<typeof useNonograma.getState>) => s.board.length > 0 && lineDone(colCells(s.board, W, c), clue);

/** Pista de una fila: se apaga cuando la línea coincide y se resalta con la casilla tocada. */
const RowClue = memo(function RowClue({ r, clue, W, layout, ty, scale }: { r: number; clue: LineClue; W: number; layout: BoardLayout; ty: SharedValue<number>; scale: SharedValue<number> }) {
  const { colors } = useTheme();
  const sel = useMemo(() => rowDone(W, r, clue), [W, r, clue]);
  const done = useNonograma(sel);
  const near = useNonograma((s) => s.status === "playing" && s.cursor !== null && Math.floor(s.cursor / W) === r);
  const hinted = useNonograma((s) => { const h = hintLineOf(s); return h?.line === "row" && h.index === r; });
  const beat = useHintBeat(hinted);
  const finished = useNonograma((s) => s.status !== "playing" && !s.conceal);
  const { cell, font } = layout;
  const place = useAnimatedStyle(() => ({ top: ty.value + scale.value * r * cell, height: scale.value * cell }));
  return (
    <Animated.View style={[styles.rowClue, place]}>
      <Animated.View style={[styles.rowClueInner, beat, { opacity: (done || finished) && !hinted ? 0.35 : 1, backgroundColor: hinted ? colors.cluePresentBg : near ? colors.accent : alpha(colors.accent, 0), transitionProperty: ["opacity", "backgroundColor"], transitionDuration: DURATION.base }]}>
        <Text maxFontSizeMultiplier={1} numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: fonts.display, fontSize: font, color: colors.ink, fontVariant: ["tabular-nums"] }}>
          {(clue.length ? clue : [0]).join(" ")}
        </Text>
      </Animated.View>
    </Animated.View>
  );
});

/** Pista de una columna: los números de arriba a abajo. */
const ColClue = memo(function ColClue({ c, clue, W, layout, tx, scale }: { c: number; clue: LineClue; W: number; layout: BoardLayout; tx: SharedValue<number>; scale: SharedValue<number> }) {
  const { colors } = useTheme();
  const sel = useMemo(() => colDone(W, c, clue), [W, c, clue]);
  const done = useNonograma(sel);
  const near = useNonograma((s) => s.status === "playing" && s.cursor !== null && s.cursor % W === c);
  const hinted = useNonograma((s) => { const h = hintLineOf(s); return h?.line === "col" && h.index === c; });
  const beat = useHintBeat(hinted);
  const finished = useNonograma((s) => s.status !== "playing" && !s.conceal);
  const { cell, font, lineH } = layout;
  const place = useAnimatedStyle(() => ({ left: tx.value + scale.value * c * cell, width: scale.value * cell }));
  return (
    <Animated.View style={[styles.colClue, place]}>
      <Animated.View style={[styles.colClueInner, beat, { opacity: (done || finished) && !hinted ? 0.35 : 1, backgroundColor: hinted ? colors.cluePresentBg : near ? colors.accent : alpha(colors.accent, 0), transitionProperty: ["opacity", "backgroundColor"], transitionDuration: DURATION.base }]}>
        {(clue.length ? clue : [0]).map((n, k) => (
          <Text key={k} maxFontSizeMultiplier={1} style={{ fontFamily: fonts.display, fontSize: font, lineHeight: lineH, color: colors.ink, fontVariant: ["tabular-nums"], textAlign: "center" }}>
            {n}
          </Text>
        ))}
      </Animated.View>
    </Animated.View>
  );
});

/** `confirm`: la pista de la línea señalada late una vez al aparecer. */
function useHintBeat(hinted: boolean) {
  const reduced = useMotionReduced();
  const beat = useSharedValue(1);
  useOnChange(hinted, (h) => {
    if (h && !reduced) beat.value = pulse(0);
  });
  return useAnimatedStyle(() => ({ transform: [{ scale: beat.value }] }));
}

/** La fila o columna que señala la pista: el resaltado de las pistas sobre la línea (`fade`). Nunca pinta. */
function HintLine({ cell, gridW, gridH, reduced }: { cell: number; gridW: number; gridH: number; reduced: boolean }) {
  const { colors } = useTheme();
  const line = useNonograma((s) => hintLineOf(s));
  if (!line) return null;
  const box = line.line === "row" ? { left: 0, top: line.index * cell, width: gridW, height: cell } : { top: 0, left: line.index * cell, height: gridH, width: cell };
  return (
    <Animated.View
      key={`${line.line}${line.index}`}
      entering={reduced ? undefined : HINT_IN}
      pointerEvents="none"
      style={[{ position: "absolute", borderWidth: 2, borderColor: colors.cluePresent, backgroundColor: alpha(colors.cluePresentBg, 0.45) }, box]}
    />
  );
}
const HINT_IN = motion.fade();

/** `confirm`: una pasada de color sobre la fila o columna que acaba de quedar completa. */
const LineSweep = memo(function LineSweep({ kind, index, clue, W, cell, length }: { kind: "row" | "col"; index: number; clue: LineClue; W: number; cell: number; length: number }) {
  const { colors } = useTheme();
  const sel = useMemo(() => (kind === "row" ? rowDone(W, index, clue) : colDone(W, index, clue)), [kind, W, index, clue]);
  const done = useNonograma(sel);
  const p = useSharedValue(0);
  const band = Math.max(cell * 3, length * 0.45);
  useOnChange(done, (d) => {
    if (!d || clue.length === 0 || useNonograma.getState().status !== "playing") return;
    p.value = 0;
    p.value = withTiming(1, timing("slow"));
  });
  const style = useAnimatedStyle(() => {
    const offset = -band + p.value * (length + band);
    return {
      opacity: interpolate(p.value, [0, 0.05, 0.75, 1], [0, 1, 1, 0]),
      transform: kind === "row" ? [{ translateX: offset }] : [{ translateY: offset }],
    };
  });
  const box = kind === "row" ? { left: 0, top: index * cell, width: length, height: cell } : { top: 0, left: index * cell, height: length, width: cell };
  return (
    <View pointerEvents="none" style={[{ position: "absolute", overflow: "hidden" }, box]}>
      <Animated.View style={[kind === "row" ? { width: band, height: "100%" } : { height: band, width: "100%" }, { backgroundColor: alpha(colors.ok, 0.32) }, style]} />
    </View>
  );
});

/** Vibración suave cada vez que se completa una fila o columna más. */
function LineFeedback({ puzzle }: { puzzle: NonogramaPuzzle }) {
  const count = useNonograma((s) => {
    if (s.status !== "playing" || s.board.length !== puzzle.solution.length) return 0;
    let n = 0;
    for (let r = 0; r < puzzle.height; r++) if (puzzle.rows[r].length && lineDone(rowCells(s.board, puzzle.width, r), puzzle.rows[r])) n++;
    for (let c = 0; c < puzzle.width; c++) if (puzzle.cols[c].length && lineDone(colCells(s.board, puzzle.width, c), puzzle.cols[c])) n++;
    return n;
  });
  useOnChange(count, (n, before) => {
    if (n > before) haptic("line");
  });
  // Sonido al pintar o tachar (como la web; solo con «Sonido» prendido).
  const board = useNonograma((s) => (s.status === "playing" ? s.board : null));
  useOnChange(board, (b, before) => b && before && sound("tap"));
  return null;
}

const styles = StyleSheet.create({
  frame: { borderWidth: BORDER, borderRadius: 3, overflow: "hidden" },
  rowClue: { position: "absolute", left: 0, right: 0 },
  rowClueInner: { flex: 1, justifyContent: "center", alignItems: "flex-end", paddingRight: 6, paddingLeft: 2, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  colClue: { position: "absolute", top: 0, bottom: 0 },
  colClueInner: { flex: 1, justifyContent: "flex-end", alignItems: "center", paddingBottom: 3, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
});
