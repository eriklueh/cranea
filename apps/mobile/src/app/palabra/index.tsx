import { Stack } from "expo-router";
import { GameHome } from "@/components/game-home/game-home";
import { PALABRA_HOME } from "@/games/palabra/data";

export default function PalabraHome() {
  return (
    <>
      <Stack.Screen options={{ title: "Palabra" }} />
      <GameHome config={PALABRA_HOME} />
    </>
  );
}
