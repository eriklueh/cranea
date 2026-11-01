# Craneá

Plataforma de juegos de lógica. Primer juego: **Cifra**, descubrir un código secreto cruzando pistas ya puntuadas.

```
cranea/
├─ packages/core      Lógica pura en TypeScript (sin React). La comparten la web y la app Expo.
│  ├─ src/cifra       Puntaje, solver "humano", generador con semilla, mundos
│  ├─ scripts/        build-levels.ts → pregenera los niveles
│  └─ levels/         cifra.json (120 niveles fijos)
├─ apps/web           Next.js 16 + Tailwind 4 + shadcn/ui + Zustand
│  ├─ src/app         Rutas: /, /cifra, /cifra/nivel/[mundo]/[nivel], /cifra/diario, /cifra/como-jugar
│  ├─ src/games       Un directorio por juego + registry.ts
│  └─ src/stores      progress.ts: progreso de todos los juegos (localStorage)
└─ apps/mobile        Expo + expo-router: app nativa (ver docs/mobile.md)
```

## Empezar

```bash
corepack enable          # activa pnpm
pnpm install
pnpm dev                 # http://localhost:3000
pnpm test                # tests del motor (unicidad y deducibilidad de tableros)
pnpm levels              # regenera packages/core/levels/cifra.json (~1 min)
```

## Cómo funciona Cifra

- **Generador** (`packages/core/src/cifra/generator.ts`): con una semilla arma un secreto y filas puntuadas hasta que un solo código encaja, y después quita las filas que sobran.
- **Solver** (`solver.ts`): resuelve como una persona, en tres niveles de técnica. Si no llega sin adivinar, el tablero se descarta. El nivel de técnica que necesitó define la dificultad.
  1. Lectura directa: filas en cero, filas completas, descartes simples.
  2. Cruce de filas: contar lo que ya sabés en cada fila y cerrar el resto.
  3. Suposición: probar una cifra en un lugar y llegar a una contradicción.
- **Traza** (`trace.ts`): `traceSolve(clues, length)` aplica las mismas técnicas de a una fila y una regla, y anota cada deducción en palabras con las filas que intervienen y los hechos que deja (`out`, `in`, `fixed`, `removed`). La usan las pistas y "¿Cómo se resolvía?".
- **Niveles**: los 4 mundos están en `levels.ts`. Se empieza en cuatro cifras; conservan los IDs 2–5 para mantener rutas y progreso existentes. Se pregeneran a JSON para que no cambien si tocás el generador.
  `pnpm levels` genera 90 candidatos determinísticos por mundo, elige 30 minimizando los saltos de dificultad al cuadrado y los ordena de menor a mayor. El campo `d` guarda `steps + 3 * tier2Uses + 8 * tier3Uses + filas`, calculado sobre el orden final de las pistas. Los usos cuentan pasadas productivas sobre el estado real del solver, sin contar pruebas hipotéticas ni validaciones finales.
  Después de minimizar, se permiten como máximo una fila en cero y `maxDirectEliminations` cifras descartadas por esas filas; siempre deben quedar más cifras posibles que lugares en el código. En cuatro o cinco cifras se exige presencia de ambos tipos de puntaje. La relajación de técnica nunca relaja estas reglas de balance.
  Todas las cifras de la solución deben aparecer en las pistas finales. Se valida después de minimizar, también en el diario y cuando se relaja el mínimo de técnica: una solución única por descarte no alcanza para aceptar un tablero.

  `pnpm --filter @cranea/core audit:levels` comprueba los 120 niveles y 366 diarios desde el 22/10/2026. Enumera independientemente todas las combinaciones, recalcula los puntajes y verifica unicidad, resolución, cobertura de cifras y balance. Los informes antes/después de agregar la cobertura están en `docs/audits`.
