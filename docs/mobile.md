# Craneá en el celular (apps/mobile)

App nativa con **Expo SDK 58** + **expo-router**, para Google Play y App Store. Comparte con la web el motor
(`@cranea/core`), el backend (Convex en `apps/web/convex`), la cuenta (Clerk) y el formato del progreso
(`cranea-progress`), así una misma cuenta junta las partidas del celular y de la web.

## Estado

| Juego | App nativa |
| --- | --- |
| Cifra | ✅ Niveles (4 mundos) + diario, marcas, pistas, partida en curso guardada |
| Palabra | ✅ Niveles (4 mundos, incluido modo difícil) + diario |
| Puentes | ✅ Niveles (4 mundos, 5×5 a 11×11) + diario; arrastrar o tocar islas, puentes dobles, Revisar |
| Nonograma | ✅ Niveles (3 mundos, miniaturas de los dibujos) + diario; zoom con dos dedos en 15×15; pistas |
| Torres | ✅ Niveles (4 mundos, 4×4 a 7×7) + diario, notas, comprobar con 3 intentos, partida en curso guardada |

También: inicio con los diarios de hoy, pantalla de cada juego (diario, «Seguir jugando», mundos y niveles),
ranking del día, estadísticas, cuenta (Apple / Google / código por mail), **Ajustes** (como la hoja de Ajustes
de la web), **Craneá Plus** (RevenueCat), anuncios con recompensa opcionales (AdMob) y un **widget de Android**
(«Diarios de hoy», ver [Widget de Android](#widget-de-android)). Ver [Monetización](#monetización).

## Cómo está armado

```
apps/mobile/
├─ app.config.ts          Nombre, bundle id, versión, íconos, permisos (constantes arriba de todo)
├─ eas.json               Perfiles de build: development, preview, production
├─ metro.config.js        Config de Expo (detecta el monorepo sola)
├─ assets/                Ícono, ícono adaptable y splash (salen de assets/brand)
└─ src/
   ├─ app/                Rutas (expo-router): /, /cifra, /cifra/diario, /cifra/nivel/[mundo]/[nivel], /palabra…,
   │                      /pronto/[juego], /ranking, /estadisticas, /cuenta, /plus, /archivo/[juego]/[fecha]
   ├─ account/            ClerkProvider + ConvexProviderWithClerk + sincronización del progreso
   ├─ components/         UI (ui.tsx), pantalla de juego (game-home), DailyGate, hoja de resultado
   ├─ games/              cifra/, palabra/ (store, datos, componentes) y registry.ts
   ├─ stores/progress.ts  Zustand + AsyncStorage, clave y formato idénticos a la web
   ├─ entitlements/       ¿Tiene Plus? (RevenueCat o Convex, guardado para jugar sin red) y qué es gratis
   ├─ monetization/       RevenueCat (purchases.ts), AdMob (ads.ts), intento extra, guardas de Expo Go (native.ts)
   ├─ lib/                motion.tsx (sistema de movimiento, ver docs/motion.md), prefs.ts (Ajustes),
   │                      sound.ts (expo-audio), haptics.ts, hooks.ts, storage.ts
   ├─ theme/              Tokens de color de globals.css (también la paleta para daltonismo) y fuentes
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
- **Ajustes** (`src/app/ajustes.tsx`, engranaje del inicio y desde Tu cuenta): los mismos que la web.
  *Pantalla*: tema (Cuaderno / Pizarrón / Sistema), colores de las pistas (Clásicos / Daltonismo, con vista
  previa), tamaño de letra (Normal / Grande: agranda el texto de lectura ~1,125×; los tableros usan Bricolage o
  tamaños fijos y no cambian) y animaciones (Según el sistema / Reducidas). *Juego*: sonido (apagado por
  defecto) y vibración. *Más*: estadísticas, Craneá Plus, Tu cuenta y el recordatorio. Se guardan en
  `cranea-prefs` (AsyncStorage) y el layout raíz espera a leerlos antes del primer cuadro (el tema elegido antes
  en `cranea-theme` se migra solo). Tu cuenta queda para la sesión, el ranking, Plus y borrar la cuenta.
- **Movimiento**: un solo sistema para la web y la app, con los números en `@cranea/core/motion`. Ver
  [docs/motion.md](motion.md). Nada de duraciones, resortes ni presets de Reanimated sueltos en los componentes.
- **Sonido**: `src/lib/sound.ts` con expo-audio y cuatro WAV de pocos KB (`assets/sounds`, generados con
  `node apps/mobile/scripts/build-sounds.mjs` con las mismas notas que la web). Respeta el modo silencio y no
  corta la música. expo-audio es nativo: un development build anterior a este cambio no lo trae y la app queda
  muda sin romperse; hace falta un build nuevo para oírlo. No se usa el plugin de expo-audio (agregaría el
  permiso de micrófono).

## Widget de Android

«Diarios de hoy» / «Today's puzzles»: cuántos diarios de hoy jugaste (`2/5`, o `2/4` en inglés, sin Palabra),
un punto por juego en el orden del registro (verde resuelto, gris no salió, aro amarillo por jugar; con
Daltonismo, los colores de esa paleta), la racha de diarios más larga entre los juegos visibles (🔥, con los
protectores como puente) y los protectores disponibles (🛡️, si hay). Tocarlo abre el **próximo diario sin
jugar** (`cranea://<juego>/diario`); con todo jugado dice «¡Listo por hoy!» y abre el inicio (`cranea:///`).
Solo Android: en iOS, la web y Expo Go no se carga nada.

- **Librería**: [react-native-android-widget](https://github.com/sAleksovski/react-native-android-widget)
  (`plugins/with-daily-widget.js` la configura). Se descartó `expo-widgets`: en Android todavía es nuevo,
  dibuja solo lo que la app le manda (no tiene una tarea en segundo plano que lea el progreso y calcule el día),
  no tiene `updatePeriodMillis` ni vista previa para el selector, y agrega una extensión de widget en iOS.
- **Dos formas** (el usuario elige en el selector; misma información y mismas actualizaciones):
  - **Fila** («Diarios de hoy», `DailyPuzzles`, 4×1): conteo y racha/protectores a la izquierda y una ficha por
    juego (inicial + estado; la próxima con borde). **Cada ficha abre su diario**; el resto, el próximo. Achicada
    a 2×1 queda el conteo con puntos y la racha.
  - **Anillo** («Anillo del día», `DailyRing`, 2×2): anillo con un tramo por juego (SVG), el conteo al medio,
    la racha arriba y el próximo juego abajo. Con todo jugado, el anillo entero con ✓.
- **Tema**: claro y oscuro según el sistema con los tokens de `theme/tokens.ts` (cuaderno / pizarrón); si en
  Ajustes elegiste Cuaderno o Pizarrón, queda ese. Idioma: el de la app (Ajustes → teléfono).
- **Cuándo se actualiza**:
  - Con la app abierta (`WidgetSync` en el layout raíz): al leer el progreso al abrir, al anotar un diario, al
    sincronizar con la cuenta, al cambiar protectores, idioma, tema o colores, al volver al frente o irse, y a la
    medianoche UTC.
  - Sin abrir la app: la tarea en segundo plano (`widgetTaskHandler`, registrada en `index.ts`) corre al
    agregarlo, al cambiarle el tamaño y cada 30 min (`updatePeriodMillis`, lo mínimo de Android). Lee
    `cranea-progress` y `cranea-prefs` de AsyncStorage y calcula «hoy» (UTC) con el reloj del teléfono: después
    de la medianoche UTC el widget pasa al día nuevo en ≤ 30 min (Android no despierta el teléfono para esto:
    si está con la pantalla apagada, se actualiza al prenderla).
- **Lógica**: `dailyWidgetState` en `@cranea/core/widget` (pura, con tests): conteo, próximo diario, juegos
  según el idioma, racha y protectores. El dibujo está en `src/widget/daily-widget.tsx`.
- **Selector de widgets**: nombre y descripción en español (`values/`) e inglés (`values-en/`), en
  `plugins/with-daily-widget.js` (son recursos de Android). Vistas previas: `apps/mobile/assets/widget-preview.png` y `widget-ring-preview.png`,
  generada con `node assets/brand/build-widget-preview.mjs`.
- **Probarlo**: necesita un build nativo nuevo (`eas build --profile development --platform android` o
  `preview`); en Expo Go no existe. En el emulador: mantener apretado el inicio → Widgets → Craneá.
  `expo prebuild` hay que correrlo desde `apps/mobile` (el plugin de la librería escribe con rutas relativas).

## Correrlo en tu máquina

```bash
corepack enable && pnpm install
cp apps/mobile/.env.example apps/mobile/.env.local   # y completá las dos variables
pnpm mobile                                          # = pnpm --filter @cranea/mobile start
```

Variables (son públicas, van dentro de la app):

- `EXPO_PUBLIC_CONVEX_URL`: la misma que `NEXT_PUBLIC_CONVEX_URL` de la web.
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`: la misma que `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

Sin ellas la app funciona igual, sin cuenta ni ranking. Las de RevenueCat y AdMob (opcionales, ver
[Monetización](#monetización)) también están en `.env.example`; sin ellas no hay compras y los anuncios son de prueba.

- **Expo Go** (escaneás el QR): sirve para jugar y probar la UI. El login con Apple/Google puede no
  funcionar ahí, y **las compras y los anuncios están apagados** (son módulos nativos que Expo Go no trae;
  `src/monetization/native.ts` los carga con `require` en línea y, si no están, la app sigue sin ellos).
  Para todo eso usá un development build.
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
- Formularios de privacidad: *Data safety* (Play) y *App Privacy* (Apple). La app guarda: progreso de juego
  y, con cuenta, mail/nombre (Clerk), resultados (Convex) y compras (RevenueCat). Tiene anuncios con
  recompensa de AdMob: ver [Privacidad y anuncios](#4-privacidad-y-anuncios) para lo que hay que declarar.

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

### 6. Recordatorio del diario

Notificaciones **locales** con `expo-notifications` (`src/notifications/reminder.ts`, UI en
`src/components/reminder.tsx`): no hay servidor ni token de push, así que no hace falta configurar FCM/APNs.

- Se prende desde **Tu cuenta → Recordatorio** o con la tarjeta «¿Te aviso mañana?», que aparece una sola vez
  en el inicio y en el diario ya jugado, después del primer diario. Hora por defecto 10:00 (pasos de 15 min).
- Se programan los próximos 7 días uno por uno (`identifier` `cranea-diario-<n>`) y se reprograman al abrir,
  al volver al frente, al guardar un diario y al cambiar la hora. Un día en el que ya jugaste algún diario
  (del día UTC de la hora del aviso) no se avisa.
- Texto: «Tu racha de 5 días te espera 🔥» si hay racha viva para ese día; si no, «Ya están los desafíos de hoy».
- Android: canal `diario`; el permiso `POST_NOTIFICATIONS` (Android 13+) y `RECEIVE_BOOT_COMPLETED` los trae el
  módulo. Plugin en `app.config.ts`: `["expo-notifications", { color }]`. Falta un ícono monocromo propio para la
  barra (`icon` del plugin); sin él Android usa el de la app.
- Al tocar el aviso la app abre en el inicio (los diarios de hoy). Con la app abierta no se muestra el cartel.
- **Expo Go**: apagado (el módulo se carga con `require` en línea y en Expo Go no se carga); la pantalla de
  cuenta lo explica. Hace falta un build nuevo (development/preview) porque suma un módulo nativo.

### 7. Actualizaciones sin pasar por la tienda (EAS Update)

Ya está configurado (`expo-updates`, `runtimeVersion: fingerprint`, un `channel` por perfil en `eas.json`).
Los cambios de JS, textos, estilos y niveles se publican sin build nuevo; la app los baja al abrir y los
usa la vez siguiente.

```sh
cd apps/mobile
npx eas-cli@latest update --channel preview --message "Arreglo X"     # los APK de prueba
npx eas-cli@latest update --channel production --message "Arreglo X"  # la app de la tienda
```

- **Cuándo hace falta un build nuevo:** si cambia algo nativo (un paquete con código nativo, permisos,
  `app.config.ts`, íconos). El fingerprint cambia y los builds viejos ignoran esa actualización.
- **Volver atrás:** `npx eas-cli@latest update:rollback` o republicar el commit anterior.

### 8. Links de cranea.app que abren la app (Android App Links)

`app.config.ts` declara las rutas (`APP_LINK_PATHS`) y la web publica
`apps/web/public/.well-known/assetlinks.json` con la huella SHA-256 de la firma.
Hoy tiene la de EAS (APK de prueba). **Cuando la app esté en Play Console**, agregá la huella de
"Firma de apps de Google Play" (Play Console → Configuración → Integridad de la app → Firma de apps) al
arreglo `sha256_cert_fingerprints`, si no los links abren el navegador en la versión de la tienda.
Comprobar en el celular: `adb shell pm get-app-links app.cranea` tiene que decir `verified`.

## Monetización

Decisión del dueño (final):

| Gratis | Craneá Plus (suscripción) |
| --- | --- |
| Los 5 desafíos de hoy, cómo se juega, ranking, estadísticas, **los primeros 3 niveles del primer mundo** de cada juego | El resto de los niveles y mundos, archivo de diarios anteriores (práctica), pistas sin límite, sin anuncios |

- **Pistas sin Plus**: 1 por tablero (diario o nivel). Volver a ver una pista ya pedida no gasta. Sin pistas,
  «Ver un anuncio para una pista».
- **Intento extra**: al perder un diario oficial (no práctica) la hoja de resultado ofrece «Ver un anuncio: un
  intento más», una vez por diario; con Plus es «Usar un intento más», sin anuncio. La solución queda tapada
  hasta que la persona elige (o toca «Ver la solución», que renuncia al intento). Se ofrece solo en esa hoja:
  si salís del diario sin elegir, el diario queda perdido.
- **Nunca** banners ni intersticiales, y nunca anuncios con Plus.
- **Niveles gratis**: `FREE_LEVELS = 3` en `src/entitlements/index.ts` (app) y en `apps/web/src/lib/free-levels.ts`
  (web, solo cuenta con `NEXT_PUBLIC_PLUS_ENABLED=1`). Sin Plus, «Seguir jugando» y «Siguiente nivel» apuntan a
  los niveles gratis; terminados, el inicio del juego muestra «Completaste los niveles gratis» con Plus, y los
  niveles 4+ tienen candado (tocarlos abre Plus).
- **«¿Querés seguir?»** (`components/plus-nudge.tsx` en la app, `components/plus/plus-nudge.tsx` en la web):
  tarjeta chica al ganar el diario (hoja de resultado y pantalla de «ya jugado») o un nivel gratis: «Tenés N
  niveles más de <Juego> con Craneá Plus» (N = todos los niveles del juego menos los gratis). El botón dice
  «Probá gratis 3 días» si la tienda tiene una prueba para esa persona (la app la lee del paquete de RevenueCat:
  `defaultOption.freePhase` en Android, `introPrice` con precio 0 en iOS más el chequeo de elegibilidad); si no,
  «Ver Craneá Plus». En la web el texto es fijo (`PLUS_TRIAL` en `lib/plus.ts`; vacío no se muestra). Nunca con
  Plus ni en prácticas, va debajo de las acciones, y aparece a lo sumo una vez por día y por juego (el mismo
  momento puede reaparecer; cerrarla con la X la saca por el resto del día). Se guarda en `cranea-plus-nudge`.
- Lo que es gratis vive en `src/entitlements/index.ts` (`FREE_LEVELS`, `FREE_HINTS`). Las pantallas preguntan
  `usePlus()` / `can(...)`, nunca a la tienda.

### Cómo se sabe si hay Plus

Hay Plus si **RevenueCat** lo dice en el dispositivo (`customerInfo.entitlements.active.plus`) **o** si lo dice
**Convex** (`api.entitlements.mine`, escrito por el webhook de RevenueCat o por `entitlements:grant`). Así vale lo
comprado en otro dispositivo, en la web o regalado a mano. Lo último que se supo se guarda (`cranea-plus`, por
cuenta) para jugar sin conexión; un vencimiento se respeta con 3 días de gracia por si la renovación no llegó.

- `appUserID` de RevenueCat = id de Clerk (`user.id`, igual al `subject` de Convex). `Purchases.logIn` al entrar,
  `logOut` al salir (`src/monetization/sync.tsx`). **Para comprar hay que tener cuenta**: así el webhook marca
  Plus en la cuenta y la web lo ve.
- Precios: salen de la oferta actual de RevenueCat (`getOfferings`), nunca están escritos en el código.

### Intento extra y el ranking

El intento oficial se cierra con la derrota, como siempre (se guarda en el acto). Si el intento extra sale, se
guarda **otro** resultado del diario: `won: true`, `attempts` = los de la derrota + 1 (más que el máximo del
diario), `at` = ahora. La regla compartida `first` (`apps/web/convex/results.ts`, la misma en la app y en el
servidor, la usa `recordDaily` del dispositivo) lo deja reemplazar a la derrota para racha y estadísticas, y el
ranking lo sigue contando como no resuelto (`assisted` en `convex/ranking.ts`). Si no sale, no se guarda nada
más. Las prácticas (repetir el de hoy, el archivo) nunca se guardan.

### Qué tenés que hacer vos

#### 1. Productos en las tiendas

- **App Store Connect** → tu app → *Subscriptions*: creá un grupo «Craneá Plus» con dos suscripciones
  auto-renovables: `plus_monthly` (USD 1,99/mes) y `plus_yearly` (USD 14,99/año). Precios por país con la
  tabla de Apple. Completá nombre visible y descripción en español, captura de revisión, y aceptá el
  *Paid Applications Agreement* (Business → Agreements, con datos bancarios e impuestos).
- **Play Console** → *Monetize → Products → Subscriptions*: `plus_monthly` y `plus_yearly`, cada una con un
  *base plan* (mensual / anual, auto-renovable). Hace falta un perfil de pagos y haber subido un AAB con la
  librería de facturación (cualquier build de producción o de prueba interna sirve).
- Prueba gratis: ver [Prueba gratis](#prueba-gratis-3-días) abajo. No es código: se configura en cada tienda.

#### Prueba gratis (3 días)

El dueño pidió 2 días, pero **ninguna tienda lo permite**: Google Play acepta pruebas de 3 días a 3 años
(«Free trial phases can range from 3 days to 3 years», ayuda de Play Console sobre ofertas) y Apple ofrece solo
3 días, 1 o 2 semanas, 1, 2, 3 o 6 meses o 1 año. Lo más corto posible, y lo recomendado, es **3 días en las
dos tiendas**. La app no tiene la duración escrita: la lee de la tienda y muestra «3 días gratis, después
USD 14,99 por año» en el plan y «Empezar 3 días gratis» en el botón. Solo `PLUS_TRIAL` de la web es fijo:
si cambia la duración, cambialo ahí.

**Google Play Console** (después de crear `plus_yearly` con su base plan):

1. *Monetize with Play → Products → Subscriptions* → `plus_yearly`.
2. En el base plan anual (activo), *Add offer*.
3. *Offer ID*: `free-trial-3d` (no se puede cambiar después).
4. *Eligibility*: **New customer acquisition** → «Never had this subscription» (o «Never had any subscription»
   si también ofrecés prueba en `plus_monthly` y querés una sola prueba por persona).
5. *Phases → Add phase* → **Free trial**, duración **3 days**.
6. *Regional availability*: todas las regiones del base plan.
7. *Save* y *Activate*. Opcional: lo mismo en `plus_monthly` (si las dos tienen prueba, la de «Never had any
   subscription» evita que alguien encadene dos pruebas).
8. RevenueCat la toma sola (`defaultOption` = la oferta más conveniente para la persona). Probalo con una
   cuenta de *License testers*: en pruebas, 3 días duran unos minutos.

**App Store Connect**:

1. *Apps* → Craneá → *Subscriptions* → grupo «Craneá Plus» → `plus_yearly`.
2. *Subscription Prices* → *View all Subscription pricing* → **Set up Introductory Offer**.
3. Países: todos. Fecha de inicio: hoy; sin fecha de fin.
4. Tipo **Free**, duración **3 Days** → *Confirm*. (No se edita: para cambiarla se borra y se crea otra.)
5. Cada persona puede usar una sola oferta introductoria por grupo de suscripciones: si también la ponés en
   `plus_monthly`, igual es una prueba por persona.
6. En Sandbox, 3 días duran 3 minutos.

En las dos tiendas, quien ya tuvo una prueba no ve otra: la app pregunta la elegibilidad en iOS y en Android
Play solo devuelve las ofertas que le corresponden, así que el texto de la prueba no aparece de más.

#### 2. RevenueCat (https://app.revenuecat.com)

1. Proyecto «Craneá» con dos apps: App Store (bundle id de `app.config.ts`, con la *In-App Purchase Key* de App
   Store Connect) y Play Store (package, con la cuenta de servicio de Google Cloud con acceso a Play).
2. *Products*: importá `plus_monthly` y `plus_yearly` de las dos tiendas.
3. *Entitlements*: uno con identificador **`plus`**, con los cuatro productos.
4. *Offerings*: una oferta **`default`** marcada como *current*, con los paquetes `$rc_monthly` (mensual) y
   `$rc_annual` (anual).
5. *Integrations → Webhooks*: URL `https://<deployment>.convex.site/revenuecat` (es el dominio `.convex.site`,
   no `.convex.cloud`) y en *Authorization header* un valor largo al azar. Ese mismo valor va en Convex:
   `npx convex env set REVENUECAT_WEBHOOK_AUTH '<valor>'` (en dev y en prod). El botón «Send test event» debe
   responder 200.
6. *API keys*: las **public app-specific** de iOS (`appl_…`) y Android (`goog_…`) van en
   `EXPO_PUBLIC_REVENUECAT_IOS_KEY` y `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` (en `.env.local` y con
   `eas env:create` en cada entorno). Son públicas; nunca pongas la secreta (`sk_…`) en la app.

Para probar: iOS con una cuenta *Sandbox* (o el archivo StoreKit de RevenueCat) y Android con *License testers*
en Play Console y la app instalada desde una pista de prueba. «Restaurar compras» está en la pantalla de Plus;
«Gestionar suscripción» (Cuenta y Plus) abre la página de la tienda.

#### 3. AdMob (https://admob.google.com)

1. Creá dos apps (Android e iOS) y en cada una un bloque **Rewarded** («Pista y intento extra»).
2. Variables (en `.env.local` y `eas env:create`):
   - `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`, `EXPO_PUBLIC_ADMOB_IOS_APP_ID` (`ca-app-pub-…~…`). Se leen **al
     compilar** (config plugin en `app.config.ts`): si cambian, hace falta un build nuevo.
   - `EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID`, `EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID` (`ca-app-pub-…/…`).
   Sin ellas se usan los ids de **prueba** de Google (anuncios de prueba, sin ingresos): es lo correcto en
   desarrollo. Nunca toques tus propios anuncios reales.
3. *Privacy & messaging*: creá un mensaje **GDPR** (Europa/Reino Unido/Suiza) y, si querés, uno de estados de EE.
   UU. La app lo muestra con UMP antes del primer anuncio y solo donde corresponde; si la persona tiene que poder
   cambiarlo, en Cuenta aparece «Privacidad de los anuncios».
4. Publicá el `app-ads.txt` en el dominio de la web (el que figura como sitio en las fichas de las tiendas).

**ATT (iOS)**: no se pide. La app solo pide anuncios **no personalizados** (`requestNonPersonalizedAdsOnly`),
no lee el IDFA y no tiene `NSUserTrackingUsageDescription`. Paga algo menos por anuncio, pero evita el cartel
de rastreo y simplifica las etiquetas de privacidad. Si algún día se quieren anuncios personalizados, habría que
agregar `expo-tracking-transparency`, pedir permiso antes de inicializar y declarar tracking.

#### 4. Privacidad y anuncios

- **Google Play → Data safety**: «Contiene anuncios: sí». El SDK de anuncios recopila y comparte con Google:
  *Device or other IDs* (ID de publicidad; Android lo lee aunque los anuncios sean no personalizados),
  ubicación aproximada (por IP), interacciones con la app y diagnósticos, para **publicidad** y análisis/fraude.
  Compras: historial de compras (RevenueCat/Google Play). Más lo que ya estaba (mail y nombre con cuenta, progreso).
  Guía de Google: https://developers.google.com/admob/android/privacy/play-data-disclosure
- **App Store → App Privacy**: *Identifiers → Device ID*, *Location → Coarse location*, *Usage Data → Advertising
  data / Product interaction*, *Diagnostics*, usados para *Third-party advertising* y *Analytics*, **no**
  vinculados a la identidad y **sin tracking** (no hay ATT). *Purchases → Purchase history* para funcionalidad.
  Guía: https://developers.google.com/admob/ios/privacy/data-disclosure
- Clasificación por edades: la app no está dirigida a menores; los anuncios piden contenido apto «PG». Si en
  el cuestionario de Play elegís un público que incluye menores de 13, Google exige SDKs certificados para
  Familias y otras reglas: dejalo en 13+.
- La **política de privacidad** (`PRIVACY_URL`) tiene que mencionar AdMob (Google), RevenueCat, Clerk y Convex.
- Apple pide en la pantalla de compra el precio, el período, que se renueva sola, y enlaces a Términos y
  Privacidad: ya están. Si publicás términos propios, cambiá `TERMS_URL` en `src/config.ts` (hoy apunta al
  EULA estándar de Apple).

#### 5. Expo Go y builds

Compras y anuncios necesitan un **development build** (`eas build --profile development`). En Expo Go la app
anda igual: la pantalla de Plus explica que ahí no se puede comprar y no se ofrecen anuncios.

Las compras dentro de la app tienen que usar el sistema de cada tienda (comisión 15 % en el programa para
pequeños desarrolladores de ambas; anotate en los dos).
