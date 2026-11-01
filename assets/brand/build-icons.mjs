// Íconos y splash de Craneá a partir de brand.mjs. Desde la raíz del repo, después de pnpm install:
//   node assets/brand/build-icons.mjs
// Escribe los SVG maestros en assets/brand/ y los PNG en apps/mobile/assets y apps/web/public.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { C, faviconSvg, gridFor, iconSvg, mark, paper, svg } from "./brand.mjs";
import { ROOT, ico, makeRender, writeText } from "./tools.mjs";

const render = makeRender();

// ── Maestros ────────────────────────────────────────────────────────────────────────────────
const icon = iconSvg(1024);
const iconDark = iconSvg(1024, { theme: "dark" });
writeText("assets/brand/icon.svg", icon);
writeText("assets/brand/icon-dark.svg", iconDark);

// ── App nativa ──────────────────────────────────────────────────────────────────────────────
render(icon, "apps/mobile/assets/icon.png", 1024); // iOS: opaco, sin transparencia
render(iconSvg(512), "docs/store/play/icon-512.png", 512); // ficha de Google Play

// Ícono adaptable de Android (108 dp → 432 px en xxxhdpi). La zona segura es el círculo central de
// 66 dp (61 %): la marca ocupa el 46 % del lado y sus esquinas caen adentro del círculo.
const A = 432;
const am = A * 0.46;
const ao = (A - am) / 2;
const adaptiveFg = svg(A, A, mark(ao, ao, am));
const adaptiveBg = svg(A, A, paper(A, A, { step: gridFor(am), marginX: A * 0.2 }));
const adaptiveMono = svg(A, A, mark(ao, ao, am, { theme: "mono" }));
writeText("assets/brand/adaptive-foreground.svg", adaptiveFg);
writeText("assets/brand/adaptive-background.svg", adaptiveBg);
writeText("assets/brand/adaptive-monochrome.svg", adaptiveMono);
render(adaptiveFg, "apps/mobile/assets/adaptive-icon.png", A);
render(adaptiveBg, "apps/mobile/assets/adaptive-icon-background.png", A);
render(adaptiveMono, "apps/mobile/assets/adaptive-icon-monochrome.png", A);

// Splash: marca + nombre, todo adentro del círculo que Android 12+ deja ver (2/3 del ícono).
const splash = (theme) => {
  const S = 1024;
  const m = S * 0.3;
  const ink = theme === "dark" ? C.chalk : C.ink;
  return svg(S, S,
    mark((S - m) / 2, S * 0.235, m, { theme }) +
    `<text x="${S / 2}" y="${S * 0.715}" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="${S * 0.115}" fill="${ink}" letter-spacing="-2">Craneá</text>`);
};
writeText("assets/brand/splash.svg", splash("light"));
writeText("assets/brand/splash-dark.svg", splash("dark"));
render(splash("light"), "apps/mobile/assets/splash-icon.png", 1024);
render(splash("dark"), "apps/mobile/assets/splash-icon-dark.png", 1024);

render(faviconSvg(48), "apps/mobile/assets/favicon.png", 48);

// ── Web / PWA ───────────────────────────────────────────────────────────────────────────────
// "any": esquinas redondeadas transparentes; "maskable": a sangre, marca adentro del 80 % central.
render(iconSvg(512, { rounded: 0.22 }), "apps/web/public/icons/icon-192.png", 192);
render(iconSvg(512, { rounded: 0.22 }), "apps/web/public/icons/icon-512.png", 512);
render(iconSvg(512, { markScale: 0.46 }), "apps/web/public/icons/maskable-512.png", 512);
render(icon, "apps/web/public/apple-touch-icon.png", 180);
const favs = [16, 32, 48].map((size) => ({ size, png: render(faviconSvg(size), null, size) }));
writeFileSync(join(ROOT, "apps/web/public/favicon.ico"), ico(favs));
writeText("assets/brand/favicon.svg", faviconSvg(64));

// ── Vistas previas (para revisar legibilidad en tamaños chicos) ─────────────────────────────
const sizes = [16, 24, 32, 48, 64, 96, 192];
let x = 24;
let body = "";
for (const s of sizes) {
  const imgs = [
    ["light", iconSvg(1024, { rounded: 0.22 })],
    ["dark", iconSvg(1024, { theme: "dark", rounded: 0.22 })],
  ];
  imgs.forEach(([, src], i) => {
    const b64 = Buffer.from(src).toString("base64");
    body += `<image x="${x}" y="${24 + i * 220}" width="${s}" height="${s}" href="data:image/svg+xml;base64,${b64}"/>`;
  });
  x += s + 24;
}
// ícono adaptable con máscara circular y monocromo temático
const circ = (src, cx, bg) => `<g><clipPath id="m${cx}"><circle cx="${cx + 48}" cy="${520 + 48}" r="48"/></clipPath>` +
  `<g clip-path="url(#m${cx})">${bg ? `<rect x="${cx}" y="520" width="96" height="96" fill="${bg}"/>` : ""}` +
  `<image x="${cx - 0}" y="520" width="96" height="96" href="data:image/svg+xml;base64,${Buffer.from(src).toString("base64")}"/></g></g>`;
body += circ(adaptiveBg, 24) + circ(adaptiveFg, 24);
body += circ(adaptiveMono, 144, "#3b4a63");
const preview = svg(x, 660, `<rect width="${x}" height="660" fill="#8a94a6"/>${body}`);
render(preview, "assets/brand/preview-sizes.png");

console.log("Íconos y splash generados.");
