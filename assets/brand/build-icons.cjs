// Run from the repository root after pnpm install.
const { createRequire } = require("node:module");
const { resolve } = require("node:path");
const { writeFile } = require("node:fs/promises");
const { realpathSync } = require("node:fs");
const sharp = createRequire(realpathSync(resolve("apps/web/node_modules/next/package.json")))("sharp");
(async () => {
  const source = resolve("assets/brand/cranea-icon-source.png");
  for (const [file, size] of [["icons/icon-192.png", 192], ["icons/icon-512.png", 512], ["icons/maskable-512.png", 512], ["apple-touch-icon.png", 180]]) {
    await sharp(source).resize(size, size).png().toFile(resolve("apps/web/public", file));
  }
  const png = await sharp(source).resize(32, 32).png().toBuffer();
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  header[6] = 32; header[7] = 32;
  header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18);
  await writeFile("apps/web/public/favicon.ico", Buffer.concat([header, png]));
  console.log("Íconos generados.");
})();
