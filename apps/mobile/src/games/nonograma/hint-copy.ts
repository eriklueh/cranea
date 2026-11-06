import type { BlockReach, LineKind, LineStep, NonogramaHint, Technique } from "@cranea/core/nonograma";

/**
 * Todos los textos de las pistas de Nonograma, armados desde los pasos de la traza (@cranea/core).
 * Fuera de los componentes para poder traducirlos. Copia de apps/web/src/games/nonograma/hint-copy.ts (mantener iguales).
 */

export const HINT_COPY = {
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

export const hintsUsedText = (n: number) => (n === 1 ? "Usaste 1 pista" : `Usaste ${n} pistas`);

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
export function techniqueName(step: LineStep): string {
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
export function hintNudge(h: NonogramaHint): string {
  if (h.kind === "done") return HINT_COPY.done;
  if (h.kind === "mistake") return `Revisá ${lineName(h.line, h.index)}: hay una casilla que no va.`;
  const { step } = h;
  const what = step.cellsFilled.length ? "pintar" : "cruzar";
  return `Mirá ${lineName(step.line, step.index)}: ya se puede ${what} algo seguro.`;
}

/** Segundo toque: la deducción en palabras. */
export function hintExplain(h: NonogramaHint): string {
  if (h.kind === "done") return HINT_COPY.done;
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
