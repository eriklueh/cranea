// Vista previa del widget «Diarios de hoy» para el selector de widgets de Android.
// Desde la raíz del repo, después de pnpm install:
//   node assets/brand/build-widget-preview.mjs
// Escribe apps/mobile/assets/widget-preview.png (el plugin plugins/with-daily-widget.js la copia a drawable/).
// Dibuja el tamaño mediano (4×2) con los mismos colores y medidas que src/widget/daily-widget.tsx.
import { C, svg } from "./brand.mjs";
import { makeRender, writeText } from "./tools.mjs";

const render = makeRender();
const S = 2; // px por dp
const W = 320 * S;
const H = 150 * S;
const P = 16 * S;

// Tokens claros de apps/mobile/src/theme/tokens.ts.
const T = { paper: C.paper, ink: C.ink, muted: "#6f7a8f", won: "#21643d", lost: "#6f7a8f", pending: "#806000", button: C.ink };

const dot = (cx, status) => {
  const r = 8 * S;
  const cy = 75 * S;
  return status === "pending"
    ? `<circle cx="${cx}" cy="${cy}" r="${r - S}" fill="${T.paper}" stroke="${T.pending}" stroke-width="${2 * S}"/>`
    : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${status === "won" ? T.won : T.lost}"/>`;
};
const statuses = ["won", "lost", "pending", "pending", "pending"];
const dotsEnd = W - P - 8 * S;
const dots = statuses.map((s, i) => dot(dotsEnd - (statuses.length - 1 - i) * 24 * S, s)).join("");

// Llama simple (en el widget es el emoji 🔥 del sistema).
const flame = (x, y, k) =>
  `<path transform="translate(${x} ${y}) scale(${k})" d="M7 0C8 4 13 6 13 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3C6 5 5 3 7 0Z" fill="#e8572a"/>`;

const body = [
  `<rect x="0" y="0" width="${W}" height="${H}" rx="${22 * S}" fill="${T.paper}"/>`,
  `<text x="${P}" y="${P + 13 * S}" font-family="Atkinson Hyperlegible" font-weight="700" font-size="${14 * S}" fill="${T.muted}">Diarios de hoy</text>`,
  flame(W - P - 34 * S, P, S * 1.15),
  `<text x="${W - P}" y="${P + 13 * S}" text-anchor="end" font-family="Atkinson Hyperlegible" font-weight="700" font-size="${14 * S}" fill="${T.ink}">7</text>`,
  `<text x="${P}" y="${88 * S}" font-family="Bricolage Grotesque" font-weight="800" font-size="${34 * S}" fill="${T.ink}">2/5</text>`,
  dots,
  `<rect x="${P}" y="${H - P - 34 * S}" width="${W - 2 * P}" height="${34 * S}" rx="${12 * S}" fill="${T.button}"/>`,
  `<text x="${W / 2}" y="${H - P - 12 * S}" text-anchor="middle" font-family="Atkinson Hyperlegible" font-weight="700" font-size="${14 * S}" fill="#ffffff">Jugar Nonograma →</text>`,
].join("");

const preview = svg(W, H, body);
writeText("assets/brand/widget-preview.svg", preview);
render(preview, "apps/mobile/assets/widget-preview.png", W);
console.log("apps/mobile/assets/widget-preview.png");
