import * as WebBrowser from "expo-web-browser";
import { Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { NotFound } from "@/components/not-found";
import { Button, Card, Icon, Screen, Text } from "@/components/ui";
import { SHARE_URL } from "@/config";
import { gameById } from "@/games/registry";
import { useTheme } from "@/theme/theme";

/** Juegos que todavía no tienen versión nativa: se pueden jugar en la web mientras tanto. */
export default function Soon() {
  const { colors } = useTheme();
  const { game } = useLocalSearchParams<{ game: string }>();
  const meta = gameById(game);
  if (!meta) return <NotFound title="Juego inexistente" />;
  return (
    <>
      <Stack.Screen options={{ title: meta.name }} />
      <Screen>
        <Animated.View entering={FadeInDown.duration(260)}>
          <Card raised style={{ gap: 10, alignItems: "flex-start" }}>
            <View style={{ backgroundColor: colors.cluePresentBg, borderRadius: 999, padding: 10 }}>
              <Icon name="construct-outline" size={24} color={colors.cluePresent} />
            </View>
            <Text variant="display">Muy pronto</Text>
            <Text variant="muted">{meta.tagline}</Text>
            <Text>
              Estamos terminando {meta.name} para la app. Mientras tanto, se juega en la web con el mismo progreso: si iniciás sesión, tus partidas se juntan.
            </Text>
          </Card>
        </Animated.View>
        <Button title={`Jugar ${meta.name} en la web`} icon="open-outline" size="lg" onPress={() => WebBrowser.openBrowserAsync(`${SHARE_URL}/${meta.id}`).catch(() => {})} />
      </Screen>
    </>
  );
}
