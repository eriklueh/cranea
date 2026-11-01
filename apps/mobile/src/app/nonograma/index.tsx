import { Stack } from "expo-router";
import { GameHome } from "@/components/game-home/game-home";
import { NONOGRAMA_HOME } from "@/games/nonograma/data";

export default function NonogramaHome() {
  return (
    <>
      <Stack.Screen options={{ title: "Nonograma" }} />
      <GameHome config={NONOGRAMA_HOME} />
    </>
  );
}
