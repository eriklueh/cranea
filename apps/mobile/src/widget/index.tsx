import AsyncStorage from "@react-native-async-storage/async-storage";
import { todayKey } from "@cranea/core";
import { resolveLocale, type LocalePref } from "@cranea/core/i18n";
import { dailyWidgetState, parseStoredProgress, type WidgetProgress } from "@cranea/core/widget";
import { getLocales } from "expo-localization";
import { useEffect } from "react";
import { AppState } from "react-native";
import type { WidgetInfo, WidgetRepresentation, WidgetTaskHandler } from "react-native-android-widget";
import { GAMES } from "@/games/registry";
import { DEFAULT_PREFS, usePrefs, type Prefs } from "@/lib/prefs";
import { useProgress } from "@/stores/progress";
import { DailyWidget } from "./daily-widget";
import { widgetModule } from "./module";

/**
 * Widget «Diarios de hoy» de Android (react-native-android-widget). Ver docs/mobile.md → Widget.
 *
 * - En segundo plano (agregarlo, cambiarle el tamaño, cada 30 min por `updatePeriodMillis`) corre
 *   `widgetTaskHandler` sin abrir la app: lee `cranea-progress` y `cranea-prefs` de AsyncStorage y
 *   calcula «hoy» (UTC) con el reloj del teléfono, así que al pasar la medianoche UTC se pone al día solo.
 * - Con la app abierta, `WidgetSync` lo redibuja al cambiar el progreso (diario jugado, sincronización con
 *   la cuenta, protectores), los ajustes (idioma, tema, colores), al volver al frente y a la medianoche UTC.
 * - iOS, la web y Expo Go: no hace nada (el módulo nativo ni se carga).
 */

export const DAILY_WIDGET = "DailyPuzzles";

type WidgetPrefs = Pick<Prefs, "language" | "theme" | "palette">;
interface WidgetInputs {
  progress: WidgetProgress;
  prefs: WidgetPrefs;
}

function deviceTags(): string[] {
  try {
    return getLocales().map((l) => l.languageTag);
  } catch {
    return [];
  }
}

const GAME_IDS = GAMES.filter((g) => g.mobile === "live").map((g) => g.id);

/** El widget para un tamaño dado. Claro y oscuro según el sistema, salvo que Ajustes fije uno. */
export function renderDailyWidget(info: Pick<WidgetInfo, "width" | "height">, { progress, prefs }: WidgetInputs, now = new Date()): WidgetRepresentation {
  const locale = resolveLocale(prefs.language, deviceTags());
  const state = dailyWidgetState(progress, { gameIds: GAME_IDS, locale, today: todayKey(now) });
  const look = { locale, palette: prefs.palette };
  const draw = (theme: "light" | "dark") => <DailyWidget state={state} look={look} theme={theme} width={info.width} height={info.height} />;
  if (prefs.theme === "light") return draw("light");
  if (prefs.theme === "dark") return draw("dark");
  return { light: draw("light"), dark: draw("dark") };
}

async function readJSON(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const isLocalePref = (v: unknown): v is LocalePref => v === "auto" || v === "es" || v === "en";

/** Lo guardado en el dispositivo (para la tarea en segundo plano: los stores no están hidratados ahí). */
async function readStoredInputs(): Promise<WidgetInputs> {
  const [progress, prefsRaw] = await Promise.all([readJSON("cranea-progress"), readJSON("cranea-prefs")]);
  const s = (prefsRaw as { state?: Partial<Prefs> } | null)?.state ?? {};
  return {
    progress: parseStoredProgress(progress),
    prefs: {
      language: isLocalePref(s.language) ? s.language : DEFAULT_PREFS.language,
      theme: s.theme === "light" || s.theme === "dark" || s.theme === "system" ? s.theme : DEFAULT_PREFS.theme,
      palette: s.palette === "colorblind" ? "colorblind" : "classic",
    },
  };
}

/** Lo que tiene la app en memoria (más nuevo que AsyncStorage, que se escribe un instante después). */
function liveInputs(): WidgetInputs {
  const { games, protectors } = useProgress.getState();
  const { language, theme, palette } = usePrefs.getState();
  return { progress: { games, protectors }, prefs: { language, theme, palette } };
}

/** Tarea en segundo plano del widget (se registra en index.ts). */
export const widgetTaskHandler: WidgetTaskHandler = async ({ widgetInfo, widgetAction, renderWidget }) => {
  if (widgetInfo.widgetName !== DAILY_WIDGET) return;
  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED":
      renderWidget(renderDailyWidget(widgetInfo, await readStoredInputs()));
      break;
    default:
      // WIDGET_CLICK: los toques abren un link (OPEN_URI) y no llegan acá. WIDGET_DELETED: nada que limpiar.
      break;
  }
};

let pending: ReturnType<typeof setTimeout> | null = null;

/** Pide redibujar los widgets que haya en la pantalla de inicio (agrupa los pedidos seguidos). */
export function requestDailyWidgetUpdate() {
  const m = widgetModule();
  if (!m) return;
  if (pending) clearTimeout(pending);
  pending = setTimeout(() => {
    pending = null;
    if (!useProgress.getState().hydrated) return;
    const inputs = liveInputs();
    m.requestWidgetUpdate({ widgetName: DAILY_WIDGET, renderWidget: (info) => renderDailyWidget(info, inputs) }).catch(() => {});
  }, 400);
}

const msToNextUtcMidnight = (now = Date.now()) => 86_400_000 - (now % 86_400_000) + 1_000;

/** Va una vez en el layout raíz. No dibuja nada. */
export function WidgetSync() {
  useEffect(() => {
    if (!widgetModule()) return;
    requestDailyWidgetUpdate();
    const offProgress = useProgress.subscribe((s, prev) => {
      if (s.hydrated !== prev.hydrated || s.games !== prev.games || s.protectors !== prev.protectors) requestDailyWidgetUpdate();
    });
    const offPrefs = usePrefs.subscribe((s, prev) => {
      if (s.language !== prev.language || s.theme !== prev.theme || s.palette !== prev.palette) requestDailyWidgetUpdate();
    });
    const offApp = AppState.addEventListener("change", (state) => {
      // Al volver al frente (otro día, otro idioma del sistema) y al irse (lo último que se jugó).
      if (state === "active" || state === "background") requestDailyWidgetUpdate();
    });
    let midnight: ReturnType<typeof setTimeout>;
    const atMidnight = () => {
      midnight = setTimeout(() => {
        requestDailyWidgetUpdate();
        atMidnight();
      }, msToNextUtcMidnight());
    };
    atMidnight();
    return () => {
      offProgress();
      offPrefs();
      offApp.remove();
      clearTimeout(midnight);
    };
  }, []);
  return null;
}
