/** Reglas compartidas por el dispositivo y el servidor para combinar resultados. */

export interface Result {
  won: boolean;
  attempts: number;
  timeMs: number;
  at: number;
}

export type Kind = "level" | "daily";

/** Un nivel conserva tu mejor partida: ganar, menos intentos y después menos tiempo. */
export function better(a: Result | undefined, b: Result): Result {
  if (!a || !a.won) return b.won || !a ? b : a;
  if (!b.won) return a;
  if (b.attempts !== a.attempts) return b.attempts < a.attempts ? b : a;
  return b.timeMs < a.timeMs ? b : a;
}

/** El diario se juega una sola vez: vale la primera partida, aunque venga de otro dispositivo. */
export function first(a: Result | undefined, b: Result): Result {
  return !a || b.at < a.at ? b : a;
}

export const combine = (kind: Kind, a: Result | undefined, b: Result) => (kind === "level" ? better(a, b) : first(a, b));
