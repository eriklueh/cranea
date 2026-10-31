import { useRouter } from "expo-router";
import { Button, Screen, Text } from "@/components/ui";

export function NotFound({ title, message }: { title: string; message?: string }) {
  const router = useRouter();
  return (
    <Screen>
      <Text variant="display">{title}</Text>
      {message && <Text variant="muted">{message}</Text>}
      <Button title="Volver al inicio" onPress={() => router.navigate("/")} />
    </Screen>
  );
}
