import { View } from "react-native";
import { Row, Text, shadow } from "@/components/ui";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";

/** Arte chico para la tarjeta de inicio y el instructivo: una fila de torres con sus dos pistas (como la web). */
const ROW = [2, 1, 4, 3];

export function TorresPreview({ unit = 32 }: { unit?: number }) {
  const { colors } = useTheme();
  const clue = (
    <View style={{ width: unit * 0.88, height: unit * 0.88, borderRadius: unit, alignItems: "center", justifyContent: "center", backgroundColor: colors.clueExactBg, marginBottom: unit * 0.15 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: unit * 0.5, color: colors.clueExact }}>2</Text>
    </View>
  );
  return (
    <Row gap={8} style={{ alignItems: "flex-end", justifyContent: "center" }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {clue}
      <Row gap={6} style={{ alignItems: "flex-end" }}>
        {ROW.map((h, i) => (
          <View key={i} style={{ alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: unit,
                height: (h * 0.6 + 0.4) * unit * 0.5,
                borderTopLeftRadius: radius.md,
                borderTopRightRadius: radius.md,
                borderWidth: 2,
                borderBottomWidth: 3,
                borderColor: colors.ink,
                borderBottomColor: colors.gridLine,
                backgroundColor: colors.tile,
              }}
            />
            <View style={{ width: unit, height: unit, borderRadius: radius.md, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.tile, alignItems: "center", justifyContent: "center", ...shadow(colors.shadowInk, 2) }}>
              <Text style={{ fontFamily: fonts.display, fontSize: unit * 0.56, color: colors.ink }}>{h}</Text>
            </View>
          </View>
        ))}
      </Row>
      {clue}
    </Row>
  );
}
