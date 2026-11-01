import { memo, useMemo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/theme";

/**
 * Dibujo en píxeles (la PixelArt de la web, que es un path SVG). Sin react-native-svg: cada tramo
 * pintado de una fila es una View, con bordes redondeados a píxeles enteros para que no queden rendijas.
 */
export const PixelArt = memo(function PixelArt({ rows, size, color, label, style }: { rows: readonly string[]; size: number; color?: string; label?: string; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const cell = width ? size / width : 0;
  const runs = useMemo(() => {
    const out: { left: number; top: number; width: number; height: number }[] = [];
    rows.forEach((row, r) => {
      let c = 0;
      while (c < width) {
        if (row[c] !== "#") {
          c++;
          continue;
        }
        let end = c;
        while (end < width && row[end] === "#") end++;
        const left = Math.round(c * cell);
        const top = Math.round(r * cell);
        out.push({ left, top, width: Math.round(end * cell) - left, height: Math.round((r + 1) * cell) - top });
        c = end;
      }
    });
    return out;
  }, [rows, width, cell]);
  return (
    <View
      style={[{ width: Math.round(size), height: Math.round(height * cell) }, style]}
      accessible={Boolean(label)}
      accessibilityRole={label ? "image" : undefined}
      accessibilityLabel={label}
      importantForAccessibility={label ? "yes" : "no-hide-descendants"}
    >
      {runs.map((run, i) => (
        <View key={i} style={{ position: "absolute", ...run, backgroundColor: color ?? colors.ink }} />
      ))}
    </View>
  );
});

/** Miniatura para la grilla de niveles del mapa (celdas de ~44 pt). */
export function PixelArtThumb({ rows }: { rows: readonly string[] }) {
  return <PixelArt rows={rows} size={26} style={{ marginBottom: 4 }} />;
}

export const solutionRows = (solution: readonly boolean[], width: number) =>
  Array.from({ length: solution.length / width }, (_, r) =>
    solution
      .slice(r * width, (r + 1) * width)
      .map((f) => (f ? "#" : "."))
      .join(""),
  );
