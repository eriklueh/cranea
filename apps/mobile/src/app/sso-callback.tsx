import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "@/theme/theme";

WebBrowser.maybeCompleteAuthSession();

/**
 * Vuelta del inicio de sesión con Google o Apple (`cranea://sso-callback`). Clerk termina la sesión
 * en la pantalla que la empezó; acá solo volvemos a ella en vez de mostrar "pantalla no encontrada".
 */
export default function SsoCallback() {
  const { colors } = useTheme();
  useEffect(() => {
    const t = setTimeout(() => (router.canGoBack() ? router.back() : router.replace("/")), 50);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper }}>
      <ActivityIndicator color={colors.ink} />
    </View>
  );
}
