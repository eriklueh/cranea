import type { NamespaceShape } from "@cranea/core/i18n";

/** Compartir: botones, avisos y etiquetas de la imagen (las mismas claves que la web donde coinciden). */
export const es = {
  shareResult: "Compartir resultado",
  text: "Texto",
  textOnly: "Compartir solo el texto",
  textCopied: "El texto quedó copiado: pegalo junto a la imagen.",
  dailyLabel: "Diario #{n}",
  levelLabel: "Nivel {world}-{level}",
};

export const en: NamespaceShape<typeof es> = {
  shareResult: "Share result",
  text: "Text",
  textOnly: "Share text only",
  textCopied: "The text was copied: paste it along with the image.",
  dailyLabel: "Daily #{n}",
  levelLabel: "Level {world}-{level}",
};
