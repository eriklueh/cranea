// Vistas previas de los widgets de los diarios para el selector de widgets de Android.
// Desde la raíz del repo, después de pnpm install:
//   node assets/brand/build-widget-preview.mjs
// Escribe apps/mobile/assets/widget-preview.png (fila, 4×1) y widget-ring-preview.png (anillo, 2×2);
// el plugin plugins/with-daily-widget.js las copia a drawable/. Mismos colores y medidas que
// apps/mobile/src/widget/daily-widget.tsx (tema claro).
import { C, svg } from "./brand.mjs";
import { makeRender, writeText } from "./tools.mjs";

const render = makeRender();
const S = 2; // px por dp

// Tokens claros de apps/mobile/src/theme/tokens.ts.
const T = { paper: C.paper, ink: C.ink, muted: "#6f7a8f", line: "#dbe5f1", tile: "#ffffff", won: "#21643d", wonBg: "#e4f3e9", lost: "#6f7a8f", pending: "#806000" };
const DISPLAY = `font-family="Bricolage Grotesque" font-weight="800"`;
const BOLD = `font-family="Atkinson Hyperlegible" font-weight="700"`;

// Llama simple (en el widget es el emoji 🔥 del sistema).
const flame = (x, y, k) =>
  `<path transform="translate(${x} ${y}) scale(${k})" d="M7 0C8 4 13 6 13 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3C6 5 5 3 7 0Z" fill="#e8572a"/>`;

// ── Fila (4×1): 1/4 y una ficha por juego. ──
{
  const W = 330 * S;
  const H = 76 * S;
  const games = [["C", "won"], ["P", "next"], ["N", "pending"], ["T", "pending"]];
  const tw = 44 * S;
  const th = 52 * S;
  const gap = 6 * S;
  const x0 = W - 10 * S - games.length * tw - (games.length - 1) * gap;
  const y0 = (H - th) / 2;
  const tiles = games
    .map(([l, s], i) => {
      const x = x0 + i * (tw + gap);
      const won = s === "won";
      const cx = x + tw / 2;
      const markY = y0 + 37 * S;
      const mark = won
        ? `<circle cx="${cx}" cy="${markY}" r="${7.5 * S}" fill="${T.won}"/><path d="M ${cx - 3.2 * S} ${markY} l ${2.2 * S} ${2.2 * S} l ${4.2 * S} ${-4.4 * S}" fill="none" stroke="${T.wonBg}" stroke-width="${1.8 * S}" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<circle cx="${cx}" cy="${markY}" r="${6.5 * S}" fill="none" stroke="${T.pending}" stroke-width="${2 * S}"/>`;
      const border = won ? "" : `stroke="${s === "next" ? T.ink : T.line}" stroke-width="${(s === "next" ? 2 : 1) * S}"`;
      return [
        `<rect x="${x}" y="${y0}" width="${tw}" height="${th}" rx="${12 * S}" fill="${won ? T.wonBg : T.tile}" ${border}/>`,
        `<text x="${cx}" y="${y0 + 23 * S}" text-anchor="middle" ${DISPLAY} font-size="${17 * S}" fill="${won ? T.won : T.ink}">${l}</text>`,
        mark,
      ].join("");
    })
    .join("");
  const body = [
    `<rect width="${W}" height="${H}" rx="${22 * S}" fill="${T.paper}"/>`,
    `<text x="${16 * S}" y="${40 * S}" ${DISPLAY} font-size="${26 * S}" fill="${T.ink}">1/4</text>`,
    flame(16 * S, 47 * S, S * 0.85),
    `<text x="${30 * S}" y="${57 * S}" ${BOLD} font-size="${11 * S}" fill="${T.muted}">8</text>`,
    tiles,
  ].join("");
  const out = svg(W, H, body);
  writeText("assets/brand/widget-preview.svg", out);
  render(out, "apps/mobile/assets/widget-preview.png", W);
  console.log("apps/mobile/assets/widget-preview.png");
}

// ── Anillo (2×2): un tramo por juego, racha y próximo juego. ──
{
  const W = 156 * S;
  const P = 14 * S;
  const ring = 80 * S;
  const sw = Math.round(ring * 0.11);
  const r = (ring - sw) / 2;
  const cx = W / 2;
  const cy = W / 2 + 2 * S;
  const st = ["won", "pending", "pending", "pending"];
  const gapDeg = (sw / r) * (180 / Math.PI) + 8;
  const pt = (deg) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  };
  const arcs = st
    .map((s, i) => {
      const from = (i * 360) / st.length + gapDeg / 2;
      const to = ((i + 1) * 360) / st.length - gapDeg / 2;
      return `<path d="M ${pt(from)} A ${r} ${r} 0 0 1 ${pt(to)}" fill="none" stroke="${s === "won" ? T.won : T.line}" stroke-width="${sw}" stroke-linecap="round"/>`;
    })
    .join("");
  const body = [
    `<rect width="${W}" height="${W}" rx="${22 * S}" fill="${T.paper}"/>`,
    `<text x="${P}" y="${P + 11 * S}" ${BOLD} font-size="${12 * S}" fill="${T.ink}">Craneá</text>`,
    flame(W - P - 26 * S, P + 1 * S, S * 0.85),
    `<text x="${W - P}" y="${P + 11 * S}" text-anchor="end" ${BOLD} font-size="${12 * S}" fill="${T.ink}">8</text>`,
    arcs,
    `<text x="${cx}" y="${cy + 8 * S}" text-anchor="middle" ${DISPLAY} font-size="${24 * S}" fill="${T.ink}">1/4</text>`,
    `<text x="${cx}" y="${W - P}" text-anchor="middle" ${BOLD} font-size="${12 * S}" fill="${T.ink}">Puentes →</text>`,
  ].join("");
  const out = svg(W, W, body);
  writeText("assets/brand/widget-ring-preview.svg", out);
  render(out, "apps/mobile/assets/widget-ring-preview.png", W);
  console.log("apps/mobile/assets/widget-ring-preview.png");
}
