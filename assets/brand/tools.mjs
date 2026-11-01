// Carga resvg (SVG → PNG) y las fuentes de la app sin tocar el lockfile del monorepo:
// resvg se instala una sola vez en una carpeta temporal; las fuentes salen de apps/mobile/node_modules.
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const RESVG = "@resvg/resvg-js@2.6.2";

export function loadResvg() {
  const dir = join(tmpdir(), "cranea-brand-tools");
  const req = createRequire(join(dir, "package.json"));
  try {
    return req("@resvg/resvg-js");
  } catch {
    mkdirSync(dir, { recursive: true });
    if (!existsSync(join(dir, "package.json"))) writeFileSync(join(dir, "package.json"), '{"private":true}');
    console.log(`Instalando ${RESVG} en ${dir}…`);
    execSync(`npm install --no-audit --no-fund ${RESVG}`, { cwd: dir, stdio: "inherit" });
    return req("@resvg/resvg-js");
  }
}

const fontDir = (pkg, weight, file) =>
  join(ROOT, "apps/mobile/node_modules/@expo-google-fonts", pkg, weight, file);

export const FONT_FILES = [
  fontDir("bricolage-grotesque", "700Bold", "BricolageGrotesque_700Bold.ttf"),
  fontDir("bricolage-grotesque", "800ExtraBold", "BricolageGrotesque_800ExtraBold.ttf"),
  fontDir("atkinson-hyperlegible", "400Regular", "AtkinsonHyperlegible_400Regular.ttf"),
  fontDir("atkinson-hyperlegible", "700Bold", "AtkinsonHyperlegible_700Bold.ttf"),
];

export function makeRender() {
  for (const f of FONT_FILES) if (!existsSync(f)) throw new Error(`Falta ${f}: corré pnpm install primero.`);
  const { Resvg } = loadResvg();
  /** Rinde un SVG a PNG de `width` px y lo escribe en `out` (relativo a la raíz). */
  return (svgText, out, width) => {
    const resvg = new Resvg(svgText, {
      fitTo: width ? { mode: "width", value: width } : { mode: "original" },
      font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: "Atkinson Hyperlegible" },
      shapeRendering: 2,
      imageRendering: 0,
    });
    const png = resvg.render().asPng();
    if (!out) return png;
    const path = join(ROOT, out);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, png);
    return png;
  };
}

export function writeText(out, text) {
  const path = join(ROOT, out);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

/** .ico con varias imágenes PNG adentro (lo aceptan todos los navegadores actuales). */
export function ico(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, png }, i) => {
    const e = 6 + 16 * i;
    header[e] = size >= 256 ? 0 : size;
    header[e + 1] = size >= 256 ? 0 : size;
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(png.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.png)]);
}
