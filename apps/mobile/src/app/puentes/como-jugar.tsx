import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { Button, Screen, Text } from "@/components/ui";
import { EXAMPLE_ROWS, EXAMPLE_SOLUTION, StaticBoard } from "@/games/puentes/components/preview";

/** Mismos textos que la web (apps/web/src/app/puentes/como-jugar), sin la parte de teclado. */
export default function HowToPuentes() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: "Cómo se juega" }} />
      <Screen contentStyle={{ gap: 18 }}>
        <Text variant="display">Cómo se juega Puentes</Text>
        <Text>
          Cada círculo es una isla y su número dice cuántos puentes salen de ella. Uní las islas con puentes rectos, en horizontal o en vertical, hasta que todas queden conectadas en un solo grupo.
        </Text>
        <View style={{ gap: 4 }}>
          <Text>• Entre dos islas puede haber uno o dos puentes, nunca más.</Text>
          <Text>• Los puentes no se cruzan ni pasan por encima de otra isla.</Text>
          <Text>• Cada isla tiene que tener exactamente los puentes que pide su número.</Text>
          <Text>• Todas las islas tienen que quedar unidas: desde cualquiera se llega a cualquier otra.</Text>
        </View>
        <Text variant="title">Un ejemplo</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 24 }}>
          <StaticBoard rows={EXAMPLE_ROWS} width={140} label="Tablero de ejemplo sin puentes" />
          <StaticBoard rows={EXAMPLE_ROWS} bridges={EXAMPLE_SOLUTION} done={[0, 1, 2, 3]} width={140} label="El mismo tablero resuelto" />
        </View>
        <Text>
          El 4 de la esquina solo ve dos islas, y a cada una le puede tender dos puentes como máximo: necesita los dos dobles. Con eso el 2 ya está completo y no puede bajar hacia el 1. Entonces el 1 se une con el 3, que llega a sus tres puentes. Cuando una isla está completa se pinta de verde.
        </Text>
        <Text variant="title">Cómo se tienden</Text>
        <Text>
          Deslizá el dedo desde una isla hacia una vecina, o tocá una isla y después la otra. Tocar un puente suma el segundo, y un tercer toque lo saca. <Text variant="bodyBold">Deshacer</Text> vuelve un paso atrás y <Text variant="bodyBold">Empezar de nuevo</Text> saca todos los puentes (también se puede deshacer).
        </Text>
        <Text variant="title">Revisar y errores</Text>
        <Text>
          <Text variant="bodyBold">Revisar</Text> marca en rojo los puentes que sobran. Si encuentra alguno, suma un error; si todo lo que tendiste está bien, te dice cuántos faltan sin sumar nada. Un puente que cruzaría a otro no se tiende y no cuenta como error. El tablero se resuelve solo cuando todo encaja. Tus intentos son 1 más los errores: resolverlo sin errores vale tres puntitos en el mapa.
        </Text>
        <Text variant="title">Los mundos</Text>
        <Text>
          Primero alcanza con contar lo que le falta a cada isla. Después hay que cuidar que ningún grupo quede aislado: por ejemplo, dos islas con un 1 no pueden unirse entre sí. Al final, en mapas grandes, conviene suponer un puente y ver si todo se contradice. Cada tablero tiene una sola solución y ninguno necesita adivinar.
        </Text>
        <Text>El mapa del día es el mismo para todos y se juega una vez.</Text>
        <Button title="Empezar a jugar" size="lg" onPress={() => router.navigate("/puentes")} />
      </Screen>
    </>
  );
}
