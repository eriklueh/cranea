/**
 * Valores de producto que el dueño tiene que confirmar. La identidad de las tiendas
 * (bundle id, package, nombre) vive en app.config.ts.
 */

/** Dirección pública que va en los resultados compartidos. ⚠️ Confirmar el dominio de la web. */
export const SHARE_URL = "https://cranea.app";

/** Política de privacidad (obligatoria en App Store y Google Play). ⚠️ Publicarla y poner la URL real. */
export const PRIVACY_URL = `${SHARE_URL}/privacidad`;

/**
 * Términos de uso que se muestran en la pantalla de Plus (Apple los pide en toda suscripción).
 * Por defecto, el contrato estándar de Apple (EULA). Si publicás términos propios, cambialo acá.
 */
export const TERMS_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
