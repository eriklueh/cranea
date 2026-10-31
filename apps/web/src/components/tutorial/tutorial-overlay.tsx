"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useTutorialGate } from "./gate";
import { initialState, progressLabel, reduce, type StepMeta, type TutorialEvent, type TutorialState } from "./machine";
import { markTutorial } from "./storage";
import type { Target, TutorialScript } from "./types";

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PAD = 6;
const GAP = 12;
const EDGE = 12;
const RADIUS = 10;
const FOCUSABLE = 'button:not([disabled]), [tabindex]:not([tabindex="-1"]), a[href]';

const names = (t: Target) => (typeof t === "string" ? [t] : t);
const elementsFor = (t: Target) => names(t).flatMap((n) => [...document.querySelectorAll<HTMLElement>(`[data-tutorial="${n}"]`)]);

/** Rectángulo que abarca todos los elementos de un resaltado, con un poco de aire. */
function boxFor(t: Target): Box | null {
  const rects = elementsFor(t).map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0 || r.height > 0);
  if (!rects.length) return null;
  const x = Math.min(...rects.map((r) => r.left)) - PAD;
  const y = Math.min(...rects.map((r) => r.top)) - PAD;
  const right = Math.max(...rects.map((r) => r.right)) + PAD;
  const bottom = Math.max(...rects.map((r) => r.bottom)) + PAD;
  return { x, y, w: right - x, h: bottom - y };
}

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const merge = (a: Box, b: Box): Box => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
};

/** Huecos que se tocan se funden en uno: así el recorte par-impar nunca vuelve a tapar la intersección. */
function mergeBoxes(boxes: Box[]): Box[] {
  const out = boxes.slice();
  for (let i = 0; i < out.length; i++) {
    for (let j = i + 1; j < out.length; j++) {
      if (!overlaps(out[i], out[j])) continue;
      out[i] = merge(out[i], out[j]);
      out.splice(j, 1);
      j = i;
    }
  }
  return out;
}

const near = (a: number, b: number) => Math.abs(a - b) < 0.5;
const sameBoxes = (a: (Box | null)[], b: (Box | null)[]) =>
  a.length === b.length && a.every((x, i) => (x === null || b[i] === null ? x === b[i] : near(x.x, b[i]!.x) && near(x.y, b[i]!.y) && near(x.w, b[i]!.w) && near(x.h, b[i]!.h)));

