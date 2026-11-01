// Gráficos de Google Play a partir de capturas reales de la app (docs/store/play/raw, 1080×2280 del emulador).
// Desde la raíz del repo, después de pnpm install:
//   node assets/brand/build-store.mjs
// Escribe docs/store/play/feature-graphic.png (1024×500) y docs/store/play/screenshots/*.png (1080×1920).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { C, gridFor, mark, paper, svg } from "./brand.mjs";
import { ROOT, makeRender } from "./tools.mjs";

const render = makeRender();
const raw = (name) => `data:image/png;base64,${readFileSync(join(ROOT, "docs/store/play/raw", name)).toString("base64")}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** Teléfono: la captura con esquinas redondeadas y un borde de tinta, como las tarjetas de la app. */
function phone(x, y, w, src, { theme = "light", id = "p" } = {}) {
  const h = (w * 2280) / 1080;
  const rr = w * 0.085;
  const bw = w * 0.022;
  const frame = theme === "dark" ? "#3a3d44" : C.ink;
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rr}"/></clipPath>` +
    // sombra de ficha: el mismo borde inferior duro que usan las tarjetas
    `<rect x="${x - bw}" y="${y - bw + w * 0.03}" width="${w + 2 * bw}" height="${h + 2 * bw}" rx="${rr + bw}" fill="${frame}" opacity="0.18"/>` +
    `<rect x="${x - bw}" y="${y - bw}" width="${w + 2 * bw}" height="${h + 2 * bw}" rx="${rr + bw}" fill="${frame}"/>` +
    `<image x="${x}" y="${y}" width="${w}" height="${h}" href="${src}" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/>`;
}

// ── Capturas ────────────────────────────────────────────────────────────────────────────────
const W = 1080;
const H = 1920;
const shots = [
  { file: "inicio.png", title: "5 juegos de lógica", sub: ["Cifra, Puentes, Nonograma,", "Torres y Palabra."] },
  { file: "puentes-diario.png", title: "Un desafío por día", sub: ["El mismo tablero para todos.", "Mañana, uno nuevo."] },
  { file: "cifra.png", title: "Deducí, no adivines", sub: ["Una sola solución por tablero,", "y se llega pensando."] },
  { file: "nonograma.png", title: "Descubrí el dibujo", sub: ["Del 5×5 para arrancar", "al 15×15 para expertos."] },
  { file: "estadisticas.png", title: "Tu racha y el ranking", sub: ["Seguí tus récords y compará", "tu diario con el resto."] },
  { file: "palabra-diario.png", title: "Jugá sin conexión", sub: ["En el colectivo o en la fila:", "no hace falta internet."] },
  { file: "inicio-pizarron.png", title: "Cuaderno o pizarrón", sub: ["Tema claro y oscuro,", "con letra fácil de leer."], theme: "dark" },
];

shots.forEach((s, i) => {
  const theme = s.theme ?? "light";
  const ink = theme === "dark" ? C.chalk : C.ink;
  const soft = theme === "dark" ? "#adb1ba" : C.pencil;
  const pw = 780;
  const px = (W - pw) / 2;
  const py = 520;
  const body =
    paper(W, H, { theme, step: 60, cx: W / 2, marginX: 54, lineW: 2 }) +
    mark(W / 2 - 32, 80, 64, { theme }) +
    `<text x="${W / 2}" y="262" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="88" letter-spacing="-2" fill="${ink}">${esc(s.title)}</text>` +
    s.sub.map((line, k) => `<text x="${W / 2}" y="${336 + k * 52}" text-anchor="middle" font-family="Atkinson Hyperlegible" font-size="40" fill="${soft}">${esc(line)}</text>`).join("") +
    phone(px, py, pw, raw(s.file), { theme, id: `p${i}` });
  const name = `${String(i + 1).padStart(2, "0")}-${s.file.replace(".png", "")}.png`;
  render(svg(W, H, body), `docs/store/play/screenshots/${name}`, W);
});

// ── Gráfico destacado (1024×500) ────────────────────────────────────────────────────────────
// Google recorta y superpone botones en algunos lugares: lo importante queda en el centro y a la izquierda.
{
  const FW = 1024;
  const FH = 500;
  const m = 150;
  const body =
    paper(FW, FH, { step: gridFor(m), cx: 92 + m / 2, cy: 110 + m / 2, marginX: 46, lineW: 1.5 }) +
    mark(92, 110, m) +
    `<text x="270" y="215" font-family="Bricolage Grotesque" font-weight="800" font-size="104" letter-spacing="-3" fill="${C.ink}">Craneá</text>` +
    `<text x="274" y="272" font-family="Atkinson Hyperlegible" font-weight="700" font-size="34" fill="${C.ink}">5 juegos de lógica.</text>` +
    `<text x="274" y="316" font-family="Atkinson Hyperlegible" font-size="34" fill="${C.pencil}">Un desafío nuevo por día.</text>` +
    `<g transform="rotate(-7 840 300)">${phone(735, 60, 230, raw("cifra.png"), { id: "fg" })}</g>`;
  render(svg(FW, FH, body), "docs/store/play/feature-graphic.png", FW);
}

console.log("Gráficos de Play generados.");

// ── Hoja de contacto para revisar todas las capturas juntas ─────────────────────────────────
{
  const w = 360;
  const h = 640;
  const files = shots.map((s, i) => `${String(i + 1).padStart(2, "0")}-${s.file}`);
  const body = files.map((f, i) => {
    const src = `data:image/png;base64,${readFileSync(join(ROOT, "docs/store/play/screenshots", f)).toString("base64")}`;
    return `<image x="${(i % 4) * (w + 12)}" y="${Math.floor(i / 4) * (h + 12)}" width="${w}" height="${h}" href="${src}"/>`;
  }).join("");
  const SW = 4 * (w + 12);
  const SH = Math.ceil(files.length / 4) * (h + 12);
  render(svg(SW, SH, `<rect width="${SW}" height="${SH}" fill="#8a94a6"/>${body}`), "docs/store/play/preview-screenshots.png", SW);
}
