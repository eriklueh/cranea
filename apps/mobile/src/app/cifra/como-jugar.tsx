import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { Button, Row, Screen, Text } from "@/components/ui";
import { PegLegend } from "@/games/cifra/components/cifra-game";
import { ClueRow, DigitTile } from "@/games/cifra/components/tiles";
import { useT } from "@/lib/i18n";

const example = [
  { guess: [1, 0, 7], feedback: { exact: 0, present: 3 } },
  { guess: [0, 7, 1], feedback: { exact: 0, present: 3 } },
];

export default function HowToCifra() {
  const router = useRouter();
  const t = useT();
  return (
    <>
      <Stack.Screen options={{ title: t("cifra.howToTitle") }} />
      <Screen contentStyle={{ gap: 18 }}>
        <Text variant="display">{t("cifra.howToHeading")}</Text>
        <Text>{t("cifra.howToIntro")}</Text>
        <View style={{ gap: 8 }}>
          {example.map((c, i) => <ClueRow key={i} clue={c} />)}
          <PegLegend />
          <Text variant="small" style={{ textAlign: "center" }}>{t("cifra.howToLegend")}</Text>
        </View>
        <Text variant="title">{t("cifra.howToSolveTitle")}</Text>
        <Text>{t("cifra.howToSolve")}</Text>
        <Text variant="title">{t("cifra.howToMarksTitle")}</Text>
        <Row gap={10} style={{ justifyContent: "center" }}>
          <DigitTile digit={3} mark="out" />
          <DigitTile digit={5} mark="in" />
          <DigitTile digit={8} mark="here" />
        </Row>
        <Text>{t("cifra.howToMarks")}</Text>
        <Text variant="title">{t("cifra.howToWorldsTitle")}</Text>
        <Text>{t("cifra.howToWorlds")}</Text>
        <Button title={t("cifra.startPlaying")} size="lg" onPress={() => router.navigate("/cifra")} />
      </Screen>
    </>
  );
}
