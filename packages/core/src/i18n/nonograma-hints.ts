import type { BlockReach, LineKind, LineStep, NonogramaHint, Technique } from "../nonograma/trace";
import type { Locale } from "./translate";

/** Textos de las pistas de Nonograma (español e inglés), armados desde los pasos de la traza. Ver docs/i18n.md. */



const HINT_ES = {
  button: "Pista",
  ask: "Pedir una pista",
  explain: "Ver la deducción",
  locked: "Más pistas con Craneá Plus",
  lockedLabel: "Pista, más pistas con Craneá Plus",
  why: "¿Qué se deduce?",
  close: "Cerrar pista",
  done: "No queda nada seguro por deducir: ya está casi.",
  /** Para lectores de pantalla, en la línea resaltada. */
  marked: "señalada por la pista",
  outOfFree: "Ya usaste la pista gratis de este tablero.",
} as const;

const hintsUsedEs = (n: number) => (n === 1 ? "Usaste 1 pista" : `Usaste ${n} pistas`);

const lineName = (kind: LineKind, index: number) => `${kind === "row" ? "la fila" : "la columna"} ${index + 1}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** 1-based y en tramos: [2, 3, 4, 7] → "las casillas 3 a 5 y 8". */
function cells(ps: readonly number[]) {
  const sorted = [...ps].sort((a, b) => a - b);
  const runs: [number, number][] = [];
  for (const p of sorted) {
    const last = runs.at(-1);
    if (last && p === last[1] + 1) last[1] = p;
    else runs.push([p, p]);
  }
  const parts = runs.flatMap(([a, b]) => (a === b ? [`${a + 1}`] : b === a + 1 ? [`${a + 1}`, `${b + 1}`] : [`${a + 1} a ${b + 1}`]));
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} y ${parts.at(-1)}`;
  return `${sorted.length === 1 ? "la casilla" : "las casillas"} ${list}`;
}

/** "la columna 4 (contando desde arriba)": las casillas de una columna se cuentan de arriba abajo. */
const lineWithCells = (kind: LineKind, index: number) => `${lineName(kind, index)}${kind === "col" ? " (contando desde arriba)" : ""}`;

const ORDINAL = ["primer", "segundo", "tercer", "cuarto", "quinto", "sexto", "séptimo", "octavo", "noveno", "décimo"];
/** "el 4", o "el segundo tramo (3)" si hay más de un 3. */
function blockName(b: BlockReach, clue: readonly number[]) {
  const repeated = clue.filter((n) => n === b.length).length > 1;
  return repeated ? `el ${ORDINAL[b.block] ?? `${b.block + 1}.º`} tramo (${b.length})` : `el ${b.length}`;
}

/** Nombre de la técnica, para mostrar arriba de la explicación. */
function techniqueNameEs(step: LineStep): string {
  const names: Record<Technique, string> = {
    empty: "Pista en cero",
    exact: "Entra justo",
    "fill-rest": "Lo que falta",
    gap: "Hueco chico",
    overlap: "Superposición",
    edge: step.params.anchor ? "Desde el borde" : "Con lo ya marcado",
    complete: "Línea completa",
    unreachable: "Fuera de alcance",
    combined: "Todas las formas",
  };
  return names[step.technique];
}

/** Primer toque: dónde mirar, sin decir qué sale. */
function hintNudgeEs(h: NonogramaHint): string {
  if (h.kind === "done") return HINT_ES.done;
  if (h.kind === "mistake") return `Revisá ${lineName(h.line, h.index)}: hay una casilla que no va.`;
  const { step } = h;
  const what = step.cellsFilled.length ? "pintar" : "cruzar";
  return `Mirá ${lineName(step.line, step.index)}: ya se puede ${what} algo seguro.`;
}

