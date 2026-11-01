import { Stack } from "expo-router";
import { GameHome } from "@/components/game-home/game-home";
import { PUENTES_HOME } from "@/games/puentes/data";

export default function PuentesHome() {
  return (
    <>
      <Stack.Screen options={{ title: "Puentes" }} />
      <GameHome config={PUENTES_HOME} />
    </>
  );
}
