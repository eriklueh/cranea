import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { Button, Screen, Text } from "@/components/ui";
import { ExampleLine, NonogramaPreview } from "@/games/nonograma/components/examples";
import { useT } from "@/lib/i18n";

/** Mismo texto que la web (apps/web/src/app/nonograma/como-jugar), con los gestos del teléfono. */
export default function HowToNonograma() {
  const router = useRouter();
  const t = useT();
  return (
    <>
      <Stack.Screen options={{ title: t("nonograma.howToTitle") }} />
      <Screen contentStyle={{ gap: 18 }}>
        <Text variant="display">{t("nonograma.howToHeading")}</Text>
        <Text>
          {t("nonograma.intro1")}<Text variant="bodyBold">3 1</Text>{t("nonograma.intro2")}
        </Text>
        <NonogramaPreview />

        <Text variant="title">{t("nonograma.deduceTitle")}</Text>
        <Text>{t("nonograma.deduce1")}</Text>
        <View style={{ gap: 8 }}>
          <ExampleLine clue="4" cells="....." label={t("nonograma.exampleEmpty")} />
          <ExampleLine clue="4" cells=".sss." label={t("nonograma.exampleMiddle")} />
        </View>
        <Text>{t("nonograma.deduce2")}</Text>
        <ExampleLine clue="1 1" cells="#x..." label={t("nonograma.exampleCross")} />
        <Text>{t("nonograma.deduce3")}</Text>

        <Text variant="title">{t("nonograma.controlsTitle")}</Text>
        <Text>• {t("nonograma.controls1a")}<Text variant="bodyBold">{t("nonograma.fill")}</Text>{t("nonograma.controls1b")}<Text variant="bodyBold">{t("nonograma.cross")}</Text>{t("nonograma.controls1c")}</Text>
        <Text>• {t("nonograma.controls2")}</Text>
        <Text>• {t("nonograma.controls3")}</Text>
        <Text>• {t("nonograma.controls4")}</Text>
        <Text>• <Text variant="bodyBold">{t("nonograma.undo")}</Text>{t("nonograma.controls5a")}<Text variant="bodyBold">{t("nonograma.clearAll")}</Text>{t("nonograma.controls5b")}</Text>
        <Text>• {t("nonograma.controls6")}</Text>

        <Text variant="title">{t("nonograma.attemptsTitle")}</Text>
        <Text>{t("nonograma.attempts1")}</Text>
        <Text>
          {t("nonograma.attempts2a")}<Text variant="bodyBold">{t("nonograma.checkWord")}</Text>{t("nonograma.attempts2b")}<Text variant="bodyBold">{t("nonograma.giveUp")}</Text>{t("nonograma.attempts2c")}
        </Text>

        <Text variant="title">{t("nonograma.worldsTitle")}</Text>
        <Text>{t("nonograma.worlds")}</Text>
        <Button title={t("nonograma.startPlaying")} size="lg" onPress={() => router.navigate("/nonograma")} />
      </Screen>
    </>
  );
}