- **Diario**: se genera en el cliente con la fecha UTC como semilla; todos ven el mismo tablero.
- **Marcas manuales** (`marks.ts`): `emptyMarks()`, `nextMark(marks, row, position)` y `tileMarkState(marks, row, position)` son funciones puras compartidas con Expo. Filas y columnas empiezan en cero; los intentos fallidos se agregan después de las pistas. Cada casilla cicla descartada → va → va ahí → sin marcar de forma independiente, sin cambiar otras apariciones de la misma cifra ni el teclado. Estas notas no deducen ni completan nada automáticamente. En web se guardan con la partida en curso y no forman parte de `cranea-progress`.
- **Lápiz**: permite dibujar sobre el juego con mouse, dedo o stylus, con espacio libre arriba y abajo y márgenes amplios en escritorio. Mientras está activo, el tablero no recibe toques ni entradas de código. La mano permite desplazar la página sin dibujar; las herramientas permanecen visibles. **Listo** o Escape vuelve al juego conservando el dibujo; también se puede deshacer el último trazo o borrar todo. Los trazos se adaptan al tema, permanecen al agregar intentos y se guardan con la partida en curso de cada tablero. Son notas locales y no se guardan en `cranea-progress`.
- **Partida en curso**: tablero, intentos, marcas, pistas usadas y tiempo jugado se guardan en el dispositivo por tablero (`cranea-cifra-partida:<id>`, el dibujo en `cranea-cifra-dibujo:<id>`; el id del diario incluye la fecha). Al volver se retoma; el reloj no cuenta mientras la app está cerrada o en segundo plano. **Reintentar** o terminar la partida la borra. Si el tablero cambió o lo guardado no cierra, se descarta.
- **Pistas**: el botón **Pista** usa la traza. El primer toque resalta las filas a cruzar; el segundo explica la deducción. Saltea los pasos que tus marcas ya muestran y nunca completa ni marca fichas. Al terminar, **¿Cómo se resolvía?** recorre la traza paso a paso.
- **Festejos**: al ganar todos los niveles de un mundo se muestra un resumen (niveles, tiempo total, intentos promedio); también al llegar a 7 y 30 diarios seguidos. Con movimiento reducido no hay animación.

## Estadísticas y ranking

- **/estadisticas** calcula todo con el progreso del dispositivo (`gameStats` en `stores/progress.ts`), así que funciona sin sesión y sin red. Recorre los juegos `live` del registro.
- **/ranking?juego=<id>&fecha=YYYY-MM-DD** muestra el diario de cada juego en vivo (`convex/ranking.ts`): primero quienes ganaron, después menos intentos y menos tiempo. Para aparecer hay que iniciar sesión y elegir un apodo (tabla `profiles`). Al sumarse se copian a `dailyResults` los diarios ya guardados; después, `progress.save` copia cada diario nuevo. Solo entran partidas del jugador autenticado, válidas y terminadas durante ese día UTC (`rankable` en `convex/results.ts`). Al dejar de aparecer se borran sus filas.
- **Semana, mes y General**: `/ranking?periodo=semana|mes&juego=<id>|general&fecha=YYYY-MM-DD`. Sin `juego`, muestra el General (los 5 juegos); el General también tiene tablero del día. Cada diario oficial suma por su resultado (`convex/scoring.ts`): 2 por jugarlo, 8 más por resolverlo, hasta 5 por intentos (todos con el primero, ninguno con el último permitido) y hasta 5 por el tiempo del servidor (todos hasta el tiempo de referencia del juego, ninguno desde cuatro veces ese tiempo). Máximo 20 por diario. Empates: más resueltos, después menos tiempo. Semanas ISO (lunes a domingo) y meses calendario, en UTC.
  Se puntúa por resultado y no por puesto para que el total no cambie cuando llegan otros jugadores. `periodScores` guarda los totales por jugador, tablero y período: `publishDaily` los recalcula desde `dailyResults` de ese jugador (≤ 5 lecturas por índice), así que consultar no recorre partidas y recalcular es idempotente. Para los diarios publicados antes de esta tabla: `npx convex run leaderboards:rebuild` (se puede repetir).

## Craneá Plus (web)

