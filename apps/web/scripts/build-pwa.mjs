import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const buildId = (await readFile(join(root, ".next/BUILD_ID"), "utf8")).trim();
const manifest = JSON.parse(await readFile(join(root, ".next/prerender-manifest.json"), "utf8"));
const routes = Object.keys(manifest.routes).filter((route) => !route.startsWith("/_") && !route.includes("."));
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? files(join(dir, entry.name)) : join(dir, entry.name)))).flat();
}
const staticRoot = join(root, ".next/static");
const assets = (await files(staticRoot)).filter((file) => !file.endsWith(".map")).map((file) => "/_next/static/" + relative(staticRoot, file).replaceAll("\\", "/"));
const publicAssets = ["/manifest.webmanifest", "/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-512.png", "/apple-touch-icon.png", "/favicon.ico"];
const template = await readFile(join(root, "scripts/service-worker.template.js"), "utf8");
await writeFile(join(root, "public/sw.js"), template.replace("__VERSION__", JSON.stringify(buildId)).replace("__PRECACHE__", JSON.stringify([...routes, ...assets, ...publicAssets])));
console.log(`PWA: ${routes.length} páginas y ${assets.length + publicAssets.length} recursos disponibles sin conexión.`);
