# Movimiento en Craneá

Un solo sistema de animación para la web y la app. Las animaciones acompañan (confirman un toque,
muestran qué cambió, festejan un poco) y nunca hacen esperar: cortas, sin rebotes y siempre las mismas
para el mismo gesto.

- **Números**: `packages/core/src/motion.ts` (`DURATION`, `EASING`, `MOTION`, `STAGGER`, `staggerStep`…).
  Los importan las dos apps.
- **App**: `apps/mobile/src/lib/motion.tsx`: presets de Reanimated (`motion.appear()`, `motion.pop()`…),
  `timing()`, `hop()`, `pulse()`, `shake()`, `useShake()`, `useMotionReduced()`, `<MotionPreference />`.
- **Web**: variables CSS y clases `anim-*` en `apps/web/src/app/globals.css`; ayudas en
  `apps/web/src/lib/motion.ts` (`revealStep`, `celebrateStep`, `popStep`, `play`, `SHAKE`).
- **Test**: `packages/core/src/motion.test.ts` comprueba que globals.css repita los mismos números
  y que ninguna secuencia pase de 600 ms.

## Reglas

1. Solo los tokens de abajo. Nada de duraciones, curvas, resortes ni presets sueltos en un componente
   (en la app, nada de `FadeIn`, `ZoomIn`, `withSpring`… directo de Reanimated; en la web, nada de
   `duration-300`, `animate-in`, `ease-in-out`…).
2. Sin rebote. No hay resortes; si alguna vez hiciera falta uno, críticamente amortiguado.
3. Entrar o responder: `ease-out`. Salir: `ease-in`, más corto.
4. Solo `transform` y `opacity` (la excepción es el color al dar vuelta una ficha).
5. Secuencias (filas, olas de festejo) ≤ 600 ms en total, sin importar el tamaño del tablero.
6. Nada queda moviéndose: lo único que se repite son los esqueletos de carga y el resaltado del tutorial.
7. Movimiento reducido (el del sistema **o** «Animaciones: Reducidas» en Ajustes): todo aparece en su
   estado final, sin moverse. Los cambios de color y los fundidos de pantalla pueden quedar.

## Tokens

| Token | Valor | Web | App |
| --- | --- | --- | --- |
| `fast` | 120 ms | `--dur-fast` | `DURATION.fast`, `timing("fast")` |
| `base` | 200 ms | `--dur-base` | `DURATION.base`, `timing("base")` |
| `slow` | 280 ms | `--dur-slow` | `DURATION.slow`, `timing("slow")` |
| `ease-out` (entrar, responder) | `cubic-bezier(0.33, 1, 0.68, 1)` (ease-out cúbica) | `--ease-out` | `ease.out` = `Easing.out(Easing.cubic)` |
| `ease-in` (salir) | `cubic-bezier(0.32, 0, 0.67, 0)` (ease-in cúbica) | `--ease-in` | `ease.in` = `Easing.in(Easing.cubic)` |
| `rise` | 8 px / dp | `--rise` | `MOTION.rise` |
| `stagger` | paso ≤ 60 ms, secuencia ≤ 600 ms | `--step` (de `revealStep`, `celebrateStep`, `popStep`) | `staggerStep()`, `celebrateStep()` |
| `hop` (festejo) | 320 ms = `fast` sube + `base` baja | `--dur-hop` | `HOP_MS`, `hop()`, `pulse()` |
| `shake` | 280 ms | `--dur-shake` | `shake()`, `useShake()` |
| `loop` | 1600 ms (solo carga y tutorial) | `--dur-loop` | — |
| Resultado | 800 ms después de ganar, 350 ms después de perder | `WIN_RESULT_MS`, `LOSS_RESULT_MS` | ídem |

Las transiciones de la web (hover, colores, press) usan `fast` por defecto
(`--default-transition-duration`); los cambios de color más visibles, `duration-(--dur-base)` o `duration-(--dur-slow)`.

## Catálogo