- **Gratis**: los cinco diarios de hoy (también repetirlos como práctica), tutoriales, ranking, estadísticas y logros. **Plus**: todos los niveles, el archivo de diarios anteriores, pistas sin límite y la app sin publicidad. Se compra en la app (RevenueCat); la misma cuenta de Clerk lo activa en la web.
- `lib/plus.ts`: `usePlus()` → `{ plus, ready }`. `components/plus/plus-sync.tsx` lee `api.entitlements.mine` y guarda el último valor en `cranea-plus`: quien ya tenía Plus no ve candados al abrir, ni sin conexión; un dispositivo nuevo arranca sin Plus. Solo al cerrar sesión se olvida. En `next dev`, `localStorage["cranea-plus-dev"] = "1"` (o `"0"`) lo fuerza.
- `components/plus/paywall.tsx`: `openPaywall(motivo)` abre la hoja (montada en `AccountProvider`); `<PlusGate>` muestra la propuesta en lugar de un nivel o un diario anterior, sin montar el tablero. Las páginas siguen siendo estáticas: se decide en el cliente.
- Pistas de Cifra: sin Plus, una por tablero (`cranea-pistas:<id>`, los pasos ya vistos se pueden volver a ver).
- Tiendas: `NEXT_PUBLIC_APP_STORE_URL` y `NEXT_PUBLIC_PLAY_STORE_URL`; vacías, el botón lleva a `/plus#app`. Precio de muestra: `PLUS_PRICE`.

## Logros

- **Catálogo y evaluación** en `packages/core/src/achievements` (`evaluateAchievements`, pura y con tests): ~20 logros que salen del progreso del dispositivo (`cranea-progress`), así que funcionan sin sesión. Cada uno informa avance (`value`/`goal`) y cuándo se cumplió según las partidas.
- **Web**: `stores/achievements.ts` guarda los desbloqueados con su fecha (`cranea-logros`). `components/achievements-provider.tsx` (en el layout) evalúa con cada cambio del progreso y muestra un aviso arriba; lo que ya estaba cumplido la primera vez se desbloquea sin aviso, y tres o más juntos se resumen en uno. Con sesión se guardan en la tabla `achievements` de Convex (vale la fecha más antigua). Se ven en `/logros` y desde `/estadisticas`.

## Protector de racha

Lógica pura y con tests en `packages/core/src/protectors` (la usan la web, la app y Convex).

- **Qué protege**: un día UTC entero **sin ningún diario jugado**. Ese día puentea todas las rachas: la de cada juego (diarios ganados seguidos, la que se ve en tarjetas, estadísticas y el diario) y la **Racha Craneá** (los cinco jugados). No suma días. Un día en el que jugaste algo no es un día perdido: si perdiste un diario, esa racha se corta igual.
- **Cómo se gana**: 1 cada 7 días seguidos jugando algún diario (máximo 2 guardados; los días cubiertos no cortan la cuenta pero tampoco suman). Con **Plus**, el primer día de cada mes en que se abre con Plus el stock pasa a 2 (no acumula más). En la web cuenta el Plus real de la cuenta (`usePlusStore`), no el interruptor `PLUS_ENABLED`.
- **Cuándo se usa**: solo, y solo si salva la racha: hace falta haber jugado (o tener cubierto) el día anterior al hueco y que alcancen para **todo** el hueco hasta ayer. Si faltaste más días de los que tenés, la racha se corta y los protectores quedan. Hoy nunca se cubre.
- **Estado**: stock y días cubiertos **se derivan** del historial de diarios (que ya se sincroniza); se guarda solo `protectors: { since, plus, seen }` dentro de `cranea-progress` (campo opcional, el formato sigue en versión 1, sin migración). `since`: desde cuándo corren las reglas (no se cubre nada antes); `plus`: el día en que se vio Plus en cada mes; `seen`: días cubiertos ya avisados.
- **Cuenta**: tabla `protectors` de Convex (`convex/protectors.ts`). Combinar (`mergeProtectors`) toma el `since` más antiguo, el primer día de Plus de cada mes y la unión de `seen`: es conmutativa e idempotente, y como el stock se recalcula del historial, dos dispositivos no pueden gastar ni duplicar el mismo protector.
- **UI**: 🛡️×N junto a la racha (inicio, tarjeta del diario, diario ya jugado en la app) y en Estadísticas, con una hoja que lo explica; al usarse uno, un aviso «Usaste un protector: tu racha sigue en 12». Los logros de racha (`evaluateAchievements({ covered })`) usan los mismos días cubiertos. `dailyStreak`/`bestStreak`/`craneaStreak` los aplican solos.

## Cómo funciona Puentes

Hashi: islas con números que se unen con puentes rectos (máximo dos por par), sin cruces y formando un solo grupo. Rutas: `/puentes`, `/puentes/nivel/[mundo]/[nivel]`, `/puentes/diario`, `/puentes/como-jugar`.

