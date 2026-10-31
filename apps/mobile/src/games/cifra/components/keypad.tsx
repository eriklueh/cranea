import { Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Button, Text, shadow } from "@/components/ui";
import { haptic } from "@/lib/haptics";
import { useOnChange } from "@/lib/hooks";
import { useShake } from "@/lib/motion";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";
import { useCifra } from "../store";
import { DigitTile, useTileSize } from "./tiles";

/** El código que estás escribiendo. Al descifrarlo, las fichas saltan una por una. */
export function InputSlots() {
  const puzzle = useCifra((s) => s.puzzle);
  const input = useCifra((s) => s.input);
  const shakeKey = useCifra((s) => s.shakeKey);
  const won = useCifra((s) => s.status === "won");
  const size = useTileSize(puzzle?.length ?? 4, false);
  const shake = useShake(shakeKey);
  useOnChange(shakeKey, (key) => key > 0 && haptic("invalid"));
  useOnChange(won, (w) => w && haptic("win"));
  if (!puzzle) return null;
  return (
    <Animated.View
      style={[styles.slots, shake]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Tu código: ${input.join(" ") || "vacío"}`}
    >
      {Array.from({ length: puzzle.length }, (_, i) =>
        input[i] === undefined ? (
          <DigitTile key={i} tone="empty" size={size} />
        ) : (
          <DigitTile key={`${i}-${input[i]}`} digit={input[i]} tone={won ? "solution" : "input"} size={size} enterDelay={0} hop={won ? i : undefined} />
        ),
      )}
    </Animated.View>
  );
}

export function Keypad() {
  const { colors } = useTheme();
  const puzzle = useCifra((s) => s.puzzle);
  const input = useCifra((s) => s.input);
  const status = useCifra((s) => s.status);
  const press = useCifra((s) => s.press);
  const backspace = useCifra((s) => s.backspace);
  const submit = useCifra((s) => s.submit);
  const playing = status === "playing";
  const full = puzzle ? input.length === puzzle.length : false;
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.grid}>
        {Array.from({ length: 10 }, (_, d) => {
          const disabled = !playing || input.includes(d) || full;
          return (
            <View key={d} style={styles.keyWrap}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Cifra ${d}`}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={() => {
                  haptic("tap");
                  press(d);
                }}
                style={({ pressed }) => [
                  styles.key,
                  { borderColor: colors.ink, backgroundColor: colors.tile, ...shadow(colors.shadowInk, pressed ? 0 : 2) },
                  pressed && { transform: [{ translateY: 2 }, { scale: 0.96 }] },
                  disabled && { opacity: 0.35 },
                ]}
              >
                <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>{d}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button title="Borrar" icon="backspace-outline" variant="outline" size="lg" style={{ flex: 1 }} onPress={backspace} disabled={!playing || input.length === 0} />
        <Button title="Probar código" size="lg" style={{ flex: 2 }} onPress={submit} disabled={!playing || !full} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slots: { flexDirection: "row", gap: 6, justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 },
  keyWrap: { width: "20%", padding: 3 },
  key: { height: 52, borderRadius: radius.md, borderWidth: 2, alignItems: "center", justifyContent: "center" },
});
