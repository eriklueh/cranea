# Craneá

Plataforma de juegos de lógica. Primer juego: **Cifra**, descubrir un código secreto cruzando pistas ya puntuadas.

```
cranea/
├─ packages/core      Lógica pura en TypeScript (sin React). La comparten web y la futura app Expo.
│  ├─ src/cifra       Puntaje, solver "humano", generador con semilla, mundos
│  ├─ scripts/        build-levels.ts → pregenera los niveles
│  └─ levels/         cifra.json (120 niveles fijos)
└─ apps/web           Next.js 16 + Tailwind 4 + shadcn/ui + Zustand
   ├─ src/app         Rutas: /, /cifra, /cifra/nivel/[mundo]/[nivel], /cifra/diario, /cifra/como-jugar
   ├─ src/games       Un directorio por juego + registry.ts
   └─ src/stores      progress.ts: progreso de todos los juegos (localStorage)
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
- **Niveles**: los 4 mundos están en `levels.ts`. Se empieza en cuatro cifras; conservan los IDs 2–5 para mantener rutas y progreso existentes. Se pregeneran a JSON para que no cambien si tocás el generador.
  `pnpm levels` genera 90 candidatos determinísticos por mundo, elige 30 minimizando los saltos de dificultad al cuadrado y los ordena de menor a mayor. El campo `d` guarda `steps + 3 * tier2Uses + 8 * tier3Uses + filas`, calculado sobre el orden final de las pistas. Los usos cuentan pasadas productivas sobre el estado real del solver, sin contar pruebas hipotéticas ni validaciones finales.
  Después de minimizar, se permiten como máximo una fila en cero y `maxDirectEliminations` cifras descartadas por esas filas; siempre deben quedar más cifras posibles que lugares en el código. En cuatro o cinco cifras se exige presencia de ambos tipos de puntaje. La relajación de técnica nunca relaja estas reglas de balance.
  Todas las cifras de la solución deben aparecer en las pistas finales. Se valida después de minimizar, también en el diario y cuando se relaja el mínimo de técnica: una solución única por descarte no alcanza para aceptar un tablero.

  `pnpm --filter @cranea/core audit:levels` comprueba los 120 niveles y 366 diarios desde el 22/10/2026. Enumera independientemente todas las combinaciones, recalcula los puntajes y verifica unicidad, resolución, cobertura de cifras y balance. Los informes antes/después de agregar la cobertura están en `docs/audits`.
- **Diario**: se genera en el cliente con la fecha UTC como semilla; todos ven el mismo tablero.
- **Marcas manuales** (`marks.ts`): `emptyMarks()`, `nextMark(marks, row, position)` y `tileMarkState(marks, row, position)` son funciones puras compartidas con Expo. Filas y columnas empiezan en cero; los intentos fallidos se agregan después de las pistas. Cada casilla cicla descartada → va → va ahí → sin marcar de forma independiente, sin cambiar otras apariciones de la misma cifra ni el teclado. Estas notas no deducen ni completan nada automáticamente. En web se reinician con cada partida y no forman parte de `cranea-progress`.
- **Lápiz**: permite dibujar sobre el juego con mouse, dedo o stylus, con espacio libre arriba y abajo y márgenes amplios en escritorio. Mientras está activo, el tablero no recibe toques ni entradas de código. La mano permite desplazar la página sin dibujar; las herramientas permanecen visibles. **Listo** o Escape vuelve al juego conservando el dibujo; también se puede deshacer el último trazo o borrar todo. Los trazos se adaptan al tema, permanecen al agregar intentos y se limpian al reiniciar o cambiar de nivel. Son notas locales de la partida y no se guardan en `cranea-progress`.

## Cómo funciona Palabra

Palabra oculta de cinco letras (`/palabra`). El tablero trae palabras ya puntuadas como en Wordle (verde: en su lugar; amarilla: en otro lugar; gris: no está, o no hay más de esa letra) y hay tres intentos.

- **Listas** (`packages/core/src/palabra/words.ts`): escritas a mano para el proyecto, sin datasets externos. ~900 respuestas (sustantivos, adjetivos y verbos en infinitivo comunes, sin plurales ni palabras ofensivas o de doble sentido rioplatense) y ~2150 palabras válidas para probar (respuestas + plurales, femeninos, conjugaciones de verbos regulares generadas y palabras menos comunes).
- **Tildes**: todo se compara normalizado (`normalize.ts`): sin tildes ni diéresis (Á = A, Ü = U) y con la Ñ como letra propia. Las fichas muestran mayúsculas sin tilde; al terminar se muestra la respuesta con tildes.
- **Puntaje** (`score.ts`): verdes primero; cada amarilla consume una aparición todavía libre de esa letra.
- **Generador** (`generator.ts`): con una semilla elige la respuesta y suma filas (palabras de la lista de respuestas) hasta que una sola respuesta encaja, y quita las filas que sobran. Se acepta si todas las letras de la respuesta (con repeticiones) aparecen en verde o amarilla en alguna fila, si ninguna otra palabra válida encaja y si respeta el balance del mundo (filas, verdes, filas grises). Dificultad: `3·filas + 2·lugares sin verde + promedio de log2(respuestas que deja cada fila sola)`.
- **Niveles**: 4 mundos de 24 (Pistas generosas, Menos verdes, Solo amarillas, Tres filas) en `levels.ts`, pregenerados con `pnpm --filter @cranea/core levels:palabra` → `levels/palabra.json` (sin respuestas repetidas, curva de dificultad como Cifra).
- **Diario**: se genera en el cliente con la fecha UTC; se juega una vez. Cambiar la lista de respuestas cambia los diarios futuros.
- **Web**: las listas se cargan con un import dinámico solo en las páginas del juego (un chunk propio de ~7 KB gzip que el service worker guarda para jugar sin conexión). Una palabra fuera de la lista sacude la fila y no gasta intento.

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

El original del ícono y su prompt están en `assets/brand`. Para regenerar sus tamaños: `node assets/brand/build-icons.cjs` después de instalar dependencias.

## Próximo: Expo

Crear `apps/mobile` con Expo y depender de `@cranea/core`. El motor, los niveles y la lógica de progreso se reutilizan; solo se reescribe la UI con componentes nativos.
