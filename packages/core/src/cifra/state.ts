/** Estado compartido por el solver y la traza: qué cifras están y dónde pueden ir. */

export const FULL = (1 << 10) - 1;
export const bit = (d: number) => 1 << d;
export const popcount = (x: number) => {
  let c = 0;
  while (x) {
    x &= x - 1;
    c++;
  }
  return c;
};
export const onlyDigit = (x: number) => 31 - Math.clz32(x);

export class Contradiction extends Error {}

export interface State {
  L: number;
  /** 1 = está, 0 = no está, -1 = desconocido */
  status: number[];
  /** Por posición, máscara de dígitos posibles. */
  dom: number[];
}

export const clone = (s: State): State => ({ L: s.L, status: s.status.slice(), dom: s.dom.slice() });
export const solved = (s: State) => s.dom.every((m) => popcount(m) === 1);

export function setStatus(s: State, d: number, v: 0 | 1): boolean {
  if (s.status[d] === v) return false;
  if (s.status[d] !== -1) throw new Contradiction();
  s.status[d] = v;
  return true;
}

export function removeDigit(s: State, p: number, d: number): boolean {
  if (!(s.dom[p] & bit(d))) return false;
  s.dom[p] &= ~bit(d);
  if (s.dom[p] === 0) throw new Contradiction();
  return true;
}

export function fix(s: State, p: number, d: number): boolean {
  if (s.dom[p] === bit(d)) return false;
  if (!(s.dom[p] & bit(d))) throw new Contradiction();
  s.dom[p] = bit(d);
  return true;
}

/** Consecuencias inmediatas de lo que ya se sabe. */
export function basic(s: State): boolean {
  let ch = false;
  for (let d = 0; d < 10; d++) {
    if (s.status[d] === 0) for (let p = 0; p < s.L; p++) ch = removeDigit(s, p, d) || ch;
  }
  for (let p = 0; p < s.L; p++) {
    if (popcount(s.dom[p]) === 1) {
      const d = onlyDigit(s.dom[p]);
      ch = setStatus(s, d, 1) || ch;
      for (let q = 0; q < s.L; q++) if (q !== p) ch = removeDigit(s, q, d) || ch;
    }
  }
  for (let d = 0; d < 10; d++) {
    const spots: number[] = [];
    for (let p = 0; p < s.L; p++) if (s.dom[p] & bit(d)) spots.push(p);
    if (spots.length === 0) ch = setStatus(s, d, 0) || ch;
    else if (spots.length === 1 && s.status[d] === 1) ch = fix(s, spots[0], d) || ch;
  }
  const inC = s.status.filter((v) => v === 1).length;
  const outC = s.status.filter((v) => v === 0).length;
  if (inC > s.L || outC > 10 - s.L) throw new Contradiction();
  if (inC === s.L || outC === 10 - s.L) {
    const v = inC === s.L ? 0 : 1;
    for (let d = 0; d < 10; d++) if (s.status[d] === -1) ch = setStatus(s, d, v) || ch;
  }
  return ch;
}
