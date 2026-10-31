import { useEffect } from "react";
import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

/** Sacudida horizontal (la misma que la web) cada vez que cambia `key`. Respeta "reducir movimiento" del sistema. */
export function useShake(key: number) {
  const x = useSharedValue(0);
  useEffect(() => {
    if (key > 0) x.value = withSequence(...[-6, 6, -4, 4, 0].map((v) => withTiming(v, { duration: 70 })));
  }, [key, x]);
  return useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
}
