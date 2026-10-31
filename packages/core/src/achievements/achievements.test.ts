import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, evaluateAchievements, isPerfect, type AchievementGame, type AchievementResult, type WorldSize } from "./index";

const WORLDS: Record<string, WorldSize[]> = {
  cifra: [{ id: 2, levels: 3 }, { id: 3, levels: 3 }],
  puentes: [{ id: 1, levels: 12 }],
  nonograma: [{ id: 1, levels: 12 }],
  palabra: [{ id: 1, levels: 3 }],
  torres: [{ id: 1, levels: 3 }],
};

const DAY = 86_400_000;
const at = (date: string, hourUtc = 12) => Date.parse(`${date}T00:00:00Z`) + hourUtc * 3_600_000;
const r = (won: boolean, attempts: number, when: number, timeMs = 120_000): AchievementResult => ({ won, attempts, timeMs, at: when });
const day = (i: number) => new Date(Date.parse("2026-01-01T00:00:00Z") + i * DAY).toISOString().slice(0, 10);

function evaluate(games: Record<string, Partial<AchievementGame>>) {
  const full = Object.fromEntries(Object.entries(games).map(([id, g]) => [id, { levels: g.levels ?? {}, daily: g.daily ?? {} }]));
  const states = evaluateAchievements({ games: full, worlds: WORLDS, hour: (ms) => new Date(ms).getUTCHours() });
  return Object.fromEntries(states.map((s) => [s.id, s]));
}

