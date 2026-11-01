import { CIFRA_HOME, LAUNCH_DATE as CIFRA_LAUNCH } from "@/games/cifra/data";
import { LAUNCH_DATE as PALABRA_LAUNCH, PALABRA_HOME } from "@/games/palabra/data";
import { LAUNCH_DATE as PUENTES_LAUNCH, PUENTES_HOME } from "@/games/puentes/data";

/** Juegos con archivo de diarios en la app (los que ya se juegan acá) y desde qué día. */
export const ARCHIVE: Record<string, { name: string; launch: string; number: (date: string) => number }> = {
  cifra: { name: "Cifra", launch: CIFRA_LAUNCH, number: CIFRA_HOME.daily.number },
  palabra: { name: "Palabra", launch: PALABRA_LAUNCH, number: PALABRA_HOME.daily.number },
  puentes: { name: "Puentes", launch: PUENTES_LAUNCH, number: PUENTES_HOME.daily.number },
};

const DAY_MS = 86_400_000;
const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(`${d}T00:00:00Z`));

/** Diarios anteriores a hoy (UTC), del más nuevo al más viejo. */
export function pastDates(launch: string, today: string): string[] {
  const out: string[] = [];
  const start = Date.parse(`${launch}T00:00:00Z`);
  for (let t = Date.parse(`${today}T00:00:00Z`) - DAY_MS; t >= start; t -= DAY_MS) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}

/** Una fecha del archivo es válida si es anterior a hoy y no antes del lanzamiento. */
export const isArchiveDate = (launch: string, date: string, today: string) => isDate(date) && date >= launch && date < today;
