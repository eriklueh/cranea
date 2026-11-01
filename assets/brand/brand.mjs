// Geometría y colores de la marca Craneá. Todo sale de acá: los SVG maestros, los íconos y el splash.
// La marca: una "C" de 7 fichas sobre una cuadrícula de 3×3, como un nonograma resuelto, y en el centro
// una ficha amarilla de pista: la casilla que estás deduciendo (el "craneo" de Craneá). Fondo: hoja de cuaderno
// cuadriculada con margen rojo (claro) o pizarrón (oscuro).

export const C = {
  paper: "#f6f8fb",
  grid: "#dbe5f1",
  ink: "#1c2b4b",
  inkEdge: "#0f1a33",
  margin: "#d2453d",
  clue: "#f5c518",
  clueEdge: "#b8900a",
  board: "#202124",
  boardGrid: "#2d2f33",
  chalk: "#eceef2",
  chalkEdge: "#b9bdc6",
  okDark: "#8bd6a7",
  clueDark: "#f2d66c",
  clueDarkEdge: "#b89d3c",
  pencil: "#6f7a8f",
};

const r = (n) => Math.round(n * 100) / 100;

/** Rectángulo con radio propio por esquina: [arriba-izq, arriba-der, abajo-der, abajo-izq]. */
function roundedRect(x, y, w, h, [tl, tr, br, bl]) {
  return [
    `M${r(x + tl)},${r(y)}`,
    `H${r(x + w - tr)}`, tr ? `A${r(tr)},${r(tr)} 0 0 1 ${r(x + w)},${r(y + tr)}` : "",
    `V${r(y + h - br)}`, br ? `A${r(br)},${r(br)} 0 0 1 ${r(x + w - br)},${r(y + h)}` : "",
    `H${r(x + bl)}`, bl ? `A${r(bl)},${r(bl)} 0 0 1 ${r(x)},${r(y + h - bl)}` : "",
    `V${r(y + tl)}`, tl ? `A${r(tl)},${r(tl)} 0 0 1 ${r(x + tl)},${r(y)}` : "",
    "Z",
  ].join("");
}

/**
 * La marca dentro de un cuadrado de lado `size` con esquina en (x, y).
 * theme: "light" (tinta sobre papel) | "dark" (tiza sobre pizarrón) | "mono" (silueta para íconos temáticos).
 * depth: borde inferior más oscuro, como las fichas de la app (se apaga en tamaños chicos).
 */
export function mark(x, y, size, { theme = "light", depth = true } = {}) {
  const gap = size / 17; // celda + junta = 3 cuadritos de la hoja (ver gridFor)
  const cell = (size - 2 * gap) / 3;
  const small = cell * 0.16;
  const big = cell * 0.62; // esquinas izquierdas redondas: se lee "C", no "O"
  const fill = theme === "dark" ? C.chalk : theme === "mono" ? "#ffffff" : C.ink;
  const edge = theme === "dark" ? C.chalkEdge : C.inkEdge;
  const accent = theme === "dark" ? C.clueDark : C.clue;
  const accentEdge = theme === "dark" ? C.clueDarkEdge : C.clueEdge;
  const at = (col, row) => [x + col * (cell + gap), y + row * (cell + gap)];
  const tiles = [
    [0, 0, [big, small, small, small]],
    [1, 0, [small, small, small, small]],
    [2, 0, [small, small, small, small]],
    [0, 1, [small, small, small, small]],
    [0, 2, [small, small, small, big]],
    [1, 2, [small, small, small, small]],
    [2, 2, [small, small, small, small]],
  ];
  const lip = depth && theme !== "mono" ? cell * 0.09 : 0;
  const tile = (col, row, radii, f, e, k = 1) => {
    const [cx, cy] = at(col, row);
    const w = cell * k;
    const tx = cx + (cell - w) / 2;
    const ty = cy + (cell - w) / 2;
    const l = lip * k;
    if (!l) return `<path d="${roundedRect(tx, ty, w, w, radii)}" fill="${f}"/>`;
    // borde inferior: la ficha completa en el color oscuro y encima la cara, un poco más corta
    return `<path d="${roundedRect(tx, ty, w, w, radii)}" fill="${e}"/>` +
      `<path d="${roundedRect(tx, ty, w, w - l, radii)}" fill="${f}"/>`;
  };
  let out = tiles.map(([c, rw, radii]) => tile(c, rw, radii, fill, edge)).join("");
  // la ficha de pista, más chica que las otras para que no se lea como el brazo de una "E"
  const k = 0.7;
  const pr = cell * k * 0.24;
  out += tile(1, 1, [pr, pr, pr, pr], theme === "mono" ? "#ffffff" : accent, accentEdge, k);
  return out;
}

/** Hoja cuadriculada con margen rojo (o pizarrón con cuadrícula de tiza) en w×h. */
export function paper(w, h, { theme = "light", step, marginX, lineW, cx = w / 2, cy = h / 2 } = {}) {
  step ??= Math.min(w, h) / 16;
  lineW ??= Math.max(1, step / 22);
  // las líneas pasan por cx ± step/2, así una marca centrada en (cx, cy) tiene las juntas sobre la cuadrícula
  const first = (c) => ((c + step / 2) % step + step) % step;
  const bg = theme === "dark" ? C.board : C.paper;
  const line = theme === "dark" ? C.boardGrid : C.grid;
  let lines = "";
  for (let gx = first(cx); gx < w; gx += step) lines += `M${r(gx)},0V${h}`;
  for (let gy = first(cy); gy < h; gy += step) lines += `M0,${r(gy)}H${w}`;
  let s = `<rect width="${w}" height="${h}" fill="${bg}"/><path d="${lines}" stroke="${line}" stroke-width="${r(lineW)}" fill="none"/>`;
  if (marginX != null && theme !== "dark") {
    s += `<rect x="${r(marginX - lineW * 1.6)}" y="0" width="${r(lineW * 3.2)}" height="${h}" fill="${C.margin}" opacity="0.85"/>`;
  }
  return s;
}

export const svg = (w, h, body, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>\n`;

/** Ícono maestro (iOS / Play / PWA): papel a sangre, marca de 8,5 cuadritos de 16. */
/** Paso de la cuadrícula que corresponde a una marca de lado m. */
export const gridFor = (m) => (m * 2) / 17;

export function iconSvg(size = 1024, { theme = "light", markScale = 8.5 / 16, rounded = 0 } = {}) {
  const m = size * markScale;
  const off = (size - m) / 2;
  const nudge = size * 0.022; // corrección óptica: la C pesa a la izquierda
  const body = paper(size, size, { theme, step: gridFor(m), marginX: size * 0.135, cx: size / 2 + nudge }) +
    mark(off + nudge, off, m, { theme });
  if (!rounded) return svg(size, size, body);
  const rr = size * rounded;
  return svg(size, size, `<g clip-path="url(#c)">${body}</g>`,
    `<clipPath id="c"><rect width="${size}" height="${size}" rx="${rr}"/></clipPath>`);
}

/** Favicon: sin cuadrícula ni margen (a 16 px son ruido), solo papel redondeado y marca grande. */
export function faviconSvg(size) {
  const m = size * 0.8;
  const off = (size - m) / 2;
  return svg(size, size,
    `<rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${C.paper}"/>` +
    mark(off, off, m, { depth: size >= 64 }));
}