- **Generador** (`packages/core/src/puentes/generator.ts`): con una semilla hace crecer un árbol de puentes desde una isla (saltos casi siempre cortos, sin islas pegadas), suma algunos ciclos que no cruzan nada y escribe los números. Las conexiones posibles se derivan de las islas (`findEdges`, en orden de lectura).
- **Solver** (`solver.ts`): deduce como una persona, guardando para cada conexión un rango de 0 a 2 puentes. Si no termina sin adivinar, el tablero se descarta; como cada deducción es válida para cualquier solución, terminar implica solución única.
  1. Conteo: lo que le falta a cada isla contra lo que pueden darle sus vecinas; un puente tendido cierra los que lo cortan.
  2. Conexión: no cerrar un grupo que no incluya todas las islas y usar la única salida de un grupo.
  3. Suposición: probar un valor en una conexión y llegar a una contradicción con 1 y 2.
- **Niveles** (`levels.ts`): 4 mundos de 24 niveles (5×5 conteo, 7×7 conexión, 9×9 y 11×11 con suposición). `pnpm --filter @cranea/core levels:puentes` genera 96 candidatos por mundo, descarta los que quedan debajo de la mediana del mundo anterior y elige la curva más suave, como Cifra. `d = steps + 3 * tier2Uses + 8 * tier3Uses + islas`. Se guardan en `levels/puentes.json` (filas del tablero + puentes de la solución, ~15 KB).
- **Tests** (`puentes.test.ts`): cada nivel publicado y 40 diarios se validan con el solver, con `countSolutions` y con una búsqueda exhaustiva independiente que no usa el código de producción.
- **Diario**: 7×7, se genera en el cliente con la fecha UTC como semilla. Se juega una vez: si ya está guardado, se muestra resuelto.
- **Errores e intentos**: no se pierde. **Revisar** marca en rojo los puentes que sobran respecto de la solución; si hay alguno suma un error, si no dice cuántos faltan sin costo. Un puente que cruzaría otro directamente no se tiende y no cuenta. Al conectar todo se guarda `won: true`, `attempts = 1 + errores`. En el mapa: 3 puntitos sin errores, 2 con uno, 1 con más.
- **Controles**: deslizar desde una isla, tocar dos islas o tocar el espacio entre ellas cicla 0 → 1 → 2 → 0. Deshacer (también Ctrl+Z) y empezar de nuevo (deshacible). Teclado: flechas entre islas, Mayús + flecha tiende un puente, Enter selecciona.

## Cómo funciona Palabra

Palabra oculta de cinco letras (`/palabra`), como Wordle: probás palabras y cada letra se pinta (verde: en su lugar; amarilla: en otro lugar; gris: no está, o no hay más de esa letra). Las pistas salen solo de tus intentos.

- **Listas** (`packages/core/src/palabra/words.ts`): escritas a mano para el proyecto, sin datasets externos. ~900 respuestas (sustantivos, adjetivos y verbos en infinitivo comunes, sin plurales ni palabras ofensivas o de doble sentido rioplatense) y ~2150 palabras válidas para probar (respuestas + plurales, femeninos, conjugaciones de verbos regulares generadas y palabras menos comunes).
- **Tildes**: todo se compara normalizado (`normalize.ts`): sin tildes ni diéresis (Á = A, Ü = U) y con la Ñ como letra propia. Las fichas muestran mayúsculas sin tilde; al terminar se muestra la respuesta con tildes.
- **Puntaje** (`score.ts`): verdes primero; cada amarilla consume una aparición todavía libre de esa letra.
- **Generador** (`generator.ts`): con una semilla elige la respuesta de la lista, sin repetir entre niveles. `hardModeError` valida el modo difícil (las verdes no se mueven y las letras descubiertas se vuelven a usar).
- **Niveles**: 4 mundos de 24 en `levels.ts`: seis, cinco y cuatro intentos, y modo difícil con cinco. Pregenerados con `pnpm --filter @cranea/core levels:palabra` → `levels/palabra.json`. El diario tiene seis intentos.
- **Diario**: se genera en el cliente con la fecha UTC; se juega una vez. Cambiar la lista de respuestas cambia los diarios futuros.
- **Web**: las listas se cargan con un import dinámico solo en las páginas del juego (un chunk propio de ~7 KB gzip que el service worker guarda para jugar sin conexión). Una palabra fuera de la lista sacude la fila y no gasta intento.

