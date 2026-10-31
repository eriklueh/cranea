"use client";
import { useEffect, useState } from "react";
import type { Dictionary } from "@cranea/core/palabra/words";

/**
 * Las listas de palabras se cargan aparte (import dinámico): quedan en su propio archivo de
 * /_next/static, fuera del resto de la app, y el service worker las guarda para jugar sin conexión.
 */
let pending: Promise<Dictionary> | null = null;

export function loadDictionary(): Promise<Dictionary> {
  pending ??= import("@cranea/core/palabra/words").then((m) => m.loadDictionary());
  pending.catch(() => {
    pending = null;
  });
  return pending;
}

export function useDictionary() {
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setFailed(false);
    loadDictionary().then(
      (d) => alive && setDict(d),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [attempt]);
  return { dict, failed, retry: () => setAttempt((n) => n + 1) };
}
