import type { NamespaceShape } from "@cranea/core/i18n";

/** Acceso al tutorial desde «Cómo se juega» (components/tutorial/try-tutorial.tsx). El globo usa `tutorial.*` de core. */
export const es = {
  tryTitle: "Probá el tutorial",
  tryBody: "Un tablero chiquito, paso a paso. Menos de un minuto.",
};

export const en: NamespaceShape<typeof es> = {
  tryTitle: "Try the tutorial",
  tryBody: "A tiny board, step by step. Under a minute.",
};
