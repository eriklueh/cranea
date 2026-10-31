"use client";
import { useEffect, useState } from "react";

/**
 * La hora del cliente, actualizada cada `everyMs`. null en el servidor y en el
 * primer render: el diario depende de la fecha UTC del dispositivo.
 */
export function useClock(everyMs = 30_000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), everyMs);
    const onVisible = () => document.visibilityState === "visible" && setNow(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [everyMs]);
  return now;
}
