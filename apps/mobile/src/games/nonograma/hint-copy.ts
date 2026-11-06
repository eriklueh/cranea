import type { LineStep, NonogramaHint } from "@cranea/core/nonograma";
import { nonogramaHintCopy, nonogramaHintExplain, nonogramaHintNudge, nonogramaHintsUsed, nonogramaTechniqueName } from "@cranea/core/i18n";
import { getLocale, type Locale } from "@/lib/i18n";

/**
 * Textos de las pistas de Nonograma en el idioma activo. Viven en @cranea/core/i18n (español e inglés)
 * y son los mismos en la web y la app. Los componentes que los muestran llaman a `useLocale()` para
 * redibujarse al cambiar de idioma.
 */
const copy = () => nonogramaHintCopy(getLocale());

export const HINT_COPY = {
  get button() { return copy().button; },
  get ask() { return copy().ask; },
  get explain() { return copy().explain; },
  get locked() { return copy().locked; },
  get lockedLabel() { return copy().lockedLabel; },
  get why() { return copy().why; },
  get close() { return copy().close; },
  get done() { return copy().done; },
  get marked() { return copy().marked; },
  get outOfFree() { return copy().outOfFree; },
};

export const hintsUsedText = (n: number, locale: Locale = getLocale()) => nonogramaHintsUsed(n, locale);
export const techniqueName = (step: LineStep) => nonogramaTechniqueName(step, getLocale());
export const hintNudge = (h: NonogramaHint) => nonogramaHintNudge(h, getLocale());
export const hintExplain = (h: NonogramaHint) => nonogramaHintExplain(h, getLocale());
