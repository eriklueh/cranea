import { describe, expect, it } from "vitest";
import { evaluateAchievements } from "../achievements";
import {
  addDays,
  grantPlus,
  mergeProtectors,
  playedDays,
  protectedBestStreak,
  protectedFullStreak,
  protectedStreak,
  protectorStatus,
  unseenCovered,
  type ProtectorState,
} from "./index";

const D0 = "2026-01-01";
const day = (i: number) => addDays(D0, i);
const days = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => day(from + i));
const state = (extra: Partial<ProtectorState> = {}): ProtectorState => ({ since: D0, plus: [], seen: [], ...extra });
const set = (xs: string[]) => new Set(xs);
const won = (xs: string[]) => Object.fromEntries(xs.map((d) => [d, { won: true }]));

describe("protectorStatus", () => {
  it("sin estado no hay protectores", () => {
    expect(protectorStatus(undefined, set(days(0, 20)), day(21))).toMatchObject({ stock: 0, covered: [] });
  });

  it("gana uno cada 7 días seguidos, con tope de 2", () => {
    expect(protectorStatus(state(), set(days(0, 5)), day(6))).toMatchObject({ stock: 0, run: 6, nextIn: 1 });
    // Jugar hoy (el día 7) ya lo da.
    expect(protectorStatus(state(), set(days(0, 6)), day(6))).toMatchObject({ stock: 1, run: 0 });
    expect(protectorStatus(state(), set(days(0, 13)), day(14)).stock).toBe(2);
    expect(protectorStatus(state(), set(days(0, 30)), day(31)).stock).toBe(2);
  });

  it("los días jugados antes de `since` cuentan para el primero", () => {
    const s = state({ since: day(5) });
    expect(protectorStatus(s, set(days(0, 6)), day(7)).stock).toBe(1);
  });

  it("cubre un día perdido y la racha sigue", () => {
    const played = set([...days(0, 6), ...days(8, 9)]);
    const st = protectorStatus(state(), played, day(10));
    expect(st.covered).toEqual([day(7)]);
    expect(st.stock).toBe(0);
    expect(protectedStreak(won([...played]), day(10), set(st.covered))).toBe(9);
  });

  it("hoy nunca se cubre", () => {
    const st = protectorStatus(state(), set(days(0, 6)), day(7));
    expect(st.covered).toEqual([]);
    expect(st.stock).toBe(1);
  });

  it("cubre ayer mientras hoy todavía se puede jugar", () => {
    const st = protectorStatus(state(), set(days(0, 6)), day(8));
    expect(st).toMatchObject({ covered: [day(7)], stock: 0 });
    expect(protectedStreak(won(days(0, 6)), day(8), set(st.covered))).toBe(7);
  });

  it("si el hueco es más largo que el stock, la racha se corta y no gasta nada", () => {
    const played = set([...days(0, 13), ...days(17, 18)]);
    const st = protectorStatus(state(), played, day(19));
    expect(st.covered).toEqual([]);
    expect(st.stock).toBe(2);
    expect(st.run).toBe(2);
  });

  it("un hueco de dos días usa los dos", () => {
    const played = set([...days(0, 13), ...days(16, 16)]);
    const st = protectorStatus(state(), played, day(17));
    expect(st.covered).toEqual([day(14), day(15)]);
    expect(st.stock).toBe(0);
  });

  it("sin racha que salvar no gasta", () => {
    // Gana uno en el día 6, falta 7–9 (más que el stock), vuelve el 10 y falta el 11.
    const played = set([...days(0, 6), day(10)]);
    const st = protectorStatus(state(), played, day(12));
    expect(st.covered).toEqual([day(11)]);
    // Sin jugar nunca antes, nada.
    expect(protectorStatus(state({ plus: [D0] }), set([]), day(3))).toMatchObject({ covered: [], stock: 2 });
  });

  it("los días cubiertos no cortan ni suman a la cuenta de 7", () => {
    // 7 jugados (+1), cubre el 7, juega 8–13 (6 días): sigue en 6, no 7.
    const played = set([...days(0, 6), ...days(8, 13)]);
    const st = protectorStatus(state(), played, day(14));
    expect(st).toMatchObject({ stock: 0, run: 6, covered: [day(7)] });
  });

  it("Plus: el día del regalo el stock pasa a 2, sin acumular más", () => {
    const s = state({ plus: [day(0)] });
    expect(protectorStatus(s, set([]), day(0)).stock).toBe(2);
    expect(protectorStatus(s, set(days(0, 6)), day(7)).stock).toBe(2);
    // Gasta uno y el mes siguiente vuelve a 2.
    const s2 = state({ plus: [day(0), "2026-02-01"] });
    const played = set([...days(0, 9), ...days(11, 30)]);
    expect(protectorStatus(s2, played, "2026-01-31").stock).toBe(2); // ganó otro jugando
    const lazy = set([day(0), day(2)]);
    expect(protectorStatus(s2, lazy, day(3))).toMatchObject({ covered: [day(1)], stock: 1 });
    expect(protectorStatus(s2, lazy, "2026-02-01").stock).toBe(2);
  });

  it("grantPlus anota un día por mes", () => {
    const a = grantPlus(state(), "2026-01-05");
    expect(a.plus).toEqual(["2026-01-05"]);
    expect(grantPlus(a, "2026-01-20")).toBe(a);
    expect(grantPlus(a, "2026-02-02").plus).toEqual(["2026-01-05", "2026-02-02"]);
  });

  it("unseenCovered devuelve solo lo nuevo", () => {
    const st = protectorStatus(state(), set([...days(0, 13), day(15), day(17)]), day(18));
    expect(st.covered).toEqual([day(14), day(16)]);
    expect(unseenCovered(st, state({ seen: [day(14)] }))).toEqual([day(16)]);
  });
});

