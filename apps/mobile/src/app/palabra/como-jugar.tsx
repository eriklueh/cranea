import type { LetterScore } from "@cranea/core/palabra";
import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { Button, Row, Screen, Text } from "@/components/ui";
import { LetterTile } from "@/games/palabra/components/palabra-game";

const tone = (s: LetterScore) => (s === 2 ? "exact" : s === 1 ? "present" : "absent");

// La palabra oculta del ejemplo es PALTA (igual que la web).
const example: { word: string; scores: LetterScore[] }[] = [
  { word: "pulpo", scores: [2, 0, 2, 0, 0] },
  { word: "manta", scores: [0, 2, 0, 2, 2] },
  { word: "palta", scores: [2, 2, 2, 2, 2] },
];
const repeated = { word: "error", scores: [1, 1, 2, 1, 0] as LetterScore[] };

function Word({ word, scores }: { word: string; scores: LetterScore[] }) {
  return (
    <Row gap={6} style={{ justifyContent: "center" }}>
      {[...word].map((l, i) => <LetterTile key={i} letter={l} tone={tone(scores[i])} size={44} />)}
    </Row>
  );
}

export default function HowToPalabra() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: "Cómo se juega" }} />
      <Screen contentStyle={{ gap: 18 }}>
        <Text variant="display">Cómo se juega Palabra</Text>
        <Text>
          Hay una palabra oculta de cinco letras. Escribí cualquier palabra y probala: cada letra se pinta para decirte si está en su lugar, si está en otro lugar o si no está. Con esas pistas elegí el próximo intento, hasta encontrarla.
        </Text>
        <View style={{ gap: 8 }}>
          {example.map((c) => <Word key={c.word} {...c} />)}
          <Text variant="small" style={{ textAlign: "center" }}>Verde: en su lugar. Amarilla: está en otro lugar. Gris: no está.</Text>
        </View>
        <Text variant="title">Cómo se resolvió este</Text>
        <Text>PULPO dejó la P primera y la L en el medio. MANTA sumó una A segunda, la T cuarta y otra A al final. Con las cinco letras ubicadas, el tercer intento fue PALTA.</Text>
        <Text variant="title">Letras repetidas</Text>
        <Word {...repeated} />
        <Text>Si la palabra fuera PERRO, al probar ERROR la R del medio queda en su lugar, la primera R está pero en otro lugar y la última sale gris: PERRO no tiene una tercera R.</Text>
        <Text variant="title">Qué palabras valen</Text>
        <Text>• La palabra oculta es común: un sustantivo, un adjetivo o un verbo sin conjugar. Nunca un plural.</Text>
        <Text>• Las tildes no cuentan: ÁRBOL se escribe ARBOL. La Ñ es una letra aparte.</Text>
        <Text>• Tus intentos tienen que ser palabras del diccionario del juego. Si no está, no gastás intento.</Text>
        <Text>• El teclado de la pantalla se pinta con lo que ya descubriste.</Text>
        <Text variant="title">Los mundos y el diario</Text>
        <Text>
          En el primer mundo tenés seis intentos; después, cinco y cuatro. El último es el modo difícil: cada letra que descubrís la tenés que usar en el intento siguiente, y las verdes no se mueven de su lugar. La palabra del día es la misma para todos, con seis intentos, y se juega una sola vez.
        </Text>
        <Button title="Empezar a jugar" size="lg" onPress={() => router.navigate("/palabra")} />
      </Screen>
    </>
  );
}