## Cómo funciona Torres

Cuadrado latino de N×N con alturas 1..N; los números del borde dicen cuántas torres se ven desde ese lado. Rutas: `/torres`, `/torres/nivel/[mundo]/[nivel]`, `/torres/diario`, `/torres/como-jugar`.

- **Motor** (`packages/core/src/torres`): `board.ts` tiene las reglas puras (torres visibles, pistas de un tablero, estado de cada pista y repetidos para la UI). `solver.ts` trabaja con candidatos por casilla y resuelve en tres niveles; si no llega sin adivinar, el tablero se descarta:
  1. Lectura directa: límites por pista (a distancia i del borde, con pista c, nada mayor que N − c + 1 + i; un 1 pone la más alta pegada al borde), únicos desnudos y ocultos.
  2. Cruce de una línea: combinaciones posibles de una fila o columna con sus candidatos y sus dos pistas.
  3. Suposición: probar una altura y descartarla si las técnicas 1 y 2 llegan a una contradicción.
- **Generador** (`generator.ts`): cuadrado latino al azar con semilla, todas las pistas, casillas dadas solo donde el solver se traba, y después quita dadas y pistas mientras siga siendo deducible con el techo de técnica. Como cada paso es deducción válida, deducible implica solución única. Máximo ⌊N²/8⌋ dadas y al menos N pistas.
- **Niveles** (`levels.ts`): 4 mundos de 24 niveles (4×4, 5×5, 6×6, 7×7). `pnpm --filter @cranea/core levels:torres` genera 72 candidatos por mundo alternando el techo de técnica del mundo, elige 24 con la misma curva que Cifra y escribe `levels/torres.json` (determinístico, ~1 min). `d = pasos + 3 × usos de técnica 2 + 8 × usos de técnica 3`.
- **Tests** (`torres.test.ts`): cada nivel publicado y una muestra de diarios se verifican con un conteo de soluciones independiente del solver (búsqueda solo con las reglas), además de resolución humana, técnica, dificultad y curva.
- **Diario**: 5×5 con técnicas 2–3, generado en el cliente con la fecha UTC (`torres:daily:YYYY-MM-DD`). Se juega una vez: si ya hay resultado de hoy, se muestra en lugar del tablero.
- **Intentos**: `1 + comprobaciones fallidas`, con 3 como máximo. **Comprobar** revisa lo escrito contra la solución: si está todo bien no cuesta nada; si hay errores los marca y gasta un intento. A la tercera fallida la partida se pierde (`attempts = 3`, `won = false`). Llenar el tablero sin repetidos y con todas las pistas cumplidas es ganar (con solución única no hay otra forma). Las ayudas visuales (pistas en verde o rojo, repetidos en rojo) no cuestan intentos.
- **Juego** (`apps/web/src/games/torres`): tocá una casilla y elegí la altura; **Notas** anota candidatos chiquitos; **Deshacer**, **Reiniciar** (también se puede deshacer). Teclado: flechas, números, Shift + número o N para notas, Borrar, Ctrl + Z. Notas e historial son de la partida y no se guardan.

## Tutoriales

Cada juego tiene un primer nivel guiado en `/<juego>/tutorial` (se llega desde "Cómo se juega"). También aparece solo la primera vez que se abre el primer nivel del primer mundo, si ese nivel no tiene partidas y el tutorial nunca se terminó ni se salteó.