/** Segundo toque: la deducción en palabras. */
function hintExplainEs(h: NonogramaHint): string {
  if (h.kind === "done") return HINT_ES.done;
  if (h.kind === "mistake") return `Algo de lo que marcaste en ${lineName(h.line, h.index)} no coincide con el dibujo. Revisala o deshacé hasta que cierre.`;
  const { step } = h;
  const { clue, length: n } = step.params;
  const line = lineName(step.line, step.index);
  const Line = cap(line);
  switch (step.technique) {
    case "empty":
      return `${Line} pide 0: va toda con cruz.`;
    case "exact":
      return clue.length === 1
        ? `Un ${n} en ${n} casillas: ${line} se pinta entera.`
        : `En ${line}, ${clue.join(" + ")} con un espacio entre cada tramo suman ${n}, justo lo que mide: no hay otra forma de ubicarlos.`;
    case "fill-rest": {
      const m = step.params.missing ?? step.cellsFilled.length;
      return m === 1
        ? `A ${line} le falta 1 pintada y le queda 1 casilla libre: va pintada.`
        : `A ${line} le faltan ${m} pintadas y le quedan justo ${m} casillas libres: van todas pintadas.`;
    }
    case "gap": {
      const g = step.params.gap!;
      const bounds = g.before === "edge" ? "entre el borde y una cruz" : g.after === "edge" ? "entre una cruz y el borde" : "entre dos cruces";
      const room = g.size === 1 ? "queda 1 casilla" : `quedan ${g.size} casillas`;
      return `En ${line}, ${bounds} ${room}: no entra ningún tramo (el más chico es ${g.smallest}). Va${g.size === 1 ? "" : "n"} con cruz.`;
    }
    case "overlap":
    case "edge": {
      const blocks = step.params.blocks ?? [];
      const only = blocks[0];
      if (step.technique === "overlap" && clue.length === 1 && only) {
        const k = only.cells.length;
        return `En ${line}, un ${only.length} en ${n} casillas: sea donde sea que empiece, ${k === 1 ? "la del medio siempre se pinta" : `las ${k} del medio siempre se pintan`}.`;
      }
      const sentences: string[] = [];
      let rest = blocks;
      const anchor = step.params.anchor;
      if (step.technique === "edge" && anchor) {
        const b = anchor === "start" ? blocks.find((x) => x.block === 0) : blocks.find((x) => x.block === clue.length - 1);
        if (b) {
          rest = blocks.filter((x) => x !== b);
          sentences.push(
            anchor === "start"
              ? `${Line} arranca con una pintada contra el borde: es el primer tramo, el ${b.length}, así que se pintan las ${b.length} primeras casillas.`
              : `${Line} termina con una pintada contra el borde: es el último tramo, el ${b.length}, así que se pintan las ${b.length} últimas casillas.`,
          );
        }
      }
      const reach = rest.slice(0, 2).map((b, i) => {
        const name = blockName(b, clue);
        if (b.to - b.from + 1 === b.length) return b.length === 1 ? `${name} solo entra en la casilla ${b.from + 1}` : `${name} solo entra en las casillas ${b.from + 1}${b.length === 2 ? " y " : " a "}${b.to + 1}: se pinta entero`;
        return i === 0
          ? `${name} solo entra entre las casillas ${b.from + 1} y ${b.to + 1}: lo pongas donde lo pongas, pinta ${cells(b.cells)}`
          : `${name}, entre la ${b.from + 1} y la ${b.to + 1}: pinta ${cells(b.cells)}`;
      });
      if (reach.length) {
        const where = lineWithCells(step.line, step.index);
        const lead = sentences.length ? "Además," : step.technique === "overlap" ? `En ${where}, corriendo los tramos todo a un lado y todo al otro,` : `En ${where}, con lo que ya marcaste,`;
        sentences.push(`${lead} ${reach.join(". Y ")}.`);
      }
      return sentences.join(" ");
    }
    case "complete":
      return `${Line} ya tiene todo lo que pide: el resto va con cruz.`;
    case "unreachable": {
      const one = step.cellsCrossed.length === 1;
      return `En ${lineWithCells(step.line, step.index)}, con lo que ya marcaste, ningún tramo llega a ${cells(step.cellsCrossed)}: va${one ? "" : "n"} con cruz.`;
    }
    case "combined": {
      const parts = [
        step.cellsFilled.length ? `${cells(step.cellsFilled)} ${step.cellsFilled.length === 1 ? "queda pintada" : "quedan pintadas"}` : "",
        step.cellsCrossed.length ? `${cells(step.cellsCrossed)} ${step.cellsCrossed.length === 1 ? "queda vacía" : "quedan vacías"}` : "",
      ].filter(Boolean);
      return `En ${lineWithCells(step.line, step.index)}, probá todas las formas de ubicar ${clue.join(" ")} con lo que ya marcaste: ${parts.join(", y ")} en todas.`;
    }
  }
}

