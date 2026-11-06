import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { Button, Screen, Text } from "@/components/ui";
import { EXAMPLE_ROWS, EXAMPLE_SOLUTION, StaticBoard } from "@/games/puentes/components/preview";
import { useT } from "@/lib/i18n";

/** Mismos textos que la web (apps/web/src/app/puentes/como-jugar), sin la parte de teclado. */
export default function HowToPuentes() {
  const router = useRouter();
  const t = useT();
  return (
    <>
      <Stack.Screen options={{ title: t("puentes.howToTitle") }} />
      <Screen contentStyle={{ gap: 18 }}>
        <Text variant="display">{t("puentes.howToHeading")}</Text>
        <Text>{t("puentes.howToIntro")}</Text>
        <View style={{ gap: 4 }}>
          <Text>• {t("puentes.rule1")}</Text>
          <Text>• {t("puentes.rule2")}</Text>
          <Text>• {t("puentes.rule3")}</Text>
          <Text>• {t("puentes.rule4")}</Text>
        </View>
        <Text variant="title">{t("puentes.exampleTitle")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 24 }}>
          <StaticBoard rows={EXAMPLE_ROWS} width={140} label={t("puentes.exampleEmpty")} />
          <StaticBoard rows={EXAMPLE_ROWS} bridges={EXAMPLE_SOLUTION} done={[0, 1, 2, 3]} width={140} label={t("puentes.exampleSolved")} />
        </View>
        <Text>{t("puentes.example")}</Text>
        <Text variant="title">{t("puentes.buildTitle")}</Text>
        <Text>
          {t("puentes.build1")}<Text variant="bodyBold">{t("puentes.undo")}</Text>{t("puentes.build2")}<Text variant="bodyBold">{t("puentes.restart")}</Text>{t("puentes.build3")}
        </Text>
        <Text variant="title">{t("puentes.checkTitle")}</Text>
        <Text>
          <Text variant="bodyBold">{t("puentes.check")}</Text>{t("puentes.check1")}
        </Text>
        <Text variant="title">{t("puentes.worldsTitle")}</Text>
        <Text>{t("puentes.worlds")}</Text>
        <Text>{t("puentes.dailyNote")}</Text>
        <Button title={t("puentes.startPlaying")} size="lg" onPress={() => router.navigate("/puentes")} />
      </Screen>
    </>
  );
}
