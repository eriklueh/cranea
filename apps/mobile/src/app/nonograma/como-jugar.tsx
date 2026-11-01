import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { Button, Screen, Text } from "@/components/ui";
import { ExampleLine, NonogramaPreview } from "@/games/nonograma/components/examples";

/** Mismo texto que la web (apps/web/src/app/nonograma/como-jugar), con los gestos del teléfono. */
export default function HowToNonograma() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: "Cómo se juega" }} />
      <Screen contentStyle={{ gap: 18 }}>
        <Text variant="display">Cómo se juega Nonograma</Text>
        <Text>
          Cada fila y cada columna tiene números. Te dicen cuántas casillas seguidas van pintadas, en orden, y que entre un tramo y otro hay al menos una vacía. Un <Text variant="bodyBold">3 1</Text> es un tramo de tres, uno o más espacios, y uno suelto. Un 0 es una línea vacía. Cuando pintás todo lo que va, aparece un dibujo.
        </Text>
        <NonogramaPreview />

        <Text variant="title">Cómo se deduce</Text>
        <Text>Mirá una línea por vez. Si un 4 entra en cinco casillas, empiece donde empiece, las tres del medio van pintadas:</Text>
        <View style={{ gap: 8 }}>
          <ExampleLine clue="4" cells="....." label="Un 4 en cinco casillas vacías" />
          <ExampleLine clue="4" cells=".sss." label="Las tres casillas del medio van pintadas" />
        </View>
        <Text>Lo que descubrís en una fila te ayuda en las columnas que cruza, y al revés. Cuando una casilla seguro no va, ponele una cruz: también es información.</Text>
        <ExampleLine clue="1 1" cells="#x..." label="Después de un tramo de uno completo va una cruz" />
        <Text>Ningún tablero necesita adivinar: todos tienen una sola solución y se resuelven mirando filas y columnas.</Text>

        <Text variant="title">Pintar, cruzar y arrastrar</Text>
        <Text>• Elegí <Text variant="bodyBold">Pintar</Text> o <Text variant="bodyBold">Cruz</Text> abajo del tablero y tocá una casilla.</Text>
        <Text>• Arrastrá el dedo por una fila o una columna para marcar varias de una vez.</Text>
        <Text>• Si empezás el trazo sobre una casilla que ya tiene eso, el trazo borra.</Text>
        <Text>• Los números de una línea se apagan cuando lo pintado ya coincide con su pista.</Text>
        <Text>• <Text variant="bodyBold">Deshacer</Text> vuelve atrás un trazo; <Text variant="bodyBold">Borrar todo</Text> también se puede deshacer.</Text>
        <Text>• En los tableros de 15×15, pellizcá con dos dedos para acercar y arrastrá con dos dedos para moverte (o tocá la lupa). Con un dedo siempre pintás.</Text>

        <Text variant="title">Intentos</Text>
        <Text>No hay vidas que se pierden por tocar mal: podés corregir todo lo que quieras. El tablero se completa solo cuando lo pintado coincide con el dibujo; las cruces son notas tuyas.</Text>
        <Text>
          Si te trabás, <Text variant="bodyBold">Revisar</Text> marca en rojo lo que está mal. Tenés dos revisiones y cada una suma un intento: sin revisar lo resolvés en 1, con una en 2, con dos en 3. Si preferís, <Text variant="bodyBold">Me rindo</Text> muestra la solución.
        </Text>

        <Text variant="title">Mundos y diario</Text>
        <Text>Hay tres mundos: dibujos de 5×5, de 10×10 y de 15×15, ordenados de más fácil a más difícil. Cada día hay un tablero de 10×10 nuevo, el mismo para todos, que se juega una sola vez.</Text>
        <Button title="Empezar a jugar" size="lg" onPress={() => router.navigate("/nonograma")} />
      </Screen>
    </>
  );
}