| Movimiento | Qué hace | Duración | Cuándo | Web | App |
| --- | --- | --- | --- | --- | --- |
| `appear` | fundido + sube 8 | `base` | pantallas, tarjetas, avisos, paneles que entran | `anim-appear` | `motion.appear(delay)` |
| `fade` | solo fundido | `base` | fondos de hojas, textos que cambian en el mismo lugar | `anim-fade` | `motion.fade()` |
| `exit` | fundido de salida | `fast`, `ease-in` | avisos que se van | `anim-fade-out` | `motion.exit()` |
| `pop` | 0,9 → 1 + fundido | `fast` | lo que se tipea o se coloca: cifras, letras, alturas, cruces | `anim-pop` | `motion.pop(delay)` |
| `press` | escala 0,96 mientras se aprieta | `fast` | teclas y fichas (los botones con sombra se hunden en su sombra) | `active:scale-96` | `PRESS_SCALE` |
| `reveal` | la ficha entra dada vuelta (rotateX), escalonada | `base` c/u, fila ≤ 600 ms | fila recién puntuada de Cifra, fila de Palabra (que además cambia de color a mitad del giro) | `anim-reveal`, `anim-flip` + `revealStep(n)` | `motion.reveal(i * staggerStep(n))` |
| `celebrate` | una sola ola de saltos (`hop`, 20 % del lado) o latidos (`pulse` 1,08; en Nonograma `dip` 0,85) | 320 ms c/u, ola ≤ 600 ms | al ganar, una vez; después todo queda quieto | `anim-hop`, `anim-pulse`, `anim-dip` + `celebrateStep(span)`; `anim-speck` (salpicadura, web) | `hop()`, `pulse()` + `celebrateStep(span)` |
| `confirm` | latido 1 → 1,08 → 1; anillo; pasada de color | 320 ms / `slow` | algo quedó bien: marca «va ahí», pista de Torres cumplida, isla completa, línea de Nonograma | `anim-bump`, `anim-ring-out`, `anim-sweep` | `pulse(0)`, `withTiming(…, timing("slow"))` |
| `sheet` | sube desde abajo 100 % → 0, sin pasarse; el fondo, `fade` | entra `slow`, sale `base` `ease-in` | hojas de resultado, Ajustes (web, celular), protector, Plus | `anim-sheet-in` / `anim-sheet-out` | `motion.sheetIn()` / `motion.sheetOut()` |
| `dialog` | fundido + 0,96 → 1 + sube 8 | entra `base`, sale `fast` `ease-in` | diálogos centrados (escritorio), avisos de logros | `anim-dialog-in` / `anim-dialog-out` | `motion.dialog()` |
| `shake` | ±6, ±4 px (chica: ±3, ±2) | 280 ms | error: código/palabra inválida, revisar con errores, pista de Torres que no se cumple, puente bloqueado | `anim-shake`, `anim-shake-sm`, `play(ref, SHAKE)` | `useShake(key)`, `shake(small)` |
| `stamp` | 0,6 → 1 + fundido desde 0,4 | `fast` | casilla que se pinta en Nonograma | `anim-stamp` | `motion.stamp(delay)` |
| `draw` | trazo que se dibuja | `base` | puente que se tiende, cruz, tachado de una casilla equivocada | `anim-draw`, `anim-draw-x`, `anim-split` | `motion.draw()`, `withTiming(…, timing("base"))` |

Movimientos de cámara (acercar/alejar en Nonograma 15×15) usan `slow`; volver al encuadre al soltar, `base`.
La navegación entre pantallas de la app es la nativa (`slide_from_right`); con movimiento reducido, un fundido.

## Por juego

| Juego | Tipear / colocar | Error | Revelar | Ganar |
| --- | --- | --- | --- | --- |
| Cifra | `pop` cada cifra | `shake` del código | `reveal` de la fila puntuada y `pop` del puntaje | `hop` de las cifras |
| Palabra | `pop` cada letra | `shake` de la fila | `reveal`/`flip` de la fila | `hop` letra por letra justo después del giro |
| Torres | `pop` cada altura | `shake` del tablero; `shake` chica en la pista | — | `hop` en ola diagonal |
| Puentes | `draw` del puente | `shake` del tablero; `shake` chica si se cruza | — | `pulse` en ola diagonal |
| Nonograma | `stamp` / `pop` de la cruz | `shake` del tablero | el dibujo aparece en diagonal al perder | `dip` en ola diagonal |

## Movimiento reducido

- **App**: Reanimated respeta solo el del sistema (todas las animaciones usan `ReduceMotion.System`).
  «Animaciones: Reducidas» monta `<ReducedMotionConfig mode={ReduceMotion.Always} />`
  (`<MotionPreference />` en `_layout.tsx`), que hace lo mismo para todas. Lo que se decide en
  JavaScript (no animar una casilla, esperar antes del resultado) usa `useMotionReduced()`, que junta
  las dos cosas; `useSettled` espera 0 ms.
- **Web**: `prefers-reduced-motion` o `html[data-motion="reduced"]` dejan cada animación y transición
  en su estado final (`@layer base` en globals.css); `prefersReducedMotion()` para lo que corre en JS.
