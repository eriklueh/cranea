import { coreMessages, type Shape } from "@cranea/core/i18n";
import * as cifra from "./messages/cifra";
import * as hub from "./messages/hub";
import * as legal from "./messages/legal";
import * as nonograma from "./messages/nonograma";
import * as palabra from "./messages/palabra";
import * as plus from "./messages/plus";
import * as puentes from "./messages/puentes";
import * as share from "./messages/share";
import * as shell from "./messages/shell";
import * as stats from "./messages/stats";
import * as torres from "./messages/torres";
import * as tutorialUi from "./messages/tutorialUi";

/**
 * Diccionario de la web: los espacios compartidos de `@cranea/core/i18n` más los propios.
 * Para sumar textos: agregalos al archivo de su espacio en `messages/`, en español y en inglés
 * (TypeScript avisa si falta una clave en inglés). Ver docs/i18n.md.
 */
const es = {
  ...coreMessages.es,
  shell: shell.es,
  hub: hub.es,
  plus: plus.es,
  legal: legal.es,
  stats: stats.es,
  share: share.es,
  cifra: cifra.es,
  puentes: puentes.es,
  torres: torres.es,
  palabra: palabra.es,
  nonograma: nonograma.es,
  tutorialUi: tutorialUi.es,
};

const en: Shape<typeof es> = {
  ...coreMessages.en,
  shell: shell.en,
  hub: hub.en,
  plus: plus.en,
  legal: legal.en,
  stats: stats.en,
  share: share.en,
  cifra: cifra.en,
  puentes: puentes.en,
  torres: torres.en,
  palabra: palabra.en,
  nonograma: nonograma.en,
  tutorialUi: tutorialUi.en,
};

export type WebMessages = typeof es;
export const messages = { es, en };
