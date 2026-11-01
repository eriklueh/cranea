import AsyncStorage from "@react-native-async-storage/async-storage";
import { todayKey } from "@cranea/core";
import { playedDays } from "@cranea/core/protectors";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { GAMES } from "@/games/registry";
import { isExpoGo } from "@/monetization/native";
import { coveredDays, dailyStreak, useProgress } from "@/stores/progress";

/**
 * Recordatorio del diario con notificaciones **locales** (sin servidor): se programan los próximos
 * `DAYS_AHEAD` días, uno por uno, y se vuelven a programar al abrir la app, al volver al frente y
 * cada vez que se guarda un diario. Un día en el que ya jugaste algún diario no se avisa.
 *
 * Expo Go no trae todo el módulo nativo en Android: ahí (y en web) queda apagado sin romper nada.
 */

type NotificationsModule = typeof import("expo-notifications");

export const DAYS_AHEAD = 7;
export const DEFAULT_MINUTES = 10 * 60;
const CHANNEL_ID = "diario";
const ID_PREFIX = "cranea-diario-";
const KIND = "cranea-daily-reminder";

let mod: NotificationsModule | null | undefined;

/** El módulo de notificaciones, o null si no hay (Expo Go, web). `require` en línea, como native.ts. */
export function notificationsModule(): NotificationsModule | null {
  if (mod === undefined) {
    try {
      mod = !isExpoGo && (Platform.OS === "android" || Platform.OS === "ios") ? (require("expo-notifications") as NotificationsModule) : null;
    } catch {
      mod = null;
    }
  }
  return mod;
}

export const remindersAvailable = () => notificationsModule() !== null;

interface ReminderState {
  enabled: boolean;
  /** Minutos desde la medianoche local. */
  minutes: number;
  /** Ya se ofreció después del primer diario (se ofrece una sola vez). */
  offered: boolean;
  hydrated: boolean;
  set: (patch: Partial<Pick<ReminderState, "enabled" | "minutes" | "offered">>) => void;
}

export const useReminder = create<ReminderState>()(
  persist(
    (set) => ({
      enabled: false,
      minutes: DEFAULT_MINUTES,
      offered: false,
      hydrated: false,
      set: (patch) => set(patch),
    }),
    {
      name: "cranea-reminder",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ enabled, minutes, offered }) => ({ enabled, minutes, offered }),
      onRehydrateStorage: () => () => useReminder.setState({ hydrated: true }),
    },
  ),
);

export const formatMinutes = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

/** La racha más larga que sigue viva el día `date` (UTC), con lo jugado hasta ahora. */
function streakOn(date: string) {
  const { games } = useProgress.getState();
  const covered = coveredDays();
  return Math.max(0, ...GAMES.map((g) => dailyStreak(games[g.id]?.daily ?? {}, date, covered)));
}

/** Texto del aviso: con racha, la racha; si no, que ya están los de hoy. */
export function reminderBody(streak: number) {
  return streak > 0 ? `Tu racha de ${streak} ${streak === 1 ? "día" : "días"} te espera 🔥` : "Ya están los desafíos de hoy";
}

/** Prepara el canal (Android) y cómo se muestra con la app abierta (no hace falta avisar: ya estás). */
let prepared = false;
async function prepare(n: NotificationsModule) {
  if (prepared) return;
  prepared = true;
  n.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
  if (Platform.OS === "android") {
    await n.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Recordatorio del diario",
      description: "Un aviso por día para jugar los desafíos.",
      importance: n.AndroidImportance.DEFAULT,
    });
  }
}

/** Pide permiso (Android 13+ POST_NOTIFICATIONS, iOS). true si quedó permitido. */
export async function requestPermission(): Promise<boolean> {
  const n = notificationsModule();
  if (!n) return false;
  try {
    await prepare(n);
    const current = await n.getPermissionsAsync();
    if (current.granted || current.ios?.status === n.IosAuthorizationStatus.PROVISIONAL) return true;
    if (!current.canAskAgain) return false;
    const asked = await n.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
    return asked.granted || asked.ios?.status === n.IosAuthorizationStatus.PROVISIONAL;
  } catch {
    return false;
  }
}

/** Prende el aviso a una hora. "denied" si el sistema no lo permite. */
export async function enableReminder(minutes: number): Promise<"ok" | "denied" | "unavailable"> {
  if (!remindersAvailable()) return "unavailable";
  if (!(await requestPermission())) return "denied";
  useReminder.getState().set({ enabled: true, minutes, offered: true });
  await rescheduleReminders();
  return "ok";
}

export async function disableReminder() {
  useReminder.getState().set({ enabled: false, offered: true });
  await rescheduleReminders();
}

let queue: Promise<void> = Promise.resolve();

/** Vuelve a programar los próximos días (o los borra si está apagado). Se puede llamar seguido. */
export function rescheduleReminders(): Promise<void> {
  queue = queue.then(schedule, schedule);
  return queue;
}

async function schedule() {
  const n = notificationsModule();
  if (!n) return;
  try {
    await Promise.all(Array.from({ length: DAYS_AHEAD + 1 }, (_, i) => n.cancelScheduledNotificationAsync(`${ID_PREFIX}${i}`).catch(() => {})));
    const { enabled, minutes } = useReminder.getState();
    if (!enabled || !useProgress.getState().hydrated) return;
    const permission = await n.getPermissionsAsync();
    if (!permission.granted && permission.ios?.status !== n.IosAuthorizationStatus.PROVISIONAL) return;
    await prepare(n);
    const played = playedDays(useProgress.getState().games);
    const now = Date.now();
    for (let i = 0; i <= DAYS_AHEAD; i++) {
      const at = new Date();
      at.setDate(at.getDate() + i);
      at.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      if (at.getTime() <= now + 60_000) continue;
      // Los diarios que valen a esa hora son los del día UTC de ese momento.
      const date = todayKey(at);
      if (played.has(date)) continue;
      await n.scheduleNotificationAsync({
        identifier: `${ID_PREFIX}${i}`,
        content: { title: "Craneá", body: reminderBody(streakOn(date)), data: { kind: KIND, url: "/" } },
        trigger: { type: n.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL_ID },
      });
    }
  } catch {
    // Si el sistema no deja programar, se reintenta la próxima vez que se abra la app.
  }
}

/** Al tocar un aviso, la app abre en el inicio (los diarios de hoy). Devuelve cómo dejar de escuchar. */
export function onReminderTap(open: () => void): () => void {
  const n = notificationsModule();
  if (!n) return () => {};
  const handle = (r: { notification: { request: { content: { data?: Record<string, unknown> | null } } } } | null) => {
    if (r?.notification.request.content.data?.kind !== KIND) return;
    open();
    try {
      n.clearLastNotificationResponse();
    } catch {}
  };
  try {
    handle(n.getLastNotificationResponse());
  } catch {}
  const sub = n.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}
