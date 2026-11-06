import { bridgeCounts, type Island, type PuentesPuzzle } from "@cranea/core/puentes";
import { memo, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { StyleSheet, Text as RNText, View, type AccessibilityActionEvent } from "react-native";
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture, type PanGesture } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { haptic } from "@/lib/haptics";
import { useT } from "@/lib/i18n";
import { sound } from "@/lib/sound";
import { useOnChange } from "@/lib/hooks";
import { celebrateStep, MOTION, pulse, shake as shakeTo, timing, useMotionReduced, useShake } from "@/lib/motion";
import { useTheme } from "@/theme/theme";
import { alpha, fonts } from "@/theme/tokens";
import { usePuentes } from "../store";
import { BridgeLines, dirFromDelta, hitTest, islandNear, ISLAND_R, neighborMap, type Dir } from "./geometry";

/** Lo que hace el tablero con cada gesto. Lo llena el tablero en cada render; los gestos lo llaman en JS. */
export interface BoardInput {
  start: (x: number, y: number) => void;
  move: (x: number, y: number, dx: number, dy: number) => void;
  end: () => void;
  tap: (x: number, y: number) => void;
}

const noop: BoardInput = { start: () => {}, move: () => {}, end: () => {}, tap: () => {} };

/**
 * Gestos del tablero: arrastrar desde una isla (pan) o tocar (tap), lo que se reconozca primero.
 * Se crean en la pantalla para que el ScrollView espere al pan: arrastrar sobre el tablero nunca lo desplaza.
 */
export function useBoardGesture(enabled: boolean) {
  const input = useRef<BoardInput>(noop);
  const pan = usePanGesture({
    runOnJS: true,
    disableReanimated: true,
    enabled,
    minDistance: 4,
    shouldCancelWhenOutside: false,
    onActivate: (e) => input.current.start(e.x - e.translationX, e.y - e.translationY),
    onUpdate: (e) => input.current.move(e.x, e.y, e.translationX, e.translationY),
    onFinalize: () => input.current.end(),
  });
  const tap = useTapGesture({
    runOnJS: true,
    disableReanimated: true,
    enabled,
    maxDistance: 12,
    onActivate: (e) => input.current.tap(e.x, e.y),
  });
  const gesture = useCompetingGestures(pan, tap);
  return { pan, gesture, input };
}

type Origin = { edge: number; island: number } | null;
const DIR_LABEL = { up: "puentes.dirUp", down: "puentes.dirDown", left: "puentes.dirLeft", right: "puentes.dirRight" } as const satisfies Record<Dir, string>;

