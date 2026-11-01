import { findEdges, islandsFromRows, type Bridges } from "@cranea/core/puentes";
import { Text as RNText, View } from "react-native";
import { useTheme } from "@/theme/theme";
import { fonts } from "@/theme/tokens";
import { BridgeLines, ISLAND_R } from "./geometry";

/** Tablero de solo lectura: para ejemplos y la tarjeta de inicio (preview.tsx de la web). */
export function StaticBoard({ rows, bridges, done = [], width, label }: {
  rows: readonly string[];
  /** Puentes en el orden de findEdges. */
  bridges?: Bridges;
  /** Islas que se muestran completas. */
  done?: readonly number[];
  width: number;
  label?: string;
}) {
  const { colors } = useTheme();
  const islands = islandsFromRows(rows);
  const edges = findEdges(islands);
  const cell = width / rows[0].length;
  const size = 2 * ISLAND_R * cell;
  return (
    <View
      style={{ width, height: cell * rows.length }}
      accessible={Boolean(label)}
      accessibilityRole={label ? "image" : undefined}
      accessibilityLabel={label}
      importantForAccessibility={label ? "yes" : "no-hide-descendants"}
    >
      {edges.map((e, i) => (
        <BridgeLines key={i} islands={islands} edge={e} cell={cell} count={bridges?.[i] ?? 0} color={colors.ink} />
      ))}
      {islands.map((isl, i) => {
        const complete = done.includes(i);
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: (isl.c + 0.5) * cell - size / 2,
              top: (isl.r + 0.5) * cell - size / 2,
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: Math.max(1.5, 0.08 * cell),
              borderColor: complete ? colors.ok : colors.ink,
              backgroundColor: complete ? colors.ok : colors.tile,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RNText allowFontScaling={false} style={{ fontFamily: fonts.display, fontSize: Math.round(cell * 0.48), color: complete ? colors.paper : colors.ink, includeFontPadding: false }}>
              {isl.n}
            </RNText>
          </View>
        );
      })}
    </View>
  );
}

/** Tablero de ejemplo con solución única. Conexiones: 4–2, 4–3, 2–1, 3–1. */
export const EXAMPLE_ROWS = ["4...2", ".....", "3...1"];
export const EXAMPLE_SOLUTION = [2, 2, 0, 1];

/** Arte chico para la tarjeta del juego en el inicio. */
export function PuentesPreview() {
  return (
    <View style={{ alignItems: "center", marginTop: 12 }}>
      <StaticBoard rows={EXAMPLE_ROWS} bridges={EXAMPLE_SOLUTION} done={[0, 1, 2, 3]} width={120} />
    </View>
  );
}