/** Mide los resaltados y los sigue con scroll, cambios de tamaño y del DOM (filas nuevas, animaciones de entrada). */
function useBoxes(targets: readonly Target[], root: HTMLElement | null) {
  const [boxes, setBoxes] = useState<(Box | null)[]>([]);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const key = JSON.stringify(targets);
  useLayoutEffect(() => {
    const list = JSON.parse(key) as Target[];
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const ro = new ResizeObserver(schedule);
    function measure() {
      const next = list.map(boxFor);
      setBoxes((prev) => (sameBoxes(prev, next) ? prev : next));
      setViewport((v) => (v.w === window.innerWidth && v.h === window.innerHeight ? v : { w: window.innerWidth, h: window.innerHeight }));
      ro.disconnect();
      list.flatMap(elementsFor).forEach((el) => ro.observe(el));
    }
    // Los cambios del propio globo no cuentan: si no, se mediría sin fin.
    const mo = new MutationObserver((records) => {
      if (records.some((r) => !root?.contains(r.target))) schedule();
    });
    measure();
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-tutorial", "class", "style"] });
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    // Las entradas animadas mueven los elementos sin tocar el DOM: se vuelve a medir cuando terminan.
    const timers = [150, 450, 1000].map((ms) => setTimeout(schedule, ms));
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [key, root]);
  return { boxes, viewport };
}

const roundedRect = (b: Box, r = RADIUS) =>
  `M${b.x + r},${b.y}H${b.x + b.w - r}A${r},${r} 0 0 1 ${b.x + b.w},${b.y + r}V${b.y + b.h - r}A${r},${r} 0 0 1 ${b.x + b.w - r},${b.y + b.h}H${b.x + r}A${r},${r} 0 0 1 ${b.x},${b.y + b.h - r}V${b.y + r}A${r},${r} 0 0 1 ${b.x + r},${b.y}Z`;

/** Recorrido guiado sobre el juego real: oscurece todo menos lo que hay que tocar y valida cada jugada. */
export function TutorialOverlay<S>({ script }: { script: TutorialScript<S> }) {
  const router = useRouter();
  const gate = useTutorialGate();
  const hydrated = useHydrated();
  const [state, setState] = useState<TutorialState>(initialState);
  const stateRef = useRef(state);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [bubbleHeight, setBubbleHeight] = useState(0);
  /** Última jugada aceptada: a esto se vuelve si la siguiente no era. */
  const accepted = useRef<{ snap: Partial<S>; key: string } | null>(null);
  /** Mientras se reinicia el tablero, lo que cambia es el nuevo punto de partida. */
  const resetting = useRef(false);
  const metas = useMemo<StepMeta[]>(() => script.steps.map((s) => ({ action: Boolean(s.check), nudge: s.nudge })), [script]);

  const commit = useCallback((next: TutorialState) => {
    stateRef.current = next;
    setState(next);
  }, []);
  const dispatch = useCallback((event: TutorialEvent) => commit(reduce(stateRef.current, event, metas).state), [commit, metas]);

  // Cada jugada se evalúa contra el paso actual: la buena queda, la que no era se deshace.
  useEffect(() => {
    const { store } = script;
    let restoring = false;
    let waiting: ReturnType<typeof setTimeout> | null = null;
    const take = (s: S) => {
      accepted.current = { snap: script.snapshot(s), key: script.key(s) };
    };
    const restore = () => {
      if (!accepted.current) return;
      restoring = true;
      store.setState(accepted.current.snap);
      restoring = false;
    };
    if (script.live(store.getState())) take(store.getState());
    const unsubscribe = store.subscribe((s) => {
      if (restoring || !script.live(s)) return;
      if (!accepted.current || resetting.current) return take(s);
      if (script.key(s) === accepted.current.key) return;
      const current = stateRef.current;
      if (current.status !== "active") return;
      // Mientras se muestra la jugada que completó el paso, no se aceptan otras.
      if (waiting) return restore();
      const step = script.steps[current.step];
      const verdict = step.check ? step.check(s) : "progress";
      const { state: next, effect } = reduce(current, { type: "verdict", verdict }, metas);
      if (effect === "revert") restore();
      else if (effect === "accept") take(s);
      if (next.step === current.step && next.status === current.status) return commit(next);
      waiting = setTimeout(() => {
        waiting = null;
        commit(next);
      }, prefersReducedMotion() ? 0 : (step.delay ?? 350));
    });
    return () => {
      unsubscribe();
      if (waiting) clearTimeout(waiting);
    };
  }, [script, metas, commit]);

  const finished = state.status === "finished";
  useEffect(() => {
    if (finished) markTutorial(script.game, "done");
  }, [finished, script.game]);

  const step = finished ? null : script.steps[state.step];
  // El último medido es el ancla del globo; los demás son los huecos.
  const measured = useMemo(() => {
    const targets = step?.targets ?? [];
    const anchor = step?.anchor ?? targets[0];
    return anchor ? [...targets, anchor] : [...targets];
  }, [step]);
  const { boxes, viewport } = useBoxes(measured, root);
  const holeCount = step?.targets?.length ?? 0;
  const holes = useMemo(() => mergeBoxes(boxes.slice(0, holeCount).filter((b): b is Box => b !== null)), [boxes, holeCount]);
  const anchorBox = boxes.length > holeCount ? (boxes[boxes.length - 1] ?? null) : null;

  // Al entrar a un paso: lo resaltado a la vista y el foco donde sirve.
  useEffect(() => {
    if (!hydrated) return;
    const focusPrimary = () => bubbleRef.current?.querySelector<HTMLElement>("[data-primary]")?.focus({ preventScroll: true });
    if (!step) return void focusPrimary();
    const anchor = step.anchor ?? step.targets?.[0];
    const first = anchor ? elementsFor(anchor)[0] : null;
    if (first) {
      const r = first.getBoundingClientRect();
      if (r.top < 72 || r.bottom > window.innerHeight - 200) first.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
    const fromBubble = bubbleRef.current?.contains(document.activeElement);
    if (!step.check) focusPrimary();
    else if (fromBubble && step.targets?.[0]) {
      // Quien venía con el teclado desde el globo sigue en lo que hay que tocar.
      const el = elementsFor(step.targets[0])[0];
      (el?.matches(FOCUSABLE) ? el : el?.querySelector<HTMLElement>(FOCUSABLE))?.focus({ preventScroll: true });
    }
  }, [step, hydrated]);

  useLayoutEffect(() => {
    const el = bubbleRef.current;
    if (!el) return;
    const measure = () => setBubbleHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [root, hydrated]);

  const leave = (mark: "skipped" | "done") => {
    markTutorial(script.game, mark);
    if (gate) gate.leave();
    else if (mark === "skipped") router.push(script.homeHref);
  };
  const skip = () => {
    dispatch({ type: "skip" });
    leave("skipped");
  };
  const restart = () => {
    resetting.current = true;
    script.reset();
    resetting.current = false;
    dispatch({ type: "restart" });
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  if (!hydrated || state.status === "skipped") return null;

  // Globo: abajo o arriba de todo lo resaltado, para no tapar nada que haya que tocar. Si no entra,
  // abajo o arriba del ancla (puede tapar otro resaltado). Sin nada resaltado (y al final), abajo de la pantalla.
  const vw = viewport.w || window.innerWidth;
  const vh = viewport.h || window.innerHeight;
  const bw = Math.min(352, vw - EDGE * 2);
  const bh = bubbleHeight || 160;
  const fits = (space: number) => space >= bh + GAP + EDGE;
  let top: number;
  let left = (vw - bw) / 2;
  if (anchorBox) {
    const all = holes.reduce(merge, anchorBox);
    if (fits(vh - (all.y + all.h))) top = all.y + all.h + GAP;
    else if (fits(all.y)) top = all.y - bh - GAP;
    else if (fits(vh - (anchorBox.y + anchorBox.h))) top = anchorBox.y + anchorBox.h + GAP;
    else if (fits(anchorBox.y)) top = anchorBox.y - bh - GAP;
    else top = vh - (anchorBox.y + anchorBox.h) >= anchorBox.y ? vh - bh - EDGE : EDGE;
    left = Math.min(Math.max(anchorBox.x + anchorBox.w / 2 - bw / 2, EDGE), vw - bw - EDGE);
  } else top = vh - bh - EDGE * 2;
  top = Math.max(EDGE, Math.min(top, vh - bh - EDGE));

  const dim = `M0,0H${vw}V${vh}H0Z${holes.map((b) => roundedRect(b)).join("")}`;
  const label = progressLabel(state.step, script.steps.length);
  const text = step ? step.text : script.outro;

  return createPortal(
    <div ref={setRoot} className="pointer-events-none fixed inset-0 z-40" data-tutorial-overlay>
      <svg className="absolute inset-0 size-full" width={vw} height={vh} aria-hidden>
        {/* Lo oscurecido bloquea los toques; los huecos (par-impar) los dejan pasar al juego. */}
        <path d={dim} fillRule="evenodd" className="pointer-events-auto fill-[var(--tutorial-dim)]" onClick={() => dispatch({ type: "outside" })} />
        {holes.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={RADIUS} className="tutorial-ring fill-none stroke-ring" strokeWidth={3} />
        ))}
      </svg>

      <div
        ref={bubbleRef}
        role="region"
        aria-label={`Tutorial de ${script.name}`}
        className="pointer-events-auto absolute rounded-xl border-2 border-ink bg-card p-4 text-card-foreground shadow-[0_4px_0_0_var(--shadow-ink)] transition-[top,left] duration-300 ease-out motion-reduce:transition-none"
        style={{ top, left, width: bw }}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{finished ? `Tutorial de ${script.name}` : label}</span>
          {!finished && (
            <button type="button" onClick={skip} className="-my-2 -mr-2 min-h-11 min-w-11 rounded-md px-3 text-sm font-semibold text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50">
              Saltar
            </button>
          )}
        </div>
        {finished && <p className="font-display text-2xl font-extrabold tracking-tight">¡Listo!</p>}
        <p key={finished ? "end" : `step-${state.step}`} className="anim-fade-up text-base leading-snug font-medium">
          {text}
        </p>
        <p key={`nudge-${state.nudgeKey}`} className={cn("text-sm font-semibold text-margin", state.nudge ? "anim-nudge mt-2" : "hidden")}>
          {state.nudge}
        </p>
        {step && !step.check && (
          <div className="mt-3 flex justify-end">
            <Button data-primary className="min-h-11 px-5" onClick={() => dispatch({ type: "next" })}>
              Siguiente
            </Button>
          </div>
        )}
        {finished && (
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" className="min-h-11" onClick={restart}>
              Repetir
            </Button>
            {gate ? (
              <Button data-primary className="min-h-11 px-5" onClick={() => leave("done")}>
                Ahora el nivel 1
              </Button>
            ) : (
              <Button asChild data-primary className="min-h-11 px-5">
                <Link href={script.levelHref}>Ahora el nivel 1</Link>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Lectores de pantalla: cada paso nuevo y cada aviso se anuncian. */}
      <p aria-live="polite" className="sr-only">
        {finished ? `¡Listo! ${script.outro}` : `${label}. ${text}`}
      </p>
      <p role="status" className="sr-only">
        {state.nudge}
      </p>
    </div>,
    document.body,
  );
}
