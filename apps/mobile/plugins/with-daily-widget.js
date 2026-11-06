// Widgets de los diarios en Android (react-native-android-widget): la fila (4×1) y el anillo (2×2).
// Ver docs/mobile.md → Widget.
// El dibujo y las actualizaciones están en src/widget; acá va lo nativo: el receptor, el tamaño, la vista
// previa y el texto del selector de widgets en español (por defecto) e inglés.
// iOS no se toca: este plugin solo modifica el proyecto de Android.
const fs = require("node:fs");
const path = require("node:path");
const { withDangerousMod } = require("expo/config-plugins");
const withAndroidWidgets = require("react-native-android-widget/app.plugin").default;

const FONTS = "./node_modules/@expo-google-fonts";

/** Texto del selector de widgets (recursos de Android). En la app, el widget usa src/i18n/messages/widget.ts. */
const PICKER = {
  row: {
    es: { label: "Diarios de hoy", description: "Una ficha por juego con su estado y tu racha. Tocá una ficha para jugar ese diario." },
    en: { label: "Today's puzzles", description: "One tile per game with its status, plus your streak. Tap a tile to play that daily." },
  },
  ring: {
    es: { label: "Anillo del día", description: "Un anillo que se completa con cada diario, tu racha y el próximo juego." },
    en: { label: "Daily ring", description: "A ring that fills with each daily, your streak and the next game." },
  },
};

// Android pide escapar el apóstrofo («Today\'s») además de lo de XML.
const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/'/g, "\\'");
// El plugin de la librería marca su descripción `translatable="false"`: sin `tools:ignore`, la versión
// inglesa haría fallar el lint de release (ExtraTranslation es fatal). En tiempo de ejecución vale igual.
const strings = (entries) =>
  `<?xml version="1.0" encoding="utf-8"?>\n<resources xmlns:tools="http://schemas.android.com/tools">\n${Object.entries(entries)
    .map(([name, value]) => `  <string name="${name}" tools:ignore="ExtraTranslation">${escape(value)}</string>\n`)
    .join("")}</resources>\n`;

/**
 * Nombre en values/ (español) y values-en/; la descripción en español la escribe el plugin de la librería en
 * values/strings.xml y acá solo se agrega la inglesa.
 */
function withPickerStrings(config) {
  return withDangerousMod(config, [
    "android",
    (c) => {
      const res = path.join(c.modRequest.platformProjectRoot, "app/src/main/res");
      const files = {
        values: { cranea_widget_label: PICKER.row.es.label, cranea_ring_label: PICKER.ring.es.label },
        "values-en": {
          cranea_widget_label: PICKER.row.en.label,
          widget_dailypuzzles_description: PICKER.row.en.description,
          cranea_ring_label: PICKER.ring.en.label,
          widget_dailyring_description: PICKER.ring.en.description,
        },
      };
      for (const [dir, entries] of Object.entries(files)) {
        fs.mkdirSync(path.join(res, dir), { recursive: true });
        fs.writeFileSync(path.join(res, dir, "cranea_widget_strings.xml"), strings(entries));
      }
      return c;
    },
  ]);
}

module.exports = function withDailyWidget(config) {
  config = withAndroidWidgets(config, {
    fonts: [
      `${FONTS}/bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.ttf`,
      `${FONTS}/atkinson-hyperlegible/700Bold/AtkinsonHyperlegible_700Bold.ttf`,
    ],
    widgets: [
      {
        // Fila de juegos. Mismo nombre que DAILY_WIDGETS.row en src/widget/index.tsx (el original: los
        // widgets ya agregados siguen andando).
        name: "DailyPuzzles",
        label: "@string/cranea_widget_label",
        // La descripción en español la escribe el plugin en values/strings.xml; values-en la reemplaza.
        description: PICKER.row.es.description,
        // 4×1; se puede achicar a 2×1 (conteo con puntos) o estirar.
        minWidth: "110dp",
        minHeight: "40dp",
        targetCellWidth: 4,
        targetCellHeight: 1,
        resizeMode: "horizontal|vertical",
        previewImage: "./assets/widget-preview.png",
        // Cada 30 min (lo mínimo de Android): así cambia de día poco después de la medianoche UTC
        // aunque la app no se abra. La tarea calcula «hoy» con el reloj del teléfono.
        updatePeriodMillis: 30 * 60 * 1000,
        widgetCategory: "home_screen",
      },
      {
        // Anillo. Mismo nombre que DAILY_WIDGETS.ring.
        name: "DailyRing",
        label: "@string/cranea_ring_label",
        description: PICKER.ring.es.description,
        minWidth: "110dp",
        minHeight: "110dp",
        targetCellWidth: 2,
        targetCellHeight: 2,
        resizeMode: "horizontal|vertical",
        previewImage: "./assets/widget-ring-preview.png",
        updatePeriodMillis: 30 * 60 * 1000,
        widgetCategory: "home_screen",
      },
    ],
  });
  return withPickerStrings(config);
};
