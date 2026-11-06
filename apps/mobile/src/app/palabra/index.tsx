import { Stack } from "expo-router";
import { GameHome } from "@/components/game-home/game-home";
import { PALABRA_HOME } from "@/games/palabra/data";
import { spanishOnly } from "@/components/spanish-only";

function PalabraHome() {
  return (
    <>
      <Stack.Screen options={{ title: "Palabra" }} />
      <GameHome config={PALABRA_HOME} />
    </>
  );
}

/** En inglés, Palabra no está: ver SpanishOnly. */
export default spanishOnly("palabra", PalabraHome);