export function PuentesBoard({ puzzle, width, board }: { puzzle: PuentesPuzzle; width: number; board: { pan: PanGesture; gesture: ReturnType<typeof useBoardGesture>["gesture"]; input: RefObject<BoardInput> } }) {
  const { colors } = useTheme();
  const t = useT();
  // Hasta que el juego arranca este tablero, el store puede tener el anterior: se dibuja vacío.
  const live = usePuentes((s) => s.puzzle === puzzle);
  const storeBridges = usePuentes((s) => s.bridges);
  const bridges = useMemo(() => (live ? storeBridges : puzzle.edges.map(() => 0)), [live, storeBridges, puzzle]);
  const wrong = usePuentes((s) => s.wrong);
  const selected = usePuentes((s) => (live ? s.selected : null));
  const status = usePuentes((s) => s.status);
  const mistakes = usePuentes((s) => s.mistakes);
  const notice = usePuentes((s) => s.notice);
  const { cycle, select } = usePuentes.getState();
  const playing = live && status === "playing";
  const won = live && status === "won";
  const reduced = useMotionReduced();

  const { width: W, height: H, islands, edges } = puzzle;
  const cell = width / W;
  const height = cell * H;
  const neighbors = useMemo(() => neighborMap(puzzle), [puzzle]);
  const counts = useMemo(() => bridgeCounts(islands, edges, bridges), [islands, edges, bridges]);
  const [preview, setPreview] = useState<number | null>(null);
  // Isla desde la que se tendió el último puente: el trazo se dibuja desde ahí.
  const [origin, setOrigin] = useState<Origin>(null);
  // Arrastre en curso: dónde empezó, desde qué isla (-1 si no hay ninguna cerca) y hacia qué conexión apunta.
  const drag = useRef<{ x: number; y: number; island: number; edge: number | null; moved: boolean } | null>(null);

  // Marca que sigue al dedo mientras se arrastra, sin volver a renderizar.
  const gx = useSharedValue(0);
  const gy = useSharedValue(0);
  const go = useSharedValue(0);
  const ghost = useAnimatedStyle(() => ({ opacity: go.value, transform: [{ translateX: gx.value }, { translateY: gy.value }] }));

  // Sacudida al revisar con errores; empujoncito más suave para un puente que cruzaría otro.
  const shake = useShake(live ? mistakes : 0);
  const nudge = useSharedValue(0);
  const nudgeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: nudge.value }] }));
  useOnChange(mistakes, (n, before) => live && n > before && haptic("invalid"));
  useOnChange(notice, (n) => {
    if (!live || n?.kind !== "blocked") return;
    haptic("invalid");
    nudge.value = shakeTo(true);
  });
  useOnChange(bridges, () => {
    if (!live || status !== "playing") return;
    haptic("tap");
    sound("tap");
  });
  useOnChange(won, (w) => w && haptic("win"));

  const link = (from: number, edge: number) => {
    setOrigin({ edge, island: from });
    cycle(edge);
  };

  const tapIsland = (i: number) => {
    if (!playing) return;
    if (selected === null || selected === i) {
      select(selected === i ? null : i);
      return;
    }
    const n = Object.values(neighbors[selected]).find((v) => v?.other === i);
    if (n) link(selected, n.edge);
    else select(i);
  };

  const hideGhost = () => {
    go.value = withTiming(0, timing("fast", "in"));
  };

  board.input.current = {
    start: (x, y) => {
      if (!playing) return;
      drag.current = { x, y, island: islandNear(puzzle, cell, x, y), edge: null, moved: false };
    },
    move: (x, y, dx, dy) => {
      const d = drag.current;
      if (!d) return;
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      // Lejos de una isla no se tiende nada, pero un deslizamiento largo ya no cuenta como toque.
      if (d.island < 0) {
        if (dist >= 12) d.moved = true;
        return;
      }
      if (dist < Math.max(10, cell * 0.35)) {
        if (d.moved && d.edge !== null) {
          d.edge = null;
          setPreview(null);
        }
        go.value = 0;
        return;
      }
      d.moved = true;
      gx.value = x;
      gy.value = y;
      go.value = 1;
      const edge = neighbors[d.island][dirFromDelta(dx, dy)]?.edge ?? null;
      if (edge === d.edge) return;
      d.edge = edge;
      setPreview(edge);
      if (edge !== null) setOrigin({ edge, island: d.island });
    },
    end: () => {
      const d = drag.current;
      drag.current = null;
      setPreview(null);
      hideGhost();
      if (!d) return;
      if (d.moved) {
        if (d.edge !== null) cycle(d.edge);
      } else board.input.current.tap(d.x, d.y); // Un toque que tembló unos puntos activa el pan: vale como toque.
    },
    tap: (x, y) => {
      if (!playing) return;
      const hit = hitTest(puzzle, cell, x, y, bridges);
      if (!hit) select(null);
      else if ("island" in hit) tapIsland(hit.island);
      else link(edges[hit.edge].a, hit.edge);
    },
  };

  const selectable = selected === null ? new Set<number>() : new Set(Object.values(neighbors[selected]).map((n) => n!.other));
  const ghostSize = 0.55 * cell;

  return (
    <Animated.View style={[{ alignSelf: "center" }, shake]}>
      <Animated.View style={nudgeStyle}>
        <GestureDetector gesture={board.gesture}>
          <View style={{ width, height }} accessibilityLabel={t("puentes.board")}>
            <GridDots width={W} height={H} cell={cell} color={alpha(colors.pencil, 0.3)} />
            {edges.map((edge, i) => {
              const isGhost = preview === i;
              const removing = isGhost && bridges[i] === 2;
              const color = isGhost ? colors.pencil : live && wrong.includes(i) ? colors.margin : won ? colors.ok : colors.ink;
              return (
                <BridgeLines
                  key={i}
                  islands={islands}
                  edge={edge}
                  cell={cell}
                  count={isGhost ? (removing ? 2 : bridges[i] + 1) : bridges[i]}
                  thin={removing}
                  opacity={isGhost ? (removing ? 0.45 : 0.65) : 1}
                  color={color}
                  animate={live}
                  from={origin?.edge === i && origin.island === edge.b ? "b" : "a"}
                />
              );
            })}
            {islands.map((isl, i) => {
              const actions = (Object.keys(neighbors[i]) as Dir[]).map((dir) => ({ name: dir, label: t(DIR_LABEL[dir]) }));
              return (
                <IslandView
                  key={i}
                  island={isl}
                  cell={cell}
                  have={counts[i]}
                  selected={selected === i}
                  selectable={selectable.has(i)}
                  live={live}
                  won={won}
                  step={celebrateStep(W + H - 2)}
                  reduced={reduced}
                  playing={playing}
                  actions={playing ? [{ name: "activate", label: selected === null ? t("puentes.pick") : t("puentes.join") }, ...actions] : []}
                  onAction={(e) => {
                    const name = e.nativeEvent.actionName;
                    if (name === "activate") tapIsland(i);
                    else {
                      const n = neighbors[i][name as Dir];
                      if (n) link(i, n.edge);
                    }
                  }}
                />
              );
            })}
            <Animated.View
              pointerEvents="none"
              style={[
                { position: "absolute", left: -ghostSize / 2, top: -ghostSize / 2, width: ghostSize, height: ghostSize, borderRadius: ghostSize / 2, backgroundColor: alpha(colors.ring, 0.2), borderWidth: 2, borderColor: alpha(colors.ring, 0.45) },
                ghost,
              ]}
            />
          </View>
        </GestureDetector>
      </Animated.View>
    </Animated.View>
  );
}

