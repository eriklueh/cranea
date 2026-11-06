import { describe, expect, it } from "vitest";
import { missingKeys, type Dictionary } from "./translate";
import { messages as web } from "../../../../apps/web/src/i18n/messages";
import { messages as app } from "../../../../apps/mobile/src/i18n/messages";

/** Los diccionarios completos de la web y de la app (compartidos + propios). */
const placeholders = (m: unknown) =>
  typeof m === "function" ? null : new Set([...JSON.stringify(m).matchAll(/\{(\w+)\}/g)].map((x) => x[1]));

describe.each([
  ["web", web],
  ["app", app],
])("diccionario de la %s", (_name, dicts) => {
  const es = dicts.es as Dictionary;
  const en = dicts.en as Dictionary;

  it("español e inglés tienen las mismas claves", () => {
    expect(missingKeys(es, en)).toEqual([]);
  });

  it("ningún texto vacío salvo los subtítulos en español", () => {
    for (const [ns, msgs] of Object.entries(en)) for (const [k, v] of Object.entries(msgs)) if (typeof v === "string") expect(v.trim(), `${ns}.${k}`).not.toBe("");
  });

  it("los mismos {marcadores} en los dos idiomas (salvo mensajes con función)", () => {
    for (const [ns, msgs] of Object.entries(es)) {
      for (const [k, v] of Object.entries(msgs)) {
        const a = placeholders(v);
        const b = placeholders(en[ns][k]);
        if (a && b) expect(b, `${ns}.${k}`).toEqual(a);
      }
    }
  });
});
