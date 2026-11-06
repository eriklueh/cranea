import { AtkinsonHyperlegible_400Regular } from "@expo-google-fonts/atkinson-hyperlegible/400Regular";
import { AtkinsonHyperlegible_700Bold } from "@expo-google-fonts/atkinson-hyperlegible/700Bold";
import { BricolageGrotesque_700Bold } from "@expo-google-fonts/bricolage-grotesque/700Bold";
import { BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque/800ExtraBold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { AccountProvider } from "@/account/account-provider";
import { MotionPreference, useMotionReduced } from "@/lib/motion";
import { useT } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { ThemeProvider, useTheme } from "@/theme/theme";
import { WidgetSync } from "@/widget";
import { fonts } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
  });

  // Los ajustes (tema, paleta, letra, animaciones) se leen antes del primer cuadro: sin destellos.
  const prefsReady = usePrefs((s) => s.hydrated);
  const ready = (loaded || Boolean(error)) && prefsReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Si una fuente no carga se sigue con la del sistema: nunca se bloquea la app.
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Con las medidas iniciales, los márgenes seguros son correctos desde el primer cuadro (sin saltos). */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <MotionPreference />
        <WidgetSync />
        <ThemeProvider>
          <AccountProvider>
            <Navigator />
          </AccountProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Navigator() {
  const { colors, scheme } = useTheme();
  const reduced = useMotionReduced();
  const t = useT();
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.paper).catch(() => {});
  }, [colors.paper]);
  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.paper },
          headerTintColor: colors.ink,
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.displayHeavy, fontSize: 18 },
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: colors.paper },
          // Con movimiento reducido las pantallas cambian con un fundido, sin deslizarse.
          animation: reduced ? "fade" : "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ title: t("common.appName") }} />
        <Stack.Screen name="cuenta" options={{ title: t("shell.accountTitle"), presentation: "modal" }} />
        <Stack.Screen name="ajustes" options={{ title: t("common.settings") }} />
        <Stack.Screen name="plus" options={{ title: t("common.plus"), presentation: "modal" }} />
        <Stack.Screen name="sso-callback" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="+not-found" options={{ title: t("common.appName") }} />
      </Stack>
    </>
  );
}
