/** Cálculo puro del próximo recordatorio, en la hora local de cada jugador. */

const DAY = 24 * 60 * 60 * 1000;

/** Minutos que la hora local le lleva a UTC en ese instante. Sin zona válida, usa el desfase guardado. */
export function offsetAt(ms: number, timeZone: string, fallback: number): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(ms);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const local = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    const offset = Math.round((local - Math.floor(ms / 60000) * 60000) / 60000);
    return Number.isFinite(offset) ? offset : fallback;
  } catch {
    return fallback;
  }
}

/** Primer instante posterior a `now` en el que el reloj local marca `minutes` (minutos desde medianoche). */
export function nextReminder(now: number, minutes: number, timeZone: string, fallback: number): number {
  const localNow = now + offsetAt(now, timeZone, fallback) * 60000;
  const midnight = Math.floor(localNow / DAY) * DAY;
  for (const day of [0, 1, 2]) {
    const wall = midnight + day * DAY + minutes * 60000;
    // Dos pasadas para que el desfase corresponda al instante del recordatorio (cambios de horario).
    let at = wall - offsetAt(wall, timeZone, fallback) * 60000;
    at = wall - offsetAt(at, timeZone, fallback) * 60000;
    if (at > now) return at;
  }
  return now + DAY;
}

export const validMinutes = (m: number) => Number.isInteger(m) && m >= 0 && m < 24 * 60;
