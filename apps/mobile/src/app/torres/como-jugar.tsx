import { Stack, useRouter } from "expo-router";
import { View, useWindowDimensions } from "react-native";
import { Button, Screen, Text } from "@/components/ui";
import { Board } from "@/games/torres/components/board";
import { TorresPreview } from "@/games/torres/components/preview";
import { useT } from "@/lib/i18n";

// Ejemplo de 4×4 con todas sus pistas, resuelto (el mismo que la web).
const SOLUTION = [2, 1, 4, 3, 3, 4, 1, 2, 4, 2, 3, 1, 1, 3, 2, 4];
const CLUES = { top: [3, 2, 1, 2], bottom: [2, 2, 3, 1], left: [2, 2, 1, 3], right: [2, 2, 3, 1] };
const EMPTY = new Array<number>(16).fill(0);
const TIPS = ["torres.tip1", "torres.tip2", "torres.tip3", "torres.tip4"] as const;

export default function HowToTorres() {
  const router = useRouter();
  const t = useT();
  const { width } = useWindowDimensions();
  return (
    <>
      <Stack.Screen options={{ title: t("torres.howToTitle") }} />
      <Screen contentStyle={{ gap: 18 }}>
        <Text variant="display">{t("torres.howToHeading")}</Text>
        <Text>{t("torres.howToIntro")}</Text>
        <View style={{ gap: 8 }}>
          <TorresPreview />
          <Text variant="small" style={{ textAlign: "center" }}>{t("torres.previewCaption")}</Text>
        </View>

        <Text variant="title">{t("torres.fullBoardTitle")}</Text>
        <Board size={4} clues={CLUES} givens={EMPTY} values={SOLUTION} readOnly width={Math.min(280, width - 36)} />
        <Text>{t("torres.fullBoard")}</Text>

        <Text variant="title">{t("torres.startTitle")}</Text>
        <View style={{ gap: 6 }}>
          {TIPS.map((k) => (
            <Text key={k}>•  {t(k)}</Text>
          ))}
        </View>
        <Text>{t("torres.givens")}</Text>

        <Text variant="title">{t("torres.toolsTitle")}</Text>
        <Text>{t("torres.tools1")}</Text>
        <Text>{t("torres.tools2")}</Text>

        <Text variant="title">{t("torres.worldsTitle")}</Text>
        <Text>{t("torres.worlds")}</Text>
        <Button title={t("torres.startPlaying")} size="lg" onPress={() => router.navigate("/torres")} />
      </Screen>
    </>
  );
}
