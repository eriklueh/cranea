/** Contrato mínimo que cumple cada juego de la plataforma. */
export interface GameMeta {
  id: string;
  name: string;
  tagline: string;
  /** Ruta base dentro de la app (web o mobile). */
  path: string;
  status: "live" | "soon";
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD en UTC
}