describe("mergeProtectors", () => {
  const a: ProtectorState = { since: "2026-01-05", plus: ["2026-01-09", "2026-02-03"], seen: ["2026-01-07"] };
  const b: ProtectorState = { since: "2026-01-02", plus: ["2026-01-04", "2026-03-01"], seen: ["2026-01-08"] };

  it("since más antiguo, primer día de Plus por mes y unión de avisos", () => {
    expect(mergeProtectors(a, b)).toEqual({
      since: "2026-01-02",
      plus: ["2026-01-04", "2026-02-03", "2026-03-01"],
      seen: ["2026-01-07", "2026-01-08"],
    });
  });

  it("es conmutativa e idempotente", () => {
    expect(mergeProtectors(a, b)).toEqual(mergeProtectors(b, a));
    const m = mergeProtectors(a, b)!;
    expect(mergeProtectors(m, m)).toEqual(m);
    expect(mergeProtectors(m, a)).toEqual(m);
  });

  it("con un lado vacío o roto queda el otro", () => {
    expect(mergeProtectors(undefined, a)).toEqual(a);
    expect(mergeProtectors({ since: "nope", plus: [], seen: [] }, a)).toEqual(a);
    expect(mergeProtectors(undefined, undefined)).toBeUndefined();
  });

  it("dos dispositivos con el mismo historial ven el mismo stock aunque combinen después", () => {
    const played = set([...days(0, 6), ...days(8, 9)]);
    const phone = state();
    const web = state({ since: day(3) });
    const merged = mergeProtectors(phone, web)!;
    expect(protectorStatus(merged, played, day(10))).toEqual(protectorStatus(phone, played, day(10)));
  });
});

describe("rachas protegidas", () => {
  it("protectedStreak puentea días cubiertos sin sumarlos", () => {
    const daily = won([day(0), day(1), day(3)]);
    expect(protectedStreak(daily, day(4))).toBe(1);
    expect(protectedStreak(daily, day(4), set([day(2)]))).toBe(3);
    // Un diario perdido corta aunque el día no esté "perdido".
    expect(protectedStreak({ ...daily, [day(2)]: { won: false } }, day(4))).toBe(1);
  });

  it("protectedBestStreak", () => {
    const daily = won([day(0), day(1), day(3), day(4), day(5)]);
    expect(protectedBestStreak(daily)).toBe(3);
    expect(protectedBestStreak(daily, set([day(2)]))).toBe(5);
  });

  it("protectedFullStreak (Racha Craneá)", () => {
    const full = set([day(0), day(1), day(3)]);
    expect(protectedFullStreak((d) => full.has(d), day(4))).toBe(1);
    expect(protectedFullStreak((d) => full.has(d), day(4), set([day(2)]))).toBe(3);
  });

  it("playedDays junta los diarios de todos los juegos", () => {
    expect([...playedDays({ cifra: { daily: { [day(0)]: 1 } }, palabra: { daily: { [day(1)]: 1 } }, x: undefined })].sort()).toEqual([day(0), day(1)]);
  });

  it("los logros de racha usan los días cubiertos", () => {
    const daily = Object.fromEntries(
      [...days(0, 2), ...days(4, 7)].map((d) => [d, { won: true, attempts: 1, timeMs: 60_000, at: Date.parse(`${d}T12:00:00Z`) }]),
    );
    const input = { games: { cifra: { levels: {}, daily } }, worlds: { cifra: [] } };
    const without = evaluateAchievements(input).find((a) => a.id === "racha-7")!;
    const withCover = evaluateAchievements({ ...input, covered: [day(3)] }).find((a) => a.id === "racha-7")!;
    expect(without.unlocked).toBe(false);
    expect(withCover.unlocked).toBe(true);
  });
});
