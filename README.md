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
- **Diario**: se genera en el cliente con la fecha UTC como semilla; todos ven el mismo tablero.
- **Marcas manuales** (`marks.ts`): `emptyMarks()`, `nextMark(marks, row, position)` y `tileMarkState(marks, row, position)` son funciones puras compartidas con Expo. Filas y columnas empiezan en cero; los intentos fallidos se agregan después de las pistas. Cada casilla cicla descartada → va → va ahí → sin marcar de forma independiente, sin cambiar otras apariciones de la misma cifra ni el teclado. Estas notas no deducen ni completan nada automáticamente. En web se reinician con cada partida y no forman parte de `cranea-progress`.

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
