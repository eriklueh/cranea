import { Stack } from "expo-router";
import { GameHome } from "@/components/game-home/game-home";
import { CIFRA_HOME } from "@/games/cifra/data";

export default function CifraHome() {
  return (
    <>
      <Stack.Screen options={{ title: "Cifra" }} />
      <GameHome config={CIFRA_HOME} />
    </>
  );
}
