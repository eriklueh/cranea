/**
 * Idiomas de Craneá: diccionarios tipados y una `t(clave, parámetros)` mínima, sin dependencias.
 * La web y la app arman su diccionario sumando los espacios de nombres de `messages/` (compartidos)
 * con los propios, y resuelven el idioma con `resolveLocale` (preferencia → dispositivo → español).
 * Ver docs/i18n.md.
 */

export type Locale = "es" | "en";
/** Lo que se guarda en Ajustes: un idioma fijo o el del dispositivo. */
export type LocalePref = "auto" | Locale;

export const LOCALES: readonly Locale[] = ["es", "en"];
export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_PREFS: readonly LocalePref[] = ["auto", "es", "en"];

export const isLocalePref = (v: unknown): v is LocalePref => v === "auto" || v === "es" || v === "en";

/** Cualquier `en` o `en-*` es inglés; todo lo demás, español. Solo cuenta el idioma preferido (el primero). */
export function localeFromTags(tags: readonly (string | null | undefined)[] | null | undefined): Locale {
  const first = tags?.find((t) => typeof t === "string" && t.length > 0);
  return first && /^en(?:[-_]|$)/i.test(first) ? "en" : DEFAULT_LOCALE;
}

/** Preferencia del usuario → idioma del dispositivo → español. */
export function resolveLocale(pref: LocalePref | null | undefined, deviceTags?: readonly (string | null | undefined)[] | null): Locale {
  if (pref === "es" || pref === "en") return pref;
  return localeFromTags(deviceTags);
}

/** Etiqueta para `Intl` (fechas, números). */
export const intlLocale = (locale: Locale) => (locale === "en" ? "en-US" : "es-AR");

// ---------------------------------------------------------------------------
// Mensajes

export type Params = Record<string, string | number>;
/** Plural: `one` para 1, `other` para lo demás (alcanza para español e inglés). `{count}` se interpola. */
export interface Plural {
  one: string;
  other: string;
}
/** Un texto fijo con `{marcadores}`, un plural o una función para la gramática difícil. */
export type Message = string | Plural | ((p: Params) => string);
export type Namespace = Record<string, Message>;
export type Dictionary = Record<string, Namespace>;

/** La forma de un diccionario con los valores ensanchados: el inglés tiene que tener las mismas claves. */
export type Shape<D extends Dictionary> = { [N in keyof D]: { [K in keyof D[N]]: Message } };
export type NamespaceShape<N extends Namespace> = { [K in keyof N]: Message };

/** Todas las claves `"espacio.clave"` de un diccionario. */
export type MessageKey<D extends Dictionary> = { [N in keyof D & string]: `${N}.${keyof D[N] & string}` }[keyof D & string];

export type Translate<D extends Dictionary> = (key: MessageKey<D>, params?: Params) => string;

const isPlural = (m: Message): m is Plural => typeof m === "object" && m !== null && "other" in m;

/** Reemplaza `{nombre}` por el parámetro; los que faltan quedan como están. */
export function interpolate(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (all, name: string) => (name in params ? String(params[name]) : all));
}

export function format(message: Message | undefined, params?: Params): string | undefined {
  if (message === undefined) return undefined;
  if (typeof message === "function") return message(params ?? {});
  if (isPlural(message)) return interpolate(Number(params?.count) === 1 ? message.one : message.other, params);
  return interpolate(message, params);
}

/** `t` para un idioma. Si falta una clave en inglés, cae al español; si falta en los dos, devuelve la clave. */
export function createTranslator<D extends Dictionary>(dicts: { es: D; en: Shape<D> }, locale: Locale): Translate<D> {
  const primary = dicts[locale] as Dictionary;
  const fallback = dicts.es as Dictionary;
  return (key, params) => {
    const dot = key.indexOf(".");
    const ns = key.slice(0, dot);
    const k = key.slice(dot + 1);
    return format(primary[ns]?.[k], params) ?? format(fallback[ns]?.[k], params) ?? key;
  };
}

/** Claves que están en un diccionario y no en el otro (para los tests de cada app). */
export function missingKeys(a: Dictionary, b: Dictionary): string[] {
  const out: string[] = [];
  for (const [ns, msgs] of Object.entries(a)) for (const k of Object.keys(msgs)) if (!b[ns] || !(k in b[ns])) out.push(`${ns}.${k}`);
  for (const [ns, msgs] of Object.entries(b)) for (const k of Object.keys(msgs)) if (!a[ns] || !(k in a[ns])) out.push(`${ns}.${k}`);
  return out;
}

// ---------------------------------------------------------------------------
// Formatos

/** "1, 2 y 3" / "1, 2 and 3" (sin coma de Oxford, como el resto de los textos). */
export function list(items: readonly string[], locale: Locale): string {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${locale === "en" ? "and" : "y"} ${items.at(-1)}`;
}

export const formatNumber = (n: number, locale: Locale, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(intlLocale(locale), options).format(n);

export const formatDate = (date: Date | number, locale: Locale, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(intlLocale(locale), options).format(date);

// ---------------------------------------------------------------------------
// Juegos según el idioma

/** Juegos que solo existen en español (Palabra usa palabras en castellano): se ocultan en inglés. */
export const SPANISH_ONLY_GAMES: readonly string[] = ["palabra"];

export const gameAvailable = (gameId: string, locale: Locale) => locale === "es" || !SPANISH_ONLY_GAMES.includes(gameId);

export function gamesFor<T extends { id: string }>(games: readonly T[], locale: Locale): T[] {
  return games.filter((g) => gameAvailable(g.id, locale));
}

