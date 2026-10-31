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