const HINT_EN = {
  button: "Hint",
  ask: "Get a hint",
  explain: "See the reasoning",
  locked: "More hints with Craneá Plus",
  lockedLabel: "Hint, more hints with Craneá Plus",
  why: "Why?",
  close: "Close hint",
  done: "Nothing certain left to deduce: you're almost there.",
  marked: "pointed out by the hint",
  outOfFree: "You already used this board's free hint.",
} as const;

const hintsUsedEn = (n: number) => (n === 1 ? "You used 1 hint" : `You used ${n} hints`);

const lineNameEn = (kind: LineKind, index: number) => `${kind === "row" ? "row" : "column"} ${index + 1}`;
const capEn = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** 1-based ranges: [2, 3, 4, 7] → "cells 3–5 and 8". */
function cellsEn(ps: readonly number[]) {
  const sorted = [...ps].sort((a, b) => a - b);
  const runs: [number, number][] = [];
  for (const p of sorted) {
    const last = runs.at(-1);
    if (last && p === last[1] + 1) last[1] = p;
    else runs.push([p, p]);
  }
  const parts = runs.flatMap(([a, b]) => (a === b ? [`${a + 1}`] : b === a + 1 ? [`${a + 1}`, `${b + 1}`] : [`${a + 1}–${b + 1}`]));
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
  return `${sorted.length === 1 ? "cell" : "cells"} ${list}`;
}

const lineWithCellsEn = (kind: LineKind, index: number) => `${lineNameEn(kind, index)}${kind === "col" ? " (counting from the top)" : ""}`;

const ORDINAL_EN = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];
function blockNameEn(b: BlockReach, clue: readonly number[]) {
  const repeated = clue.filter((n) => n === b.length).length > 1;
  return repeated ? `the ${ORDINAL_EN[b.block] ?? `#${b.block + 1}`} block (${b.length})` : `the ${b.length}`;
}

function techniqueNameEn(step: LineStep): string {
  const names: Record<Technique, string> = {
    empty: "Zero clue",
    exact: "Exact fit",
    "fill-rest": "What's left",
    gap: "Small gap",
    overlap: "Overlap",
    edge: step.params.anchor ? "From the edge" : "From your marks",
    complete: "Line complete",
    unreachable: "Out of reach",
    combined: "Every arrangement",
  };
  return names[step.technique];
}

function hintNudgeEn(h: NonogramaHint): string {
  if (h.kind === "done") return HINT_EN.done;
  if (h.kind === "mistake") return `Check ${lineNameEn(h.line, h.index)}: one cell doesn't belong.`;
  const { step } = h;
  const what = step.cellsFilled.length ? "fill" : "cross out";
  return `Look at ${lineNameEn(step.line, step.index)}: you can already ${what} something for sure.`;
}

