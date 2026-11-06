import * as WebBrowser from "expo-web-browser";
import { Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { motion } from "@/lib/motion";
import { NotFound } from "@/components/not-found";
import { Button, Card, Icon, Screen, Text } from "@/components/ui";
import { SHARE_URL } from "@/config";
import { gameById } from "@/games/registry";
import { useGameCopy, useT } from "@/lib/i18n";
import { useTheme } from "@/theme/theme";

/** Juegos que todavía no tienen versión nativa: se pueden jugar en la web mientras tanto. */
export default function Soon() {
  const { colors } = useTheme();
  const { game } = useLocalSearchParams<{ game: string }>();
  const meta = gameById(game);
  const t = useT();
  const copy = useGameCopy(game);
  if (!meta) return <NotFound title={t("shell.noGame")} />;
  return (
    <>
      <Stack.Screen options={{ title: copy.name }} />
      <Screen>
        <Animated.View entering={motion.appear()}>
          <Card raised style={{ gap: 10, alignItems: "flex-start" }}>
            <View style={{ backgroundColor: colors.cluePresentBg, borderRadius: 999, padding: 10 }}>
              <Icon name="construct-outline" size={24} color={colors.cluePresent} />
            </View>
            <Text variant="display">{t("shell.soon")}</Text>
            <Text variant="muted">{copy.tagline}</Text>
            <Text>{t("shell.soonBody", { game: copy.name })}</Text>
          </Card>
        </Animated.View>
        <Button title={t("shell.playOnWeb", { game: copy.name })} icon="open-outline" size="lg" onPress={() => WebBrowser.openBrowserAsync(`${SHARE_URL}/${meta.id}`).catch(() => {})} />
      </Screen>
    </>
  );
}
