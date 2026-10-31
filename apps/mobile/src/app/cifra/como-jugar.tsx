import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { Button, Row, Screen, Text } from "@/components/ui";
import { PegLegend } from "@/games/cifra/components/cifra-game";
import { ClueRow, DigitTile } from "@/games/cifra/components/tiles";

const example = [
  { guess: [1, 0, 7], feedback: { exact: 0, present: 3 } },
  { guess: [0, 7, 1], feedback: { exact: 0, present: 3 } },
];

export default function HowToCifra() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: "Cómo se juega" }} />
      <Screen contentStyle={{ gap: 18 }}>
        <Text variant="display">Cómo se juega Cifra</Text>
        <Text>
          Hay un código secreto de cifras distintas. El tablero ya trae varios intentos puntuados. Cada fila te dice cuántas de sus cifras están en el código y cuántas están en su lugar, pero nunca cuáles. Cruzando las filas, solo un código encaja con todas. Todas las cifras del código aparecen entre las pistas. Tenés tres intentos para escribirlo.
        </Text>
        <View style={{ gap: 8 }}>
          {example.map((c, i) => <ClueRow key={i} clue={c} />)}
          <PegLegend />
          <Text variant="small" style={{ textAlign: "center" }}>A la izquierda, el círculo lleno cuenta las cifras en su lugar. A la derecha, el aro cuenta las que están en otro lugar.</Text>
        </View>
        <Text variant="title">Cómo se resuelve este</Text>
        <Text>
          El aro con un 3 indica que las tres cifras están en el código, pero ninguna en su lugar. Cruzá sus posiciones: el 7 no puede ir último por la primera fila, ni en el medio por la segunda, así que va primero. El 1 no puede ir primero ni último: va en el medio. El 0 ocupa el lugar que queda. El código es 710.
        </Text>
        <Text variant="title">Marcá tus deducciones</Text>
        <Row gap={10} style={{ justifyContent: "center" }}>
          <DigitTile digit={3} mark="out" />
          <DigitTile digit={5} mark="in" />
          <DigitTile digit={8} mark="here" />
        </Row>
        <Text>
          Tocá una ficha del tablero: la raya la descarta, el aro indica que va en el código y el fondo sólido confirma que va ahí. Un cuarto toque la deja sin marcar. Cada casilla se marca por separado y las marcas no completan nada solas: son tus notas.
        </Text>
        <Text variant="title">Los mundos</Text>
        <Text>
          Cada mundo pide una técnica más. Primero contar lo que ya sabés de cada fila, y después suponer una cifra en un lugar para ver si todo se contradice. Ningún tablero necesita adivinar. Si te trabás, el botón Pista te dice qué filas cruzar.
        </Text>
        <Button title="Empezar a jugar" size="lg" onPress={() => router.navigate("/cifra")} />
      </Screen>
    </>
  );
}
