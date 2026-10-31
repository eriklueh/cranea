import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Lectura/escritura de JSON en el dispositivo. Nunca rompe la partida: si el almacenamiento
 * falla, se juega igual sin guardar (como `localStorage` bloqueado en la web).
 */
export async function readJSON(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
}

export function removeKey(key: string) {
  AsyncStorage.removeItem(key).catch(() => {});
}

export async function keysWithPrefix(prefix: string): Promise<string[]> {
  try {
    return (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(prefix));
  } catch {
    return [];
  }
}
