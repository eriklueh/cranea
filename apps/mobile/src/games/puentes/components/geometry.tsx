import type { Edge, Island, PuentesPuzzle } from "@cranea/core/puentes";
import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

/** Medidas en unidades de celda (las mismas que la web: geometry.tsx). */
export const ISLAND_R = 0.4;
const GAP = 0.11;
/** Radio mínimo para tocar o arrastrar una isla: 44 pt de diámetro. */
export const HIT_RADIUS = 22;

export type Dir = "up" | "down" | "left" | "right";
export type Neighbors = Partial<Record<Dir, { edge: number; other: number }>>[];

/** Para cada isla, la conexión y la vecina en cada dirección. */
export function neighborMap(p: Pick<PuentesPuzzle, "islands" | "edges">): Neighbors {
  const map = p.islands.map(() => ({}) as Neighbors[number]);
  p.edges.forEach((e, edge) => {
    map[e.a][e.horizontal ? "right" : "down"] = { edge, other: e.b };
    map[e.b][e.horizontal ? "left" : "up"] = { edge, other: e.a };
  });
  return map;
}

export const dirFromDelta = (dx: number, dy: number): Dir => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");

/** Ancho del tablero en pt: todo el ancho disponible, sin agrandar de más los tableros chicos (como la web). */
export function useBoardWidth(columns: number, gutter = 24) {
  const { width } = useWindowDimensions();
  return Math.floor(Math.min(Math.min(width, 560) - gutter, columns * 52));
}

const center = (isl: Island, cell: number) => ({ x: (isl.c + 0.5) * cell, y: (isl.r + 0.5) * cell });

/** Extremos de la conexión en pt, recortados en el borde de cada isla. a siempre queda arriba o a la izquierda. */
export function edgeEnds(islands: readonly Island[], e: Edge, cell: number) {
  const a = center(islands[e.a], cell);
  const b = center(islands[e.b], cell);
  const r = ISLAND_R * cell;
  return e.horizontal ? { x1: a.x + r, y1: a.y, x2: b.x - r, y2: b.y } : { x1: a.x, y1: a.y + r, x2: b.x, y2: b.y - r };
}

/**
 * Qué hay bajo el dedo. Primero el círculo de una isla; después la franja de una conexión
 * (también vacía: tocarla tiende el primer puente); por último la isla más cercana a menos de 22 pt.
 */
export function hitTest(p: Pick<PuentesPuzzle, "islands" | "edges">, cell: number, x: number, y: number, bridges: readonly number[]): { island: number } | { edge: number } | null {
  let near = -1;
  let nearD = Infinity;
  p.islands.forEach((isl, i) => {
    const c = center(isl, cell);
    const d = Math.hypot(c.x - x, c.y - y);
    if (d < nearD) {
      nearD = d;
      near = i;
    }
  });
  if (near >= 0 && nearD <= (ISLAND_R + 0.05) * cell) return { island: near };

  const band = Math.min(0.45 * cell, Math.max(0.3 * cell, 12));
  let best = -1;
  let bestScore = Infinity;
  p.edges.forEach((e, i) => {
    const { x1, y1, x2, y2 } = edgeEnds(p.islands, e, cell);
    const along = e.horizontal ? x : y;
    const across = e.horizontal ? Math.abs(y - y1) : Math.abs(x - x1);
    if (across > band || along < (e.horizontal ? x1 : y1) || along > (e.horizontal ? x2 : y2)) return;
    // Donde se cruzan dos franjas gana la más cercana, y a igual distancia la que ya tiene puentes.
    const score = across - (bridges[i] > 0 ? 0.5 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  if (best >= 0) return { edge: best };
  if (near >= 0 && nearD <= Math.max(HIT_RADIUS, 0.5 * cell)) return { island: near };
  return null;
}

/** Isla para empezar a arrastrar: la del círculo o la más cercana a menos de 22 pt. */
export function islandNear(p: Pick<PuentesPuzzle, "islands">, cell: number, x: number, y: number) {
  let near = -1;
  let nearD = Infinity;
  p.islands.forEach((isl, i) => {
    const c = center(isl, cell);
    const d = Math.hypot(c.x - x, c.y - y);
    if (d < nearD) {
      nearD = d;
      near = i;
    }
  });
  return nearD <= Math.max(HIT_RADIUS, (ISLAND_R + 0.05) * cell) ? near : -1;
}

/**
 * Uno o dos trazos paralelos según la cantidad de puentes. Con `animate`, el primero se dibuja desde
 * la isla `from` y el segundo se separa del primero (como anim-draw / anim-split de la web).
 */
export function BridgeLines({ islands, edge, count, cell, color, thin, opacity = 1, animate = false, from = "a" }: {
  islands: readonly Island[];
  edge: Edge;
  count: number;
  cell: number;
  color: string;
  thin?: boolean;
  opacity?: number;
  animate?: boolean;
  from?: "a" | "b";
}) {
  if (count <= 0) return null;
  const { x1, y1, x2, y2 } = edgeEnds(islands, edge, cell);
  const t = thin ? Math.max(1.5, 0.04 * cell) : Math.max(2.5, 0.09 * cell);
  const gap = Math.max(t * 0.8, GAP * cell);
  const offsets = count === 1 ? [0] : [-gap, gap];
  const len = edge.horizontal ? x2 - x1 : y2 - y1;
  return (
    <>
      {offsets.map((o, k) => (
        <Line key={k} horizontal={edge.horizontal} x={x1} y={y1} len={len} t={t} offset={o} color={color} opacity={opacity} draw={animate && k === 0} split={animate} fromEnd={from === "b"} />
      ))}
    </>
  );
}

function Line({ horizontal, x, y, len, t, offset, color, opacity, draw, split, fromEnd }: {
  horizontal: boolean; x: number; y: number; len: number; t: number; offset: number; color: string; opacity: number; draw: boolean; split: boolean; fromEnd: boolean;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(draw && !reduced ? 0 : 1);
  const shift = useSharedValue(split && !reduced ? 0 : offset);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [progress]);
  useEffect(() => {
    shift.value = split && !reduced ? withTiming(offset, { duration: 180, easing: Easing.out(Easing.cubic) }) : offset;
  }, [offset, split, reduced, shift]);
  const style = useAnimatedStyle(() =>
    horizontal ? { transform: [{ translateY: shift.value }, { scaleX: progress.value }] } : { transform: [{ translateX: shift.value }, { scaleY: progress.value }] },
  );
  const box = horizontal
    ? { left: x, top: y - t / 2, width: len, height: t, transformOrigin: [fromEnd ? len : 0, t / 2, 0] }
    : { left: x - t / 2, top: y, width: t, height: len, transformOrigin: [t / 2, fromEnd ? len : 0, 0] };
  return <Animated.View pointerEvents="none" style={[{ position: "absolute", borderRadius: t / 2, backgroundColor: color, opacity }, box, style]} />;
}
