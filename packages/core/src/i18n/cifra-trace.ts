import type { TraceFacts, TraceReason, TraceStep } from "../cifra/trace";
import { list, type Locale } from "./translate";

/**
 * Explicaciones de la traza de Cifra (pistas y "¿Cómo se resolvía?") en cada idioma.
 * La gramática (plurales, concordancia, listas) es demasiado variable para un diccionario plano,
 * así que cada idioma arma sus frases acá a partir de los datos de `TraceStep`.
 */

interface Phrases {
  reason: (r: TraceReason) => string;
  facts: (f: TraceFacts) => string;
  /** reason + effect + "Con eso, …". */
  join: (reason: string, effect: string, more: string) => string;
}

function byDigit(f: TraceFacts) {
  const m = new Map<number, number[]>();
  for (const [p, d] of f.removed) m.set(d, [...(m.get(d) ?? []), p + 1]);
  return m;
}

const es: Phrases = (() => {
  const and = (xs: string[]) => list(xs, "es");
  const digits = (ds: readonly number[]) => and(ds.map((d) => `el ${d}`));
  const cifras = (n: number) => `${n} ${n === 1 ? "cifra" : "cifras"}`;
  const rowsText = (rows: number[]) => (rows.length === 1 ? `la fila ${rows[0]}` : `las filas ${and(rows.map(String))}`);
  return {
    reason: (r) => {
      switch (r.kind) {
        case "none": return `La fila ${r.row} no tiene ninguna cifra del código`;
        case "all": return `Todas las cifras de la fila ${r.row} están en el código`;
        case "noneInPlace": return `Ninguna cifra de la fila ${r.row} está en su lugar`;
        case "foundAll": return `La fila ${r.row} tiene ${cifras(r.total)} del código y ya ${r.total === 1 ? "la" : "las"} encontraste (${digits(r.digits)})`;
        case "discardedRest": return `La fila ${r.row} tiene ${cifras(r.total)} del código y ya descartaste ${digits(r.digits)}`;
        case "placedAll": {
          const placed = r.placed.map(([p, d]) => `el ${d} en el lugar ${p}`);
          return `La fila ${r.row} tiene ${cifras(r.exact)} en su lugar y ya ${placed.length === 1 ? "está ubicada" : "están ubicadas"} (${and(placed)})`;
        }
        case "onlyPlaces": return `La fila ${r.row} tiene ${cifras(r.exact)} en su lugar y ${r.exact === 1 ? "solo una puede estarlo" : `solo ${r.exact} pueden estarlo`}`;
        case "hypothesis": {
          const why = r.rows.length ? `${rowsText(r.rows)} no ${r.rows.length === 1 ? "cierra" : "cierran"}` : "no quedan lugares para todas las cifras";
          return `Si el ${r.digit} fuera en el lugar ${r.place}, ${why}`;
        }
      }
    },
    facts: (f) => {
      const parts = f.fixed.map(([p, d]) => `el ${d} va en el lugar ${p + 1}`);
      if (f.in.length) parts.push(`${digits(f.in)} ${f.in.length === 1 ? "está" : "están"} en el código`);
      if (f.out.length) parts.push(`${digits(f.out)} no ${f.out.length === 1 ? "está" : "están"}`);
      for (const [d, ps] of byDigit(f)) parts.push(`el ${d} no va en ${ps.length === 1 ? `el lugar ${ps[0]}` : `los lugares ${and(ps.map(String))}`}`);
      return parts.join("; ");
    },
    join: (reason, effect, more) => `${reason}: ${effect}.${more ? ` Con eso, ${more}.` : ""}`,
  };
})();

const en: Phrases = (() => {
  const and = (xs: string[]) => list(xs, "en");
  const digits = (ds: readonly number[]) => and(ds.map(String));
  const nDigits = (n: number) => `${n} ${n === 1 ? "digit" : "digits"}`;
  const rowsText = (rows: number[]) => (rows.length === 1 ? `row ${rows[0]}` : `rows ${and(rows.map(String))}`);
  return {
    reason: (r) => {
      switch (r.kind) {
        case "none": return `Row ${r.row} has none of the code's digits`;
        case "all": return `Every digit in row ${r.row} is in the code`;
        case "noneInPlace": return `No digit in row ${r.row} is in the right spot`;
        case "foundAll": return `Row ${r.row} has ${nDigits(r.total)} from the code and you've already found ${r.total === 1 ? "it" : "them"} (${digits(r.digits)})`;
        case "discardedRest": return `Row ${r.row} has ${nDigits(r.total)} from the code and you've already ruled out ${digits(r.digits)}`;
        case "placedAll": {
          const placed = r.placed.map(([p, d]) => `${d} in spot ${p}`);
          return `Row ${r.row} has ${nDigits(r.exact)} in the right spot and ${placed.length === 1 ? "it's" : "they're"} already placed (${and(placed)})`;
        }
        case "onlyPlaces": return `Row ${r.row} has ${nDigits(r.exact)} in the right spot and ${r.exact === 1 ? "only one can be" : `only ${r.exact} can be`}`;
        case "hypothesis": {
          const why = r.rows.length ? `${rowsText(r.rows)} wouldn't add up` : "there'd be no room for every digit";
          return `If ${r.digit} went in spot ${r.place}, ${why}`;
        }
      }
    },
    facts: (f) => {
      const parts = f.fixed.map(([p, d]) => `${d} goes in spot ${p + 1}`);
      if (f.in.length) parts.push(`${digits(f.in)} ${f.in.length === 1 ? "is" : "are"} in the code`);
      if (f.out.length) parts.push(`${digits(f.out)} ${f.out.length === 1 ? "is" : "are"} out`);
      for (const [d, ps] of byDigit(f)) parts.push(`${d} doesn't go in ${ps.length === 1 ? `spot ${ps[0]}` : `spots ${and(ps.map(String))}`}`);
      return parts.join("; ");
    },
    join: (reason, effect, more) => `${reason}: ${effect}.${more ? ` So ${more}.` : ""}`,
  };
})();

const PHRASES: Record<Locale, Phrases> = { es, en };

export interface CifraStepText {
  /** "La fila 2 no tiene ninguna cifra del código". */
  reason: string;
  /** Qué se deduce, con sus consecuencias ("…. Con eso, …"). */
  effect: string;
  /** Todo junto, como una oración. */
  text: string;
}

/** Texto de un paso de la traza en el idioma pedido. */
export function cifraStepText(step: Pick<TraceStep, "reason" | "effect" | "more">, locale: Locale): CifraStepText {
  const p = PHRASES[locale];
  const reason = p.reason(step.reason);
  const effect = p.facts(step.effect);
  const more = p.facts(step.more);
  const text = p.join(reason, effect, more);
  return { reason, effect: text.slice(reason.length + 2).replace(/\.$/, ""), text };
}
