import { useRouter } from "expo-router";
import { Button, Screen, Text } from "@/components/ui";
import { useT } from "@/lib/i18n";

/** Sin `title`: «No encontramos esta página.» en el idioma activo. */
export function NotFound({ title, message }: { title?: string; message?: string }) {
  const router = useRouter();
  const t = useT();
  return (
    <Screen>
      <Text variant="display">{title ?? t("common.notFound")}</Text>
      {message && <Text variant="muted">{message}</Text>}
      <Button title={t("hub.backHome")} onPress={() => router.navigate("/")} />
    </Screen>
  );
}
