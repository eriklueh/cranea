/** "3:07" */
export function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Milisegundos hasta la próxima medianoche UTC, cuando cambia el diario. */
export function msToNextDaily(now: number) {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - now;
}

/** "5 h 12 min", "12 min", "menos de un minuto" */
export function formatCountdown(ms: number) {
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "menos de un minuto";
  const h = Math.floor(min / 60);
  return h > 0 ? `${h} h ${String(min % 60).padStart(2, "0")} min` : `${min} min`;
}

/** Número de un diario contando desde su día de lanzamiento. */
export function dayNumber(launch: string, dateKey: string) {
  const ms = Date.parse(`${dateKey}T00:00:00Z`) - Date.parse(`${launch}T00:00:00Z`);
  return Math.floor(ms / 86_400_000) + 1;
}
