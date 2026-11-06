/** Clave de localStorage de los ajustes (formato de zustand persist: `{ state, version }`). */
export const PREFS_KEY = "cranea-prefs";

/**
 * Corre en <head> antes de pintar, como el de next-themes: evita el destello con la paleta o la letra equivocadas.
 * También resuelve el idioma (Ajustes → navegador → español, como `resolveLocale`) y lo pone en `<html lang>`.
 * En inglés marca `data-i18n-pending`: globals.css oculta el cuerpo (prerenderizado en español) hasta que
 * LocaleSync lo saca después de hidratar, con un tope por si el JS no llega.
 */
export const PREFS_SCRIPT = `try{var p=(JSON.parse(localStorage.getItem(${JSON.stringify(PREFS_KEY)}))||{}).state||{},r=document.documentElement;p.motion==="reduced"&&r.setAttribute("data-motion","reduced");p.palette==="colorblind"&&r.setAttribute("data-palette","colorblind");p.text==="large"&&r.setAttribute("data-text","large");var l=p.language;if(l!=="es"&&l!=="en"){var n=navigator.languages&&navigator.languages.length?navigator.languages[0]:navigator.language;l=/^en([-_]|$)/i.test(n||"")?"en":"es"}r.lang=l;if(l==="en"){r.setAttribute("data-locale","en");r.setAttribute("data-i18n-pending","")}}catch(e){}`;
