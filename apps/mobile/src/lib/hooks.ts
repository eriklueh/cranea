import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, AppState } from "react-native";

/** La hora, actualizada cada `everyMs` y al volver la app al frente: el diario depende de la fecha UTC. */
export function useClock(everyMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") setNow(Date.now());
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [everyMs]);
  return now;
}

/** Llama a `run` cada vez que `value` cambia después del primer render. */
export function useOnChange<T>(value: T, run: (value: T, previous: T) => void) {
  const previous = useRef(value);
  const latest = useRef(run);
  useEffect(() => {
    latest.current = run;
  });
  useEffect(() => {
    if (Object.is(previous.current, value)) return;
    const before = previous.current;
    previous.current = value;
    latest.current(value, before);
  }, [value]);
}

/** Si la persona pidió reducir el movimiento en el sistema. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

/** Pasa a true `ms` después de que `active` se vuelve true, para no tapar una animación. */
export function useSettled(active: boolean, ms: number) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!active) {
      setSettled(false);
      return;
    }
    const t = setTimeout(() => setSettled(true), ms);
    return () => clearTimeout(t);
  }, [active, ms]);
  return active && settled;
}
