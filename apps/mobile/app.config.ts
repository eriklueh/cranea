import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Identidad de la app en las tiendas. ⚠️ El dueño tiene que confirmar estos valores antes del
 * primer envío: el bundle id / package de Android no se pueden cambiar después de publicar.
 */
export const APP_NAME = "Craneá";
export const SLUG = "cranea";
export const SCHEME = "cranea";
export const IOS_BUNDLE_ID = "app.cranea";
export const ANDROID_PACKAGE = "app.cranea";
/** Versión que ve la gente. El número de build lo incrementa EAS (`appVersionSource: remote`). */
export const VERSION = "0.1.0";
/** ID del proyecto en EAS (`eas init`). No es secreto. */
export const EAS_PROJECT_ID: string = "904e6fd2-3330-4eaa-8d76-c0ce8badf207";

/**
 * IDs de app de AdMob (no son secretos). Sin variables se usan los de prueba de Google, que muestran
 * anuncios de prueba: cargá los reales en EAS antes de publicar (docs/mobile.md → Anuncios).
 */
const ADMOB_ANDROID_APP_ID = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || "ca-app-pub-3940256099942544~3347511713";
const ADMOB_IOS_APP_ID = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || "ca-app-pub-3940256099942544~1458002511";

/**
 * Colores del ícono y del splash: el papel del cuaderno (claro) y el pizarrón (oscuro), los mismos de la app.
 * Los PNG salen de assets/brand (node assets/brand/build-icons.mjs).
 */
const PAPER = "#f6f8fb";
const BOARD = "#202124";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: SLUG,
  owner: "eriklueh",
  scheme: SCHEME,
  version: VERSION,
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: IOS_BUNDLE_ID,
    supportsTablet: true,
    // Obligatorio en iOS si se ofrece Google (App Review 4.8).
    usesAppleSignIn: true,
    config: { usesNonExemptEncryption: false },
    infoPlist: { CFBundleAllowMixedLocalizations: true, CFBundleDevelopmentRegion: "es" },
    privacyManifests: {
      // AsyncStorage y SecureStore leen UserDefaults; no hay tracking.
      NSPrivacyTracking: false,
      NSPrivacyAccessedAPITypes: [
        { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults", NSPrivacyAccessedAPITypeReasons: ["CA92.1"] },
      ],
    },
  },
  android: {
    package: ANDROID_PACKAGE,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundImage: "./assets/adaptive-icon-background.png",
      monochromeImage: "./assets/adaptive-icon-monochrome.png",
      backgroundColor: PAPER,
    },
    // Sin permisos peligrosos: ni ubicación, ni cámara, ni contactos.
    blockedPermissions: [
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.RECORD_AUDIO",
    ],
  },
  web: { favicon: "./assets/favicon.png" },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    "expo-font",
    "expo-apple-authentication",
    // Recordatorio del diario: notificaciones locales (sin push). El permiso POST_NOTIFICATIONS
    // (Android 13+) y RECEIVE_BOOT_COMPLETED (reprogramar al reiniciar) los agrega el módulo.
    ["expo-notifications", { color: BRAND_GREEN }],
    [
      "expo-build-properties",
      {
        android: {
          // R8 borraba las clases que Room genera para WorkManager (lo usan AdMob y RevenueCat) y la app
          // se cerraba al abrir: "Failed to create an instance of androidx.work.impl.WorkDatabase".
          extraProguardRules: [
            "-keep class * extends androidx.room.RoomDatabase { <init>(); }",
            "-keep class androidx.work.impl.WorkDatabase_Impl { *; }",
            "-keep class androidx.work.impl.** { *; }",
          ].join("\n"),
        },
      },
    ],
    [
      "react-native-google-mobile-ads",
      {
        androidAppId: ADMOB_ANDROID_APP_ID,
        iosAppId: ADMOB_IOS_APP_ID,
        // Nada de medición antes del consentimiento (UMP): el SDK arranca recién con el primer anuncio.
        delayAppMeasurementInit: true,
        // Solo anuncios no personalizados: sin IDFA ni permiso de rastreo (ATT), así que no hay
        // userTrackingUsageDescription. SKAdNetwork de Google, para atribuir sin identificar a nadie.
        skAdNetworkItems: ["cstr6suwn9.skadnetwork"],
      },
    ],
    [
      "expo-splash-screen",
      {
        // Marca + nombre, adentro del círculo que deja ver el splash de Android 12+.
        image: "./assets/splash-icon.png",
        imageWidth: 220,
        resizeMode: "contain",
        backgroundColor: PAPER,
        dark: { image: "./assets/splash-icon-dark.png", backgroundColor: BOARD },
      },
    ],
  ],
  extra: {
    router: {},
    // Ver docs/mobile.md → EAS.
    eas: EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : undefined,
  },
});
