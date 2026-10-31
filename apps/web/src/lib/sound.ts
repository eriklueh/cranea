"use client";
import { getPrefs } from "@/lib/prefs";

/**
 * Sonidos cortos y suaves hechos con Web Audio (sin archivos). Apagados por defecto: solo suenan con
 * "Sonido" activado en Ajustes. Cada nota es una onda simple con ataque y caída rápidos para no hacer clic.
 */
export type SoundEvent = "tap" | "line" | "win" | "error";

type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number; to?: number };

const SOUNDS: Record<SoundEvent, Note[]> = {
  // Un toquecito de madera.
  tap: [{ freq: 660, at: 0, dur: 0.05, type: "triangle", gain: 0.05 }],
  // Dos notas que suben: línea o fila completa.
  line: [
    { freq: 523.25, at: 0, dur: 0.09, gain: 0.07 },
    { freq: 783.99, at: 0.07, dur: 0.12, gain: 0.07 },
  ],
  // Arpegio mayor.
  win: [
    { freq: 523.25, at: 0, dur: 0.12 },
    { freq: 659.25, at: 0.1, dur: 0.12 },
    { freq: 783.99, at: 0.2, dur: 0.14 },
    { freq: 1046.5, at: 0.32, dur: 0.32 },
  ],
  // Un "bup" grave que baja.
  error: [{ freq: 220, to: 160, at: 0, dur: 0.16, type: "triangle", gain: 0.08 }],
};

let ctx: AudioContext | null = null;

function context() {
  if (ctx) return ctx;
  const Ctor = typeof window === "undefined" ? undefined : window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/** Suena `event` si el sonido está activado. Nunca tira error: el audio es un extra. */
export function sound(event: SoundEvent, force = false) {
  if (!force && !getPrefs().sound) return;
  try {
    const ac = context();
    if (!ac) return;
    if (ac.state === "suspended") void ac.resume();
    const start = ac.currentTime + 0.01;
    for (const n of SOUNDS[event]) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const t = start + n.at;
      const peak = n.gain ?? 0.06;
      osc.type = n.type ?? "sine";
      osc.frequency.setValueAtTime(n.freq, t);
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, t + n.dur);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peak, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + n.dur + 0.02);
    }
  } catch {
    /* sin audio disponible */
  }
}
