import { describe, expect, it } from "vitest";
import { addDays } from "./protectors";
import { dailyWidgetState, parseStoredProgress, widgetLink, type WidgetProgress } from "./widget";

const IDS = ["cifra", "puentes", "nonograma", "palabra", "torres"] as const;
const TODAY = "2026-11-06";
const W = { won: true };
const L = { won: false };

const progress = (games: Record<string, Record<string, { won: boolean }>>, protectors?: WidgetProgress["protectors"]): WidgetProgress => ({
  games: Object.fromEntries(Object.entries(games).map(([id, daily]) => [id, { daily }])),
  protectors,
});
const state = (p: WidgetProgress, locale: "es" | "en" = "es", today = TODAY) => dailyWidgetState(p, { gameIds: IDS, locale, today });

describe("widget: diarios de hoy", () => {
  it("sin partidas: nada hecho, el próximo es el primero del registro", () => {
    const s = state(progress({}));
    expect(s).toMatchObject({ done: 0, total: 5, allDone: false, next: "cifra", streak: 0, protectors: 0, link: "cranea://cifra/diario" });
    expect(s.games.map((g) => g.status)).toEqual(["pending", "pending", "pending", "pending", "pending"]);
  });

  it("cuenta ganados y perdidos de hoy y salta al primero pendiente en orden", () => {
    const s = state(progress({ cifra: { [TODAY]: W }, puentes: { [TODAY]: L }, torres: { [TODAY]: W } }));
    expect(s.done).toBe(3);
    expect(s.next).toBe("nonograma");
    expect(s.link).toBe("cranea://nonograma/diario");
    expect(s.games).toEqual([
      { id: "cifra", status: "won" },
      { id: "puentes", status: "lost" },
      { id: "nonograma", status: "pending" },
      { id: "palabra", status: "pending" },
      { id: "torres", status: "won" },
    ]);
  });

  it("lo de ayer no cuenta como hecho hoy", () => {
    const s = state(progress({ cifra: { [addDays(TODAY, -1)]: W } }));
    expect(s.done).toBe(0);
    expect(s.games[0].status).toBe("pending");
  });

  it("todos jugados: listo por hoy y el toque abre el inicio", () => {
    const all = Object.fromEntries(IDS.map((id) => [id, { [TODAY]: id === "palabra" ? L : W }]));
    const s = state(progress(all));
    expect(s).toMatchObject({ done: 5, total: 5, allDone: true, next: null, link: "cranea:///" });
  });

  it("en inglés no está Palabra: 4 diarios y nunca la propone", () => {
    const s = state(progress({ cifra: { [TODAY]: W }, puentes: { [TODAY]: W }, nonograma: { [TODAY]: W } }), "en");
    expect(s.total).toBe(4);
    expect(s.games.map((g) => g.id)).toEqual(["cifra", "puentes", "nonograma", "torres"]);
    expect(s.next).toBe("torres");
    const all = state(progress({ cifra: { [TODAY]: W }, puentes: { [TODAY]: W }, nonograma: { [TODAY]: W }, torres: { [TODAY]: L } }), "en");
    expect(all).toMatchObject({ done: 4, allDone: true, next: null });
  });

  it("racha: la más larga entre los juegos visibles, hasta ayer si hoy falta", () => {
    const days = (n: number, end = addDays(TODAY, -1)) => Object.fromEntries(Array.from({ length: n }, (_, i) => [addDays(end, -i), W]));
    expect(state(progress({ cifra: days(3), torres: days(5) })).streak).toBe(5);
    expect(state(progress({ cifra: { ...days(3), [TODAY]: W } })).streak).toBe(4);
    // Una derrota hoy no borra la racha que venía hasta ayer.
    expect(state(progress({ cifra: { ...days(3), [TODAY]: L } })).streak).toBe(3);
    // En inglés la racha de Palabra no se muestra.
    expect(state(progress({ palabra: days(9), cifra: days(2) }), "es").streak).toBe(9);
    expect(state(progress({ palabra: days(9), cifra: days(2) }), "en").streak).toBe(2);
  });

  it("protectores: stock disponible y días cubiertos como puente de la racha", () => {
    const since = addDays(TODAY, -8);
    // 7 días ganados (ganan un protector), un día sin jugar (lo cubre) y hoy.
    const daily = Object.fromEntries([...Array.from({ length: 7 }, (_, i) => [addDays(since, i), W]), [TODAY, W]]);
    const s = state(progress({ cifra: daily }, { since, plus: [], seen: [] }));
    expect(s.streak).toBe(8);
    expect(s.protectors).toBe(0);
    // Con el regalo de Plus del mes hay 2 y nada cubierto.
    const plus = state(progress({}, { since: TODAY, plus: [TODAY], seen: [] }));
    expect(plus.protectors).toBe(2);
  });

  it("link", () => {
    expect(widgetLink("torres")).toBe("cranea://torres/diario");
    expect(widgetLink(null)).toBe("cranea:///");
  });
});

describe("widget: lectura de cranea-progress", () => {
  it("entiende el formato de zustand", () => {
    const raw = {
      state: {
        games: { cifra: { levels: { "w1-l1": { won: true } }, daily: { [TODAY]: { won: true, attempts: 3, timeMs: 1 } } } },
        protectors: { since: "2026-11-01", plus: [], seen: ["x", 3] },
      },
      version: 1,
    };
    expect(parseStoredProgress(raw)).toEqual({
      games: { cifra: { daily: { [TODAY]: { won: true } } } },
      protectors: { since: "2026-11-01", plus: [], seen: ["x"] },
    });
  });

  it("ignora basura sin romper", () => {
    expect(parseStoredProgress(null)).toEqual({ games: {}, protectors: undefined });
    expect(parseStoredProgress("x")).toEqual({ games: {}, protectors: undefined });
    expect(parseStoredProgress({ state: { games: { cifra: null, torres: { daily: { a: { won: "y" } } } } } })).toEqual({
      games: { torres: { daily: {} } },
      protectors: undefined,
    });
  });
});