function hintExplainEn(h: NonogramaHint): string {
  if (h.kind === "done") return HINT_EN.done;
  if (h.kind === "mistake") return `Something you marked in ${lineNameEn(h.line, h.index)} doesn't match the picture. Check it, or undo until it fits.`;
  const { step } = h;
  const { clue, length: n } = step.params;
  const line = lineNameEn(step.line, step.index);
  const Line = capEn(line);
  switch (step.technique) {
    case "empty":
      return `${Line} has a 0: cross out the whole line.`;
    case "exact":
      return clue.length === 1
        ? `A ${n} in ${n} cells: fill all of ${line}.`
        : `In ${line}, ${clue.join(" + ")} plus one space between blocks adds up to ${n}, exactly its length: there's only one way to place them.`;
    case "fill-rest": {
      const m = step.params.missing ?? step.cellsFilled.length;
      return m === 1
        ? `${Line} needs 1 more filled cell and has exactly 1 free cell: fill it.`
        : `${Line} needs ${m} more filled cells and has exactly ${m} free cells: fill them all.`;
    }
    case "gap": {
      const g = step.params.gap!;
      const bounds = g.before === "edge" ? "between the edge and a cross" : g.after === "edge" ? "between a cross and the edge" : "between two crosses";
      const room = g.size === 1 ? "there's 1 cell" : `there are ${g.size} cells`;
      return `In ${line}, ${bounds} ${room}: no block fits (the smallest is ${g.smallest}). Cross ${g.size === 1 ? "it" : "them"} out.`;
    }
    case "overlap":
    case "edge": {
      const blocks = step.params.blocks ?? [];
      const only = blocks[0];
      if (step.technique === "overlap" && clue.length === 1 && only) {
        const k = only.cells.length;
        return `In ${line}, a ${only.length} in ${n} cells: wherever it starts, ${k === 1 ? "the middle cell is always filled" : `the middle ${k} are always filled`}.`;
      }
      const sentences: string[] = [];
      let rest = blocks;
      const anchor = step.params.anchor;
      if (step.technique === "edge" && anchor) {
        const b = anchor === "start" ? blocks.find((x) => x.block === 0) : blocks.find((x) => x.block === clue.length - 1);
        if (b) {
          rest = blocks.filter((x) => x !== b);
          sentences.push(
            anchor === "start"
              ? `${Line} starts with a filled cell against the edge: that's the first block, the ${b.length}, so the first ${b.length} cells are filled.`
              : `${Line} ends with a filled cell against the edge: that's the last block, the ${b.length}, so the last ${b.length} cells are filled.`,
          );
        }
      }
      const reach = rest.slice(0, 2).map((b, i) => {
        const name = blockNameEn(b, clue);
        if (b.to - b.from + 1 === b.length) return b.length === 1 ? `${name} only fits in cell ${b.from + 1}` : `${name} only fits in cells ${b.from + 1}–${b.to + 1}: fill it all`;
        return i === 0
          ? `${name} only fits between cells ${b.from + 1} and ${b.to + 1}: wherever you put it, it fills ${cellsEn(b.cells)}`
          : `${name}, between ${b.from + 1} and ${b.to + 1}: it fills ${cellsEn(b.cells)}`;
      });
      if (reach.length) {
        const where = lineWithCellsEn(step.line, step.index);
        const lead = sentences.length ? "Also," : step.technique === "overlap" ? `In ${where}, sliding the blocks all the way to one side and then the other,` : `In ${where}, given what you've marked,`;
        sentences.push(`${lead} ${reach.join(". And ")}.`);
      }
      return sentences.join(" ");
    }
    case "complete":
      return `${Line} already has everything it asks for: cross out the rest.`;
    case "unreachable": {
      const one = step.cellsCrossed.length === 1;
      return `In ${lineWithCellsEn(step.line, step.index)}, given what you've marked, no block can reach ${cellsEn(step.cellsCrossed)}: cross ${one ? "it" : "them"} out.`;
    }
    case "combined": {
      const parts = [
        step.cellsFilled.length ? `${cellsEn(step.cellsFilled)} ${step.cellsFilled.length === 1 ? "is" : "are"} filled` : "",
        step.cellsCrossed.length ? `${cellsEn(step.cellsCrossed)} ${step.cellsCrossed.length === 1 ? "is" : "are"} empty` : "",
      ].filter(Boolean);
      return `In ${lineWithCellsEn(step.line, step.index)}, try every way to place ${clue.join(" ")} given your marks: ${parts.join(", and ")} in all of them.`;
    }
  }
}

/** Textos de las pistas de Nonograma en el idioma activo. Web y app usan esto mismo. */
export const nonogramaHintCopy = (locale: Locale): { [K in keyof typeof HINT_ES]: string } => (locale === "en" ? HINT_EN : HINT_ES);
export const nonogramaHintsUsed = (n: number, locale: Locale) => (locale === "en" ? hintsUsedEn(n) : hintsUsedEs(n));
export const nonogramaTechniqueName = (step: LineStep, locale: Locale) => (locale === "en" ? techniqueNameEn(step) : techniqueNameEs(step));
export const nonogramaHintNudge = (h: NonogramaHint, locale: Locale) => (locale === "en" ? hintNudgeEn(h) : hintNudgeEs(h));
export const nonogramaHintExplain = (h: NonogramaHint, locale: Locale) => (locale === "en" ? hintExplainEn(h) : hintExplainEs(h));
