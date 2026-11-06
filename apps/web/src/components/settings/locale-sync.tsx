"use client";
import { useEffect } from "react";
import { useLocale } from "@/lib/i18n";

/**
 * Mantiene `<html lang>` y `data-locale` al día con el idioma activo, y saca `data-i18n-pending`
 * (lo pone prefs-script.ts en inglés) cuando la página ya se volvió a dibujar en inglés.
 */
export function LocaleSync() {
  const locale = useLocale();
  useEffect(() => {
    const root = document.documentElement;
    // Al hidratar, `useLocale` todavía da el español prerenderizado: no se toca nada hasta el inglés.
    if (root.hasAttribute("data-i18n-pending") && locale !== "en") return;
    root.lang = locale;
    if (locale === "en") root.setAttribute("data-locale", "en");
    else root.removeAttribute("data-locale");
    if (!root.hasAttribute("data-i18n-pending")) return;
    const id = requestAnimationFrame(() => root.removeAttribute("data-i18n-pending"));
    return () => cancelAnimationFrame(id);
  }, [locale]);
  return null;
}
