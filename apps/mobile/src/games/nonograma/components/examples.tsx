import { StyleSheet, View } from "react-native";
import { Row, Text } from "@/components/ui";
import { useTheme } from "@/theme/theme";
import { alpha, fonts } from "@/theme/tokens";
import { Cross } from "./board";

/** Línea de ejemplo para "Cómo se juega": "#" pintada, "x" cruz, "." vacía, "s" pintada de sugerencia. */
export function ExampleLine({ clue, cells, label }: { clue: string; cells: string; label: string }) {
  const { colors } = useTheme();
  const size = 36;
  return (
    <Row gap={12} accessible accessibilityRole="image" accessibilityLabel={label}>
      <Text style={{ width: 44, textAlign: "right", fontFamily: fonts.display, fontSize: 18, color: colors.ink }}>{clue}</Text>
      <View style={[styles.line, { borderColor: colors.ink, backgroundColor: colors.tile }]}>
        {[...cells].map((ch, i) => (
          <View
            key={i}
            style={{
              width: size,
              height: size,
              borderRightWidth: i < cells.length - 1 ? StyleSheet.hairlineWidth : 0,
              borderRightColor: alpha(colors.ink, 0.2),
              backgroundColor: ch === "#" ? colors.ink : ch === "s" ? colors.cluePresentBg : "transparent",
            }}
          >
            {ch === "x" && <Cross size={size} color={colors.pencil} />}
          </View>
        ))}
      </View>
    </Row>
  );
}

const HEART = [".#.#.", "#####", "#####", ".###.", "..#.."];
const ROWS = ["1 1", "5", "5", "3", "1"];
const COLS = ["2", "4", "4", "4", "2"];
/** Filas ya resueltas en la vista previa: las tres primeras. */
const SOLVED_ROWS = 3;

/** Un corazón de 5×5 a medio pintar, con sus pistas (la vista previa de la web). */
export function NonogramaPreview({ cell = 22 }: { cell?: number }) {
  const { colors } = useTheme();
  const clue = { fontFamily: fonts.display, fontSize: 12, color: colors.pencil } as const;
  return (
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ alignSelf: "center" }}>
      <Row gap={2} style={{ marginLeft: 30 }}>
        {COLS.map((c, i) => (
          <Text key={i} style={[clue, { width: cell, textAlign: "center" }]}>{c}</Text>
        ))}
      </Row>
      {HEART.map((row, r) => {
        const solved = r < SOLVED_ROWS;
        return (
          <Row key={r} gap={2} style={{ marginTop: 2 }}>
            <Text style={[clue, { width: 28, textAlign: "right", opacity: solved ? 0.45 : 1 }]}>{ROWS[r]}</Text>
            {[...row].map((ch, c) => (
              <View key={c} style={{ width: cell, height: cell, borderRadius: 3, borderWidth: 1, borderColor: alpha(colors.ink, 0.7), backgroundColor: solved && ch === "#" ? colors.ink : colors.tile }}>
                {solved && ch === "." && <Cross size={cell - 2} color={colors.pencil} />}
              </View>
            ))}
          </Row>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: "row", borderWidth: 2, borderRadius: 3, overflow: "hidden" },
});
