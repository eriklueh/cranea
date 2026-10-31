/** Clave de localStorage de los ajustes (formato de zustand persist: `{ state, version }`). */
export const PREFS_KEY = "cranea-prefs";

/** Corre en <head> antes de pintar, como el de next-themes: evita el destello con la paleta o la letra equivocadas. */
export const PREFS_SCRIPT = `try{var p=(JSON.parse(localStorage.getItem(${JSON.stringify(PREFS_KEY)}))||{}).state||{},r=document.documentElement;p.motion==="reduced"&&r.setAttribute("data-motion","reduced");p.palette==="colorblind"&&r.setAttribute("data-palette","colorblind");p.text==="large"&&r.setAttribute("data-text","large")}catch(e){}`;