- **Tableros** (`packages/core/src/<juego>/tutorial.ts`): hechos a mano, más chicos que el nivel 1 (Cifra de 3 cifras, Puentes 5×5 con 6 islas, Nonograma 4×4, Torres 3×3, Palabra PALTA → PLATO). `tutorials.test.ts` verifica con los solvers que tengan una sola solución y salgan sin adivinar.
- **Motor** (`apps/web/src/components/tutorial`): se juega con los componentes reales en modo `{ kind: "tutorial" }`, que no llama a `recordLevel` ni `recordDaily` y no guarda la partida en curso. Cada guion (`apps/web/src/games/<juego>/tutorial.tsx`) es una lista de pasos: texto, lo que se resalta (`data-tutorial="..."` en los componentes) y un `check` sobre el estado del store. El overlay escucha el store: si la jugada es la esperada avanza, si va bien la acepta y si no la deshace y avisa. Los pasos sin `check` se leen y avanzan con **Siguiente**. `machine.ts` es la lógica pura de pasos (tests en `apps/web/scripts/tutorial-machine.test.mjs`).
- **Overlay**: oscurece la pantalla con un SVG par-impar; los huecos dejan pasar los toques y el resto los bloquea (tocar afuera avisa). Se posiciona con `getBoundingClientRect` y se actualiza con `ResizeObserver`, scroll y cambios del DOM. El globo va arriba o abajo de lo resaltado sin taparlo; cada paso se anuncia con `aria-live`. **Saltar** está siempre visible.
- **Guardado**: `cranea-tutorials` en localStorage (`{ <juego>: { state: "done" | "skipped", at } }`), aparte de `cranea-progress`.

## Sumar un juego nuevo

1. Lógica en `packages/core/src/<juego>/` (pura, testeable, reutilizable en Expo).
2. UI en `apps/web/src/games/<juego>/` y rutas en `apps/web/src/app/<juego>/`.
3. Agregalo a `apps/web/src/games/registry.ts`.
4. Guardá resultados con `useProgress().recordLevel("<juego>", ...)`; el store ya es multi-juego.

## Deploy en Vercel

1. Subí el repo a GitHub e importalo en Vercel.
2. **Root Directory**: `apps/web`. Vercel detecta pnpm y el monorepo solo.
3. Listo: todas las páginas de niveles se generan estáticas.

## PWA e instalación

La versión de producción incluye manifest, íconos normales y maskable, ícono de inicio para iOS y un service worker. El botón de descarga del encabezado permite instalarla o muestra los pasos del navegador. La primera descarga completa guarda los 120 niveles, el diario, las páginas y sus recursos; el diálogo de instalación confirma cuándo están disponibles sin conexión. El diario se calcula localmente y también funciona sin red.

`pnpm build` ejecuta `scripts/build-pwa.mjs` después de Next: usa las rutas y los recursos reales del build para generar `public/sw.js`. No se registra un service worker durante `pnpm dev`. Para probarlo localmente: `pnpm build` y `pnpm --filter @cranea/web start`. Después de que la descarga termine, se puede apagar el servidor y abrir un nivel que nunca se visitó. Las actualizaciones esperan al botón **Actualizar**; no reinician una partida automáticamente. El progreso conserva la clave y el formato `cranea-progress`.

`pnpm test` incluye tests del motor y del service worker (navegación sin red, actualización, fallos de descarga y aislamiento de caché). Completá la validación con `pnpm -r typecheck` y `pnpm build`.

### Recordatorio diario

La campana del encabezado activa un aviso Web Push a la hora local elegida (10:00 por defecto). Funciona con o sin sesión; con sesión, no avisa si ya jugaste el diario de ese día UTC. En iPhone y iPad requiere la app instalada. Sin `NEXT_PUBLIC_CONVEX_URL` o sin `NEXT_PUBLIC_VAPID_PUBLIC_KEY` la campana no aparece.

- `convex/reminders.ts`: suscripciones (tabla `reminders`, una por endpoint) y la selección de vencidos; `convex/schedule.ts` calcula el próximo envío con la zona horaria del dispositivo.
- `convex/push.ts` + `convex/crons.ts`: cada 15 minutos envía los vencidos con `web-push` y borra las suscripciones que responden 404/410.
- Variables: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` en Vercel; `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` (`mailto:` o URL) en Convex. Para generar un par: `npx web-push generate-vapid-keys`.

El original del ícono y su prompt están en `assets/brand`. Para regenerar sus tamaños: `node assets/brand/build-icons.cjs` después de instalar dependencias.

## App nativa (Expo)

`apps/mobile`: Expo SDK 58 + expo-router para Google Play y App Store. Usa `@cranea/core`, el mismo Convex y la misma cuenta de Clerk; el progreso tiene el mismo formato que la web y se sincroniza igual. Cifra y Palabra ya se juegan; los otros tres muestran «Muy pronto». `pnpm mobile` la arranca. Pasos para publicar, variables y monetización en [docs/mobile.md](docs/mobile.md).
