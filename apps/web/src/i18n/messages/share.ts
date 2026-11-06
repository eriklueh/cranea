import type { NamespaceShape } from "@cranea/core/i18n";

/** Compartir: avisos, botones y etiquetas de las imágenes. */
export const es = {
  copied: "Copiado. Pegalo donde quieras.",
  downloaded: "Imagen descargada.",
  saved: "Imagen descargada y texto copiado.",
  failed: "No se pudo compartir.",
  imageFailed: "No se pudo armar la imagen.",
  asImage: "Compartir como imagen",
  image: "Imagen",
  shareResult: "Compartir resultado",
  dailyLabel: "Diario #{n}",
  levelLabel: "Nivel {world}-{level}",
};

export const en: NamespaceShape<typeof es> = {
  copied: "Copied. Paste it anywhere.",
  downloaded: "Image downloaded.",
  saved: "Image downloaded and text copied.",
  failed: "Couldn't share.",
  imageFailed: "Couldn't create the image.",
  asImage: "Share as image",
  image: "Image",
  shareResult: "Share result",
  dailyLabel: "Daily #{n}",
  levelLabel: "Level {world}-{level}",
};
