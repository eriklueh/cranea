import type { NamespaceShape } from "@cranea/core/i18n";

/**
 * Lo que rodea a los textos legales. El texto completo vive en cada página: /privacidad y /terminos
 * en español, /privacy y /terms en inglés (se prerenderizan fijas, sin depender del idioma activo).
 */
export const es = {
  updated: "Última actualización: {date}",
  updatedDate: "1 de noviembre de 2026",
  otherLanguage: "English version",
  privacyTitle: "Política de privacidad",
  termsTitle: "Términos y condiciones",
};

export const en: NamespaceShape<typeof es> = {
  updated: "Last updated: {date}",
  updatedDate: "November 1, 2026",
  otherLanguage: "Versión en español",
  privacyTitle: "Privacy policy",
  termsTitle: "Terms and conditions",
};
