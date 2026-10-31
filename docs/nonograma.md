# Nonograma

Pintar casillas siguiendo las pistas de filas y columnas hasta que aparece un dibujo. Ruta `/nonograma`, `gameId` `"nonograma"`.

## Motor (`packages/core/src/nonograma`)

- `solver.ts`: solver **de líneas**. Para cada fila o columna calcula, con todo lo ya marcado, qué casillas quedan forzadas en todas las ubicaciones posibles de los tramos (programación dinámica). Repite hasta que nada cambia. Nunca supone: si llega a llenar el tablero, la solución es única, porque cada paso es una deducción válida.
- `count.ts`: contador **independiente** de soluciones (prueba filas enteras y poda por columnas). Lo usan los tests y el script de niveles para confirmar la unicidad sin depender del solver.
- `pictures.ts`: 53 dibujos hechos a mano con título: 18 de 5×5, 20 de 10×10 y 15 de 15×15. `scripts/check-pictures.ts` dice cuáles no salen por lógica de líneas y sugiere qué casilla cambiar (herramienta de autor).
- `levels.ts`: mundos, `orderWorld` (ordena por dificultad), `pack`/`unpack` y el diario.
- `generator.ts`: el diario es un 10×10 con manchas (ruido con semilla `nonograma:daily:YYYY-MM-DD` y un suavizado por mayoría). Se prueban semillas derivadas hasta que el tablero sale por lógica de líneas y no tiene filas ni columnas vacías o llenas.
- `board.ts`: lógica pura del tablero del jugador (trazos, líneas completas, victoria, errores), reutilizable en Expo.

Dificultad: `round(10 · líneas útiles / (ancho + alto)) + 3 · pasadas`. Las pasadas cuentan cuántas vueltas por filas y columnas necesita el solver; las líneas útiles, cuántas aportaron algo nuevo.

`pnpm --filter @cranea/core levels:nonograma` regenera `levels/nonograma.json` (determinístico). Los tests verifican que el JSON coincide con lo que genera el script, que cada nivel es único (contador independiente) y deducible por líneas, que la dificultad no baja dentro de un mundo, y lo mismo para 60 diarios repartidos en un año.

## Mundos

| Mundo | Tamaño | Dibujos | Se abre con |
| --- | --- | --- | --- |
| 1 Cinco por cinco | 5×5 | 18 | — |
| 2 Diez por diez | 10×10 | 20 | 8 dibujos del mundo 1 |
| 3 Quince por quince | 15×15 | 15 | 8 dibujos del mundo 2 |

## Errores e intentos

Se eligió **revisar al final** en vez de castigar cada toque al momento. En el celular, arrastrar con el dedo se pasa de casilla con facilidad; con vidas, un resbalón costaría una vida. Así, se puede corregir y deshacer libremente:

- El tablero se completa solo cuando lo pintado coincide con el dibujo. Las cruces son notas y no cuentan. Como la solución es única, coincidir con todas las pistas es lo mismo que coincidir con el dibujo.
- **Revisar** marca en rojo las casillas pintadas de más y las cruces puestas donde va pintura. Hay dos revisiones por partida.
- **Intentos = 1 + revisiones usadas** (1 a 3, la misma escala que Cifra: el mapa muestra `4 − intentos` puntos).
- **Me rindo** (con confirmación) muestra la solución y guarda una derrota con `attempts = 3`.

El resultado se guarda con `useProgress().recordLevel("nonograma", "w{mundo}-l{nivel}", …)` o `recordDaily("nonograma", fecha, …)`, con `{ won, attempts, timeMs, at }`.

## Diario

Mismo tablero para todos según la fecha UTC; se genera en el cliente y funciona sin conexión. Se juega una vez: si al entrar ya hay resultado de hoy, se muestra el dibujo y el resultado en vez del tablero. El número cuenta desde el 31/10/2026.

## Interacción

- Herramienta **Pintar** o **Cruz**. Tocar una casilla la marca; arrastrar marca en línea recta por la fila o la columna de la primera casilla (el eje con más recorrido).
- La primera casilla decide el trazo: si ya tiene lo que pone la herramienta, el trazo borra; si no, lo pone. Solo cambian casillas que estaban igual que la primera.
- Las pistas de una línea se apagan cuando lo pintado coincide con ellas. La fila y la columna de la casilla actual se resaltan.
- **Deshacer** vuelve un trazo; **Borrar todo** también se puede deshacer.
- Teclado: flechas, Espacio/Enter para la herramienta, X para cruzar, C para cambiar de herramienta, U o Ctrl+Z para deshacer. Mantener la tecla y moverse marca un tramo. Clic derecho cruza.
- En 15×15 el tablero ocupa todo el ancho del teléfono (casillas de ~18 px en 360 px); arrastrar compensa que no lleguen a 44 px.
