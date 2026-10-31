# Craneá en el celular (apps/mobile)

App nativa con **Expo SDK 58** + **expo-router**, para Google Play y App Store. Comparte con la web el motor
(`@cranea/core`), el backend (Convex en `apps/web/convex`), la cuenta (Clerk) y el formato del progreso
(`cranea-progress`), así una misma cuenta junta las partidas del celular y de la web.

## Estado

| Juego | App nativa |
| --- | --- |
| Cifra | ✅ Niveles (4 mundos) + diario, marcas, pistas, partida en curso guardada |
| Palabra | ✅ Niveles (4 mundos, incluido modo difícil) + diario |
| Puentes, Nonograma, Torres | ⏳ Pantalla «Muy pronto» con enlace a la web |

También: inicio con los diarios de hoy, pantalla de cada juego (diario, «Seguir jugando», mundos y niveles),
ranking del día, estadísticas, cuenta (Apple / Google / código por mail), tema cuaderno/pizarrón, vibraciones.

## Cómo está armado

```
apps/mobile/
├─ app.config.ts          Nombre, bundle id, versión, íconos, permisos (constantes arriba de todo)
├─ eas.json               Perfiles de build: development, preview, production
├─ metro.config.js        Config de Expo (detecta el monorepo sola)
├─ assets/                Ícono, ícono adaptable y splash (salen de assets/brand)
└─ src/
   ├─ app/                Rutas (expo-router): /, /cifra, /cifra/diario, /cifra/nivel/[mundo]/[nivel], /palabra…,
   │                      /pronto/[juego], /ranking, /estadisticas, /cuenta
   ├─ account/            ClerkProvider + ConvexProviderWithClerk + sincronización del progreso
   ├─ components/         UI (ui.tsx), pantalla de juego (game-home), DailyGate, hoja de resultado
   ├─ games/              cifra/, palabra/ (store, datos, componentes) y registry.ts
   ├─ stores/progress.ts  Zustand + AsyncStorage, clave y formato idénticos a la web
   ├─ entitlements/       Lugar único para compras futuras (hoy todo libre)
   ├─ theme/              Tokens de color de globals.css y fuentes
   └─ config.ts           URL pública y de privacidad (a confirmar)
```

- **Motor**: `@cranea/core` se importa como TypeScript (sus `exports` apuntan a `src/`). Es puro y apto para
  React Native; `normalizeWord` tiene un respaldo por si el motor JS no trae `String.prototype.normalize`.
- **Backend**: la app usa la API generada de Convex de la web solo para los tipos (`src/lib/convex.ts`), sin mover
  `convex/`. Las reglas para combinar resultados (`convex/results.ts`) se importan tal cual.
- **Progreso**: mismo shape `{ games: { [juego]: { levels, daily } } }`, mismas claves (`w2-l5`, `2026-10-31`).
  La sincronización (`account/progress-sync.tsx`) es la de la web, con AppState en lugar de `online`.
- **Diario**: misma semántica que la web. Espera el progreso del dispositivo y de la cuenta (máximo 4 s), la
  primera partida con sesión abre el intento oficial (`ranking.startDaily`) y las repeticiones son práctica.

## Correrlo en tu máquina

```bash
corepack enable && pnpm install
cp apps/mobile/.env.example apps/mobile/.env.local   # y completá las dos variables
pnpm mobile                                          # = pnpm --filter @cranea/mobile start
```

Variables (son públicas, van dentro de la app):

- `EXPO_PUBLIC_CONVEX_URL`: la misma que `NEXT_PUBLIC_CONVEX_URL` de la web.
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`: la misma que `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

Sin ellas la app funciona igual, sin cuenta ni ranking.

- **Expo Go** (escaneás el QR): sirve para jugar y probar la UI. El login con Apple/Google puede no
  funcionar ahí; para eso usá un development build.
- **Development build** (recomendado): `cd apps/mobile && eas build --profile development --platform android`
  (o `ios`), lo instalás y después `pnpm mobile`.

Chequeos: `pnpm --filter @cranea/mobile typecheck`, `cd apps/mobile && npx expo-doctor`,
`npx expo export --platform android` (compila el bundle sin emulador).

## Lo que tenés que hacer vos (en orden)

### 1. Confirmar la identidad de la app

En `apps/mobile/app.config.ts`: `APP_NAME`, `IOS_BUNDLE_ID` y `ANDROID_PACKAGE` (hoy `app.cranea`).
**No se pueden cambiar después de publicar.** Si preferís `com.cranea.app` o `ar.com.…`, cambialo antes del
primer build. En `src/config.ts` confirmá `SHARE_URL` (dominio de la web) y `PRIVACY_URL`.

### 2. Cuentas de las tiendas

- **Apple Developer Program** (USD 99/año): https://developer.apple.com/programs/. Como persona o como empresa
  (empresa requiere número D-U-N-S). En App Store Connect creá la app con el bundle id de arriba.