/** Puntos de la grilla: ayudan a ver las líneas rectas. */
const GridDots = memo(function GridDots({ width, height, cell, color }: { width: number; height: number; cell: number; color: string }) {
  const d = Math.max(2.5, 0.09 * cell);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} importantForAccessibility="no-hide-descendants">
      {Array.from({ length: width * height }, (_, k) => (
        <View key={k} style={{ position: "absolute", left: ((k % width) + 0.5) * cell - d / 2, top: (Math.floor(k / width) + 0.5) * cell - d / 2, width: d, height: d, borderRadius: d / 2, backgroundColor: color }} />
      ))}
    </View>
  );
});

function IslandView({ island, cell, have, selected, selectable, live, won, step, reduced, playing, actions, onAction }: {
  island: Island;
  /** Paso de la ola al ganar: la ola entera dura lo mismo en 5×5 que en 11×11. */
  step: number;
  cell: number;
  have: number;
  selected: boolean;
  selectable: boolean;
  live: boolean;
  won: boolean;
  reduced: boolean;
  playing: boolean;
  actions: { name: string; label: string }[];
  onAction: (e: AccessibilityActionEvent) => void;
}) {
  const { colors } = useTheme();
  const t = useT();
  const complete = have === island.n;
  const over = have > island.n;
  const size = 2 * ISLAND_R * cell;
  const scale = useSharedValue(1);
  const ring = useSharedValue(0);

  // `confirm`: al completarse, la isla late y suelta un anillo. `celebrate`: al ganar, todas laten en una ola en diagonal.
  useOnChange(complete, (c) => {
    if (!c || !live || reduced) return;
    scale.value = pulse(0);
    ring.value = 0;
    ring.value = withTiming(1, timing("slow"));
  });
  useOnChange(won, (w) => {
    if (!w || reduced) return;
    scale.value = pulse((island.r + island.c) * step);
  });
  // La isla elegida queda apenas más grande (`fast`, sin resorte).
  useEffect(() => {
    scale.value = withTiming(selected ? MOTION.bump : 1, timing("fast"));
  }, [selected, scale]);

  const bump = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ring.value > 0 && ring.value < 1 ? 0.8 * (1 - ring.value) : 0, transform: [{ scale: 1 + ring.value * 0.6 }] }));

  const look = complete
    ? { borderColor: colors.ok, backgroundColor: colors.ok, color: colors.paper }
    : over
      ? { borderColor: colors.margin, backgroundColor: colors.tile, color: colors.margin }
      : { borderColor: colors.ink, backgroundColor: colors.tile, color: colors.ink };
  const border = Math.max(1.5, Math.min(2.5, 0.08 * cell));

  return (
    <View
      style={{ position: "absolute", left: (island.c + 0.5) * cell - size / 2, top: (island.r + 0.5) * cell - size / 2, width: size, height: size }}
      accessible
      accessibilityRole={playing ? "button" : "text"}
      accessibilityState={playing ? { selected, disabled: false } : undefined}
      accessibilityLabel={t("puentes.island", { n: island.n, row: island.r + 1, col: island.c + 1, have, state: complete ? t("puentes.islandComplete") : over ? t("puentes.islandOver") : "" })}
      accessibilityActions={actions}
      onAccessibilityAction={onAction}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: size, borderWidth: 2, borderColor: colors.ok }, ringStyle]} />
      <Animated.View style={[styles.island, { borderRadius: size / 2, borderWidth: border, backgroundColor: look.backgroundColor, borderColor: look.borderColor }, bump]}>
        {(selected || selectable) && (
          <View
            pointerEvents="none"
            style={{ position: "absolute", top: -5 - border, left: -5 - border, right: -5 - border, bottom: -5 - border, borderRadius: size, borderWidth: selected ? 3 : 2, borderColor: selected ? colors.ring : alpha(colors.ring, 0.5) }}
          />
        )}
        <RNText allowFontScaling={false} style={{ fontFamily: fonts.display, fontSize: Math.round(cell * 0.46), color: look.color, fontVariant: ["tabular-nums"], includeFontPadding: false, textAlign: "center" }}>
          {island.n}
        </RNText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  island: { flex: 1, alignItems: "center", justifyContent: "center" },
});