describe("logros", () => {
  it("tiene un catálogo de ids únicos", () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it("sin partidas no desbloquea nada", () => {
    const s = evaluate({});
    expect(Object.values(s).every((a) => !a.unlocked && a.value === 0 && a.at === null)).toBe(true);
  });

  it("el primer diario cuenta aunque se pierda", () => {
    const s = evaluate({ cifra: { daily: { "2026-01-01": r(false, 3, at("2026-01-01")) } } });
    expect(s["primer-diario"]).toMatchObject({ unlocked: true, at: at("2026-01-01") });
    expect(s["primer-nivel"].unlocked).toBe(false);
  });

  it("cuenta rachas entre juegos y fecha el día que se completan", () => {
    const daily: Record<string, AchievementResult> = {};
    for (let i = 0; i < 7; i++) daily[day(i)] = r(true, 1, at(day(i)));
    const torresDay = day(7);
    const s = evaluate({ cifra: { daily }, torres: { daily: { [torresDay]: r(true, 2, at(torresDay)) } } });
    expect(s["racha-7"]).toMatchObject({ unlocked: true, at: at(day(6)) });
    expect(s["racha-30"]).toMatchObject({ unlocked: false, value: 8, goal: 30 });
  });

  it("una derrota corta la racha", () => {
    const daily: Record<string, AchievementResult> = {};
    for (let i = 0; i < 7; i++) daily[day(i)] = r(i !== 3, 1, at(day(i)));
    expect(evaluate({ cifra: { daily } })["racha-7"]).toMatchObject({ unlocked: false, value: 3 });
  });

  it("pleno: los 5 diarios ganados el mismo día", () => {
    const date = "2026-03-02";
    const games = Object.fromEntries(Object.keys(WORLDS).map((g, i) => [g, { daily: { [date]: r(true, 2, at(date, 10 + i)) } }]));
    expect(evaluate(games).pleno).toMatchObject({ unlocked: true, at: at(date, 14) });
    delete games.torres;
    expect(evaluate(games).pleno).toMatchObject({ unlocked: false, value: 4, goal: 5 });
  });

  it("madrugador y búho usan la hora local del final", () => {
    expect(evaluate({ cifra: { daily: { "2026-01-01": r(true, 1, at("2026-01-01", 7)) } } }).madrugador.unlocked).toBe(true);
    expect(evaluate({ cifra: { daily: { "2026-01-01": r(true, 1, at("2026-01-01", 8)) } } }).madrugador.unlocked).toBe(false);
    expect(evaluate({ cifra: { daily: { "2026-01-01": r(false, 3, at("2026-01-01", 2)) } } }).buho.unlocked).toBe(true);
  });

  it("palabra en 2 vale en niveles y diarios; cifra al primer intento solo en el diario", () => {
    const s = evaluate({
      palabra: { levels: { "w1-l1": r(true, 2, at("2026-01-01")) } },
      cifra: { levels: { "w2-l1": r(true, 1, at("2026-01-01")) } },
    });
    expect(s["palabra-2"].unlocked).toBe(true);
    expect(s["palabra-1"].unlocked).toBe(false);
    expect(s["cifra-1"].unlocked).toBe(false);
    expect(evaluate({ cifra: { daily: { "2026-01-01": r(true, 1, at("2026-01-01")) } } })["cifra-1"].unlocked).toBe(true);
  });

  it("rayo: un diario ganado en menos de un minuto", () => {
    expect(evaluate({ palabra: { daily: { "2026-01-01": r(true, 4, at("2026-01-01"), 59_000) } } }).rayo.unlocked).toBe(true);
    expect(evaluate({ palabra: { daily: { "2026-01-01": r(false, 6, at("2026-01-01"), 30_000) } } }).rayo.unlocked).toBe(false);
  });

  it("mundo completo y perfecto, con el avance del mundo más cerca", () => {
    const levels = { "w2-l1": r(true, 1, 1000), "w2-l2": r(true, 2, 3000), "w3-l1": r(true, 1, 2000) };
    let s = evaluate({ cifra: { levels } });
    expect(s["mundo-completo"]).toMatchObject({ unlocked: false, value: 2, goal: 3 });
    s = evaluate({ cifra: { levels: { ...levels, "w2-l3": r(true, 1, 5000) } } });
    expect(s["mundo-completo"]).toMatchObject({ unlocked: true, at: 5000 });
    expect(s["mundo-perfecto"].unlocked).toBe(false);
    s = evaluate({ palabra: { levels: { "w1-l1": r(true, 3, 1), "w1-l2": r(true, 1, 2), "w1-l3": r(true, 2, 3) } } });
    expect(s["mundo-perfecto"]).toMatchObject({ unlocked: true, at: 3 });
    expect(s.leyenda).toMatchObject({ unlocked: true, at: 3 });
  });

  it("los contadores fechan la n-ésima partida y no pasan del objetivo", () => {
    const levels = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`w1-l${i + 1}`, r(true, 1, 1000 * (12 - i))]));
    const s = evaluate({ nonograma: { levels }, puentes: { levels } });
    expect(s.artista).toMatchObject({ unlocked: true, value: 10, goal: 10, at: 10_000 });
    expect(s["puentes-10"].unlocked).toBe(true);
    expect(s["niveles-50"]).toMatchObject({ unlocked: false, value: 24 });
  });

  it("de todo un poco: una victoria en cada juego", () => {
    const games: Record<string, Partial<AchievementGame>> = Object.fromEntries(Object.keys(WORLDS).map((g, i) => [g, { levels: { "w1-l1": r(true, 2, 100 + i) } }]));
    expect(evaluate(games)["de-todo-un-poco"]).toMatchObject({ unlocked: true, at: 104 });
    games.torres = { levels: { "w1-l1": r(false, 3, 999) } };
    expect(evaluate(games)["de-todo-un-poco"]).toMatchObject({ unlocked: false, value: 4, goal: 5 });
  });

  it("3 puntitos: sin errores, o hasta 3 intentos en Palabra", () => {
    expect(isPerfect("cifra", r(true, 1, 0))).toBe(true);
    expect(isPerfect("cifra", r(true, 2, 0))).toBe(false);
    expect(isPerfect("palabra", r(true, 3, 0))).toBe(true);
    expect(isPerfect("palabra", r(false, 3, 0))).toBe(false);
  });

  it("es determinística", () => {
    const games = { cifra: { daily: { "2026-01-01": r(true, 1, at("2026-01-01")) } } };
    expect(evaluate(games)).toEqual(evaluate(games));
  });
});