- **Google Play Console** (USD 25, pago único): https://play.google.com/console. Las cuentas personales nuevas
  tienen que hacer una prueba cerrada con 12 testers durante 14 días antes de publicar en producción.

### 3. EAS (builds en la nube de Expo)

```bash
npm i -g eas-cli
eas login
cd apps/mobile
eas init                     # crea el proyecto; copiá el ID en EAS_PROJECT_ID de app.config.ts
eas env:create --environment production --name EXPO_PUBLIC_CONVEX_URL --value https://<prod>.convex.cloud --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value pk_live_… --visibility plaintext
# repetí para "preview" y "development" (pueden apuntar al deployment de desarrollo)
```

Builds:

```bash
eas build --profile preview --platform android      # APK para probar en tu teléfono
eas build --profile production --platform all       # AAB para Play y IPA para App Store
```

EAS genera y guarda las credenciales (keystore de Android, certificados de iOS). El número de build se
incrementa solo (`appVersionSource: remote`); la versión visible es `VERSION` en `app.config.ts`.

### 4. Publicar

```bash
eas submit --profile production --platform android   # sube a Play (pista interna, borrador)
eas submit --profile production --platform ios       # sube a App Store Connect / TestFlight
```

- Android: la primera vez Google pide subir un AAB a mano desde la consola; después `eas submit` usa una
  cuenta de servicio (Play Console → Configuración → Acceso a la API).
- Fichas de las tiendas: capturas (teléfono y tablet), descripción, ícono 512 px (Play), categoría «Juegos de
  lógica / Puzzle», clasificación por edades (cuestionario), y la **política de privacidad** publicada.
- Formularios de privacidad: *Data safety* (Play) y *App Privacy* (Apple). Hoy la app guarda: progreso de juego
  y, con cuenta, mail/nombre (Clerk) y resultados (Convex). Sin anuncios, sin analítica, sin tracking.

### 5. Clerk para la app nativa

En el dashboard de Clerk (misma aplicación que la web):

1. **Native applications**: activá la Native API. Para iOS cargá el Team ID + bundle id; para Android el
   package y los SHA-256 que muestra `eas credentials`.
2. **Allowlist de redirect para SSO móvil**: agregá `cranea://sso-callback`.
3. **Email**: activá «Email verification code» como forma de entrar y de verificar (la app usa código, no
   contraseña).
4. **Google** y **Apple** como proveedores sociales. En la instancia de producción Clerk pide credenciales
   propias: OAuth client de Google Cloud y, para Apple, un Services ID + key de Sign in with Apple.
   Apple exige Sign in with Apple en iOS si se ofrece Google (ya está implementado; solo hay que configurarlo).
5. **Borrado de cuenta**: activá «Allow users to delete their accounts». Apple exige poder borrar la cuenta
   desde la app (está en Cuenta → «Borrar mi cuenta»).
   Pendiente: borrar también las filas de Convex del usuario (progress, profiles, dailyStarts, dailyResults)
   con un webhook de Clerk `user.deleted` → acción HTTP de Convex. Hoy se lo saca del ranking antes de borrar.
6. La plantilla JWT `convex` ya existe y es la misma para web y app.

### 6. Avisos (después)

El recordatorio diario de la web usa Web Push. En la app habría que usar `expo-notifications` (FCM en Android,
APNs en iOS, que EAS configura) y guardar el token en una tabla de Convex en lugar de la suscripción web.
No está implementado para no pedir permisos todavía.

### 7. Actualizaciones sin pasar por la tienda (opcional)

`npx expo install expo-updates`, `eas update:configure` y agregar `channel` a los perfiles de `eas.json`.
Permite publicar arreglos de JS con `eas update` sin un build nuevo.

## Monetización (sin implementar)

No hay compras ni anuncios. Todo pasa por `src/entitlements`: las pantallas preguntan `can("all-worlds")`,
`useEntitlements()`, y el día que haya un modelo solo cambia ese módulo.

Opciones recomendadas:

- **RevenueCat** (`react-native-purchases`) para «Craneá Plus»: suscripción mensual/anual o pago único,
  con un mismo entitlement `plus` en iOS y Android, recibos validados y paywall configurable. Se puede
  vincular el usuario de Clerk (`Purchases.logIn(userId)`) para que Plus valga también en la web.
- **AdMob** (`react-native-google-mobile-ads`) solo con anuncios **con recompensa** (por ejemplo, una pista
  extra o repetir un diario), nunca interrumpiendo una partida. Requiere el formulario de consentimiento (UMP)
  para Europa y declarar los anuncios en las fichas.
- Ideas de Plus: mundos extra, archivo de diarios pasados, pistas ilimitadas, estadísticas extendidas, sin anuncios.

Las compras dentro de la app tienen que usar el sistema de cada tienda (comisión 15 % en el programa para
pequeños desarrolladores de ambas).
