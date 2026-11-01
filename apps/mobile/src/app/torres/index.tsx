import { Stack } from "expo-router";
import { GameHome } from "@/components/game-home/game-home";
import { TORRES_HOME } from "@/games/torres/data";

export default function TorresHome() {
  return (
    <>
      <Stack.Screen options={{ title: "Torres" }} />
      <GameHome config={TORRES_HOME} />
    </>
  );
}
