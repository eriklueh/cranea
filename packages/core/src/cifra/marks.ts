/** Cada casilla guarda su propia nota, identificada por fila y columna. */
export type TileMark = "none" | "out" | "in" | "here";
export type Marks = Record<string, TileMark>;

export const emptyMarks = (): Marks => ({});

export function tileMarkState(marks: Marks, row: number, position: number): TileMark {
  return marks[`${row}:${position}`] ?? "none";
}

const NEXT: Record<TileMark, TileMark> = { none: "out", out: "in", in: "here", here: "none" };

/** Actualización inmutable de una sola casilla, sin propagar marcas por cifra o columna. */
export function nextMark(marks: Marks, row: number, position: number): Marks {
  const key = `${row}:${position}`;
  const state = NEXT[tileMarkState(marks, row, position)];
  const updated = { ...marks };
  if (state === "none") delete updated[key];
  else updated[key] = state;
  return updated;
}
