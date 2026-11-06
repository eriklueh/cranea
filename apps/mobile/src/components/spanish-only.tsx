import { Stack, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Button, Screen, Text } from "@/components/ui";
import { useGameAvailable, useT } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";

/**
 * Palabra es un juego en castellano: en inglés no aparece en ningún listado, pero sus pantallas
 * siguen abriendo (enlaces, notificaciones) y muestran este aviso con un atajo para pasar a español.
 */
export function SpanishOnly({ gameId, children }: { gameId: string; children: ReactNode }) {
  const available = useGameAvailable(gameId);
  const t = useT();
  const set = usePrefs((s) => s.set);
  const router = useRouter();
  if (available) return children;
  return (
    <>
      <Stack.Screen options={{ title: t("games.palabraName") }} />
      <Screen contentStyle={{ gap: 12 }}>
        <Text variant="display">{t("games.spanishOnlyTitle")}</Text>
        <Text variant="muted">{t("games.spanishOnlyBody")}</Text>
        <Button title={t("games.spanishOnlyAction")} size="lg" onPress={() => set({ language: "es" })} />
        <Button title={t("common.goHome")} variant="outline" onPress={() => router.navigate("/")} />
      </Screen>
    </>
  );
}

/** Envuelve una pantalla de un juego solo en español. */
export function spanishOnly<P extends object>(gameId: string, Screen: (props: P) => ReactNode) {
  return function SpanishOnlyScreen(props: P) {
    return <SpanishOnly gameId={gameId}><Screen {...props} /></SpanishOnly>;
  };
}
