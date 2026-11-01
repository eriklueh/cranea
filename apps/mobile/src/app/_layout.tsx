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
import { ThemeProvider, useTheme } from "@/theme/theme";
import { fonts } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  // Si una fuente no carga se sigue con la del sistema: nunca se bloquea la app.
  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Con las medidas iniciales, los márgenes seguros son correctos desde el primer cuadro (sin saltos). */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
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
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ title: "Craneá" }} />
        <Stack.Screen name="cuenta" options={{ title: "Tu cuenta", presentation: "modal" }} />
        <Stack.Screen name="plus" options={{ title: "Craneá Plus", presentation: "modal" }} />
        <Stack.Screen name="sso-callback" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="+not-found" options={{ title: "Craneá" }} />
      </Stack>
    </>
  );
}
