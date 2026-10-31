import type { ReactNode } from "react";
import { View } from "react-native";
import { Row, Text } from "@/components/ui";

/** Título del tablero ("Nivel 3", "Cifra del día #10") con vidas y reloj a la derecha. */
export function GameHeader({ title, subtitle, right }: { title: string; subtitle: string; right?: ReactNode }) {
  return (
    <Row style={{ justifyContent: "space-between", alignItems: "flex-end" }} gap={12}>
      <View style={{ flex: 1 }}>
        <Text variant="small">{subtitle}</Text>
        <Text variant="display" accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
      </View>
      {right && <Row gap={14} style={{ paddingBottom: 4 }}>{right}</Row>}
    </Row>
  );
}
