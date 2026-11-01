import { Stack, useRouter } from "expo-router";
import { View, useWindowDimensions } from "react-native";
import { Button, Screen, Text } from "@/components/ui";
import { Board } from "@/games/torres/components/board";
import { TorresPreview } from "@/games/torres/components/preview";

// Ejemplo de 4×4 con todas sus pistas, resuelto (el mismo que la web).
const SOLUTION = [2, 1, 4, 3, 3, 4, 1, 2, 4, 2, 3, 1, 1, 3, 2, 4];
const CLUES = { top: [3, 2, 1, 2], bottom: [2, 2, 3, 1], left: [2, 2, 1, 3], right: [2, 2, 3, 1] };
const EMPTY = new Array<number>(16).fill(0);

export default function HowToTorres() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  return (
    <>
      <Stack.Screen options={{ title: "Cómo se juega" }} />
      <Screen contentStyle={{ gap: 18 }}>
        <Text variant="display">Cómo se juega Torres</Text>
        <Text>
          Cada casilla es una torre. En un tablero de cuatro por cuatro las alturas van del 1 al 4, y cada fila y cada columna tiene todas las alturas una sola vez. Los números del borde dicen cuántas torres se ven mirando desde ese lado: una torre alta tapa a las más bajas que tiene atrás.
        </Text>
        <View style={{ gap: 8 }}>
          <TorresPreview />
          <Text variant="small" style={{ textAlign: "center" }}>Desde la izquierda se ven el 2 y el 4; el 1 queda tapado. Desde la derecha, el 3 y el 4.</Text>
        </View>

        <Text variant="title">Un tablero completo</Text>
        <Board size={4} clues={CLUES} givens={EMPTY} values={SOLUTION} readOnly width={Math.min(280, width - 36)} />
        <Text>
          Cuando una fila o columna confirma su pista, el número se pinta de verde. Si lo que escribiste ya no puede cumplirla, se pinta de rojo. Las alturas repetidas en una fila o columna también se marcan en rojo.
        </Text>

        <Text variant="title">Por dónde empezar</Text>
        <View style={{ gap: 6 }}>
          {[
            "Un 1 en el borde: la torre más alta va pegada a ese lado.",
            "Un 4 en el borde (o el tamaño del tablero): las torres suben de a una, 1, 2, 3, 4.",
            "Cuanto más grande es la pista, más lejos del borde tiene que estar la torre más alta.",
            "Cuando se traba, mirá una fila con sus dos pistas y probá dónde puede ir la más alta.",
          ].map((t) => (
            <Text key={t}>•  {t}</Text>
          ))}
        </View>
        <Text>Algunos tableros traen casillas dadas, con una rayita abajo. Ninguno necesita adivinar: siempre hay una deducción posible.</Text>

        <Text variant="title">Notas, deshacer y comprobar</Text>
        <Text>
          Tocá una casilla y elegí la altura abajo. Con Notas activado, los números se anotan chiquitos como candidatos. Mantener apretado un número hace lo contrario: lo anota si estás escribiendo, o lo escribe si estás con Notas.
        </Text>
        <Text>
          Comprobar revisa lo que escribiste. Si todo está bien, no cuesta nada. Si hay casillas equivocadas, se marcan y gastás un intento: tenés tres. Al llenar el tablero sin conflictos, la ciudad queda resuelta. Tus intentos son uno más las comprobaciones fallidas.
        </Text>

        <Text variant="title">Los mundos y el diario</Text>
        <Text>
          Se empieza en cuatro por cuatro y se llega a siete por siete. Cada mundo pide un poco más: leer las pistas, después cruzar una fila entera con sus dos pistas, y al final suponer una altura para ver si todo se contradice. El diario es de cinco por cinco, el mismo para todos, y se juega una vez por día.
        </Text>
        <Button title="Empezar a jugar" size="lg" onPress={() => router.navigate("/torres")} />
      </Screen>
    </>
  );
}
