import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS } from "../achievements";
import { achievementCopy, coreMessages, createTranslator, gameAvailable, gameCopy, gamesFor, list, localeFromTags, missingKeys, resolveLocale } from "./index";

describe("idioma", () => {
  it("cualquier en-* es inglés; lo demás, español", () => {
    expect(localeFromTags(["en-US"])).toBe("en");
    expect(localeFromTags(["en"])).toBe("en");
    expect(localeFromTags(["en_GB"])).toBe("en");
    expect(localeFromTags(["EN-au"])).toBe("en");
    expect(localeFromTags(["es-AR", "en"])).toBe("es");
    expect(localeFromTags(["fr-FR", "en-US"])).toBe("es");
    expect(localeFromTags(["pt-BR"])).toBe("es");
    expect(localeFromTags(["eng"])).toBe("es");
    expect(localeFromTags([])).toBe("es");
    expect(localeFromTags(undefined)).toBe("es");
    expect(localeFromTags([null, "", "en-US"])).toBe("en");
  });

  it("la preferencia gana sobre el dispositivo", () => {
    expect(resolveLocale("auto", ["en-US"])).toBe("en");
    expect(resolveLocale("es", ["en-US"])).toBe("es");
    expect(resolveLocale("en", ["es-AR"])).toBe("en");
    expect(resolveLocale(undefined, ["en-US"])).toBe("en");
    expect(resolveLocale("auto", undefined)).toBe("es");
  });
});

describe("diccionarios", () => {
  it("español e inglés tienen las mismas claves", () => {
    expect(missingKeys(coreMessages.es, coreMessages.en)).toEqual([]);
  });

  it("los mismos {marcadores} en los dos idiomas", () => {
    for (const [ns, msgs] of Object.entries(coreMessages.es)) {
      for (const [k, v] of Object.entries(msgs)) {
        const other = (coreMessages.en as Record<string, Record<string, unknown>>)[ns][k];
        const names = (m: unknown) => [...JSON.stringify(typeof m === "function" ? "" : m).matchAll(/\{(\w+)\}/g)].map((x) => x[1]).sort();
        expect(new Set(names(other)), `${ns}.${k}`).toEqual(new Set(names(v)));
      }
    }
  });

  it("interpola, elige plural y cae al español", () => {
    const t = createTranslator(coreMessages, "en");
    expect(t("common.attempts", { count: 1 })).toBe("1 try");
    expect(t("common.attempts", { count: 3 })).toBe("3 tries");
    expect(t("common.worldLevel", { world: 2, level: 5 })).toBe("World 2 · Level 5");
    const es = createTranslator(coreMessages, "es");
    expect(es("notifications.streak", { count: 1 })).toBe("Tu racha de 1 día te espera 🔥");
    expect(es("notifications.streak", { count: 4 })).toBe("Tu racha de 4 días te espera 🔥");
    const partial = createTranslator({ es: { a: { x: "hola {n}" } }, en: { a: {} as { x: string } } }, "en");
    expect(partial("a.x", { n: 2 })).toBe("hola 2");
  });

  it("listas", () => {
    expect(list(["1", "2", "3"], "es")).toBe("1, 2 y 3");
    expect(list(["1", "2"], "en")).toBe("1 and 2");
    expect(list(["1"], "en")).toBe("1");
  });

  it("cada logro y cada juego tienen texto", () => {
    for (const a of ACHIEVEMENTS) {
      for (const locale of ["es", "en"] as const) {
        const c = achievementCopy(a, locale, 4);
        expect(c.name).not.toContain("achievements.");
        expect(c.description).not.toContain("{");
      }
    }
    expect(achievementCopy({ id: "pleno" }, "en", 4).description).toBe("Win all 4 dailies on the same day.");
    expect(gameCopy("puentes", "en")).toEqual({ name: "Puentes", subtitle: "Bridges", tagline: expect.any(String) });
    expect(gameCopy("puentes", "es").subtitle).toBe("");
  });
});

describe("Palabra solo en español", () => {
  it("se oculta en inglés", () => {
    const games = [{ id: "cifra" }, { id: "palabra" }, { id: "torres" }];
    expect(gamesFor(games, "en").map((g) => g.id)).toEqual(["cifra", "torres"]);
    expect(gamesFor(games, "es")).toHaveLength(3);
    expect(gameAvailable("palabra", "en")).toBe(false);
  });
});
