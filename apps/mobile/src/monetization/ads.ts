import { Platform } from "react-native";
import { adsModule } from "./native";

/**
 * Anuncios con recompensa de AdMob, solo para quien no tiene Plus y solo para dos cosas: una pista
 * más cuando no quedan, y un intento más en un diario perdido. Nunca banners ni intersticiales.
 *
 * Siempre anuncios **no personalizados** (`requestNonPersonalizedAdsOnly`): no se usa el IDFA ni se
 * pide el permiso de rastreo de iOS (ATT). Antes del primer anuncio se junta el consentimiento con
 * UMP (Google), que muestra el formulario solo donde la ley lo exige (Europa, Reino Unido, Suiza…).
 * Sin ids propios en las variables de entorno se usan los anuncios de prueba de Google.
 */

export type RewardOutcome = "earned" | "closed" | "unavailable";

/** Si este build puede mostrar anuncios (no es Expo Go y trae el módulo nativo). */
export const adsAvailable = () => adsModule() !== null;

const unitId = () =>
  Platform.select({ ios: process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID, android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID }) || adsModule()!.TestIds.REWARDED;

/** Cuánto se espera a que cargue un anuncio antes de decir "Probá más tarde". */
const LOAD_TIMEOUT_MS = 12_000;

let ready: Promise<boolean> | null = null;

/** Consentimiento (UMP) y arranque del SDK, una sola vez. Si falla, se reintenta con el próximo pedido. */
function prepare(): Promise<boolean> {
  const m = adsModule();
  if (!m) return Promise.resolve(false);
  ready ??= (async () => {
    try {
      const consent = await m.AdsConsent.gatherConsent();
      if (!consent.canRequestAds) return false;
      await m.default().setRequestConfiguration({ maxAdContentRating: m.MaxAdContentRating.PG, tagForChildDirectedTreatment: false, tagForUnderAgeOfConsent: false });
      await m.default().initialize();
      return true;
    } catch {
      return false;
    }
  })().then((ok) => {
    if (!ok) ready = null;
    return ok;
  });
  return ready;
}

/** Carga y muestra un anuncio con recompensa. "earned" solo si se vio hasta ganar la recompensa. */
export async function showRewarded(): Promise<RewardOutcome> {
  const m = adsModule();
  if (!m || !(await prepare())) return "unavailable";
  return new Promise((resolve) => {
    const ad = m.RewardedAd.createForAdRequest(unitId(), { requestNonPersonalizedAdsOnly: true });
    let earned = false;
    let done = false;
    const finish = (outcome: RewardOutcome) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      unsubscribe.forEach((u) => u());
      try {
        ad.destroy();
      } catch {
        /* ya destruido */
      }
      resolve(outcome);
    };
    const timer = setTimeout(() => finish("unavailable"), LOAD_TIMEOUT_MS);
    const unsubscribe = [
      ad.addAdEventListener(m.RewardedAdEventType.LOADED, () => {
        clearTimeout(timer);
        ad.show().catch(() => finish("unavailable"));
      }),
      ad.addAdEventListener(m.RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
      ad.addAdEventListener(m.AdEventType.CLOSED, () => finish(earned ? "earned" : "closed")),
      ad.addAdEventListener(m.AdEventType.ERROR, () => finish(earned ? "earned" : "unavailable")),
    ];
    ad.load();
  });
}

/**
 * Donde rige el consentimiento, Google exige un acceso para cambiarlo. Devuelve si hace falta
 * mostrar "Privacidad de los anuncios" (en Cuenta).
 */
export async function adPrivacyOptionsRequired(): Promise<boolean> {
  const m = adsModule();
  if (!m) return false;
  try {
    const info = await m.AdsConsent.requestInfoUpdate();
    return info.privacyOptionsRequirementStatus === m.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  } catch {
    return false;
  }
}

export async function showAdPrivacyOptions() {
  try {
    await adsModule()?.AdsConsent.showPrivacyOptionsForm();
  } catch {
    /* sin conexión */
  }
}
