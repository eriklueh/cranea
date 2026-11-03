// Genera los sonidos de la app (assets/sounds/*.wav) con las mismas notas que la web (apps/web/src/lib/sound.ts).
// Ondas simples con ataque de 8 ms y caída exponencial, en mono a 22 050 Hz: cada archivo pesa unos pocos KB.
// Uso: node apps/mobile/scripts/build-sounds.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const RATE = 22050;
const SOUNDS = {
  tap: [{ freq: 660, at: 0, dur: 0.05, type: "triangle", gain: 0.05 }],
  line: [
    { freq: 523.25, at: 0, dur: 0.09, gain: 0.07 },
    { freq: 783.99, at: 0.07, dur: 0.12, gain: 0.07 },
  ],
  win: [
    { freq: 523.25, at: 0, dur: 0.12 },
    { freq: 659.25, at: 0.1, dur: 0.12 },
    { freq: 783.99, at: 0.2, dur: 0.14 },
    { freq: 1046.5, at: 0.32, dur: 0.32 },
  ],
  error: [{ freq: 220, to: 160, at: 0, dur: 0.16, type: "triangle", gain: 0.08 }],
};
// La web suena a través de Web Audio sin compresión; acá se sube un poco para que se oiga en el parlante del teléfono.
const LOUDNESS = 4;

const wave = (type, phase) => (type === "triangle" ? (2 / Math.PI) * Math.asin(Math.sin(phase)) : Math.sin(phase));

function render(notes) {
  const length = Math.ceil((Math.max(...notes.map((n) => n.at + n.dur)) + 0.02) * RATE);
  const out = new Float32Array(length);
  for (const n of notes) {
    const start = Math.round(n.at * RATE);
    const total = Math.round(n.dur * RATE);
    const peak = (n.gain ?? 0.06) * LOUDNESS;
    let phase = 0;
    for (let i = 0; i < total; i++) {
      const t = i / RATE;
      const freq = n.to ? n.freq * Math.pow(n.to / n.freq, t / n.dur) : n.freq;
      phase += (2 * Math.PI * freq) / RATE;
      const attack = 0.008;
      const env = t < attack ? Math.pow(peak / 0.0001, t / attack) * 0.0001 : peak * Math.pow(0.0001 / peak, (t - attack) / (n.dur - attack));
      out[start + i] += wave(n.type ?? "sine", phase) * env;
    }
  }
  return out;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

for (const [name, notes] of Object.entries(SOUNDS)) {
  const file = fileURLToPath(new URL(`../assets/sounds/${name}.wav`, import.meta.url));
  writeFileSync(file, wav(render(notes)));
  console.log(name, file);
}
