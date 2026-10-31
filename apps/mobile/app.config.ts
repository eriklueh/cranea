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
export const EAS_PROJECT_ID: string = ""; // ← pegá acá el ID que da `eas init`

/** Colores del ícono y del splash: el verde pizarrón del ícono y el papel claro/oscuro de la app. */
const BRAND_GREEN = "#1a4034";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: SLUG,
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
    adaptiveIcon: { foregroundImage: "./assets/adaptive-icon.png", backgroundColor: BRAND_GREEN },
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
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        imageWidth: 180,
        resizeMode: "contain",
        backgroundColor: "#f6f8fb",
        dark: { image: "./assets/splash-icon.png", backgroundColor: "#202124" },
      },
    ],
  ],
  extra: {
    router: {},
    // Ver docs/mobile.md → EAS.
    eas: EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : undefined,
  },
});
