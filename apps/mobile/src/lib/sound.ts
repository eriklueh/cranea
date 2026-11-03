import { getPrefs } from "@/lib/prefs";

/**
 * Sonidos cortos y suaves, los mismos cuatro que la web (apps/web/src/lib/sound.ts), en WAV de pocos KB
 * (assets/sounds, generados con scripts/build-sounds.mjs). Apagados por defecto: suenan solo con
 * «Sonido» activado en Ajustes. Respetan el modo silencio del teléfono y no cortan la música.
 *
 * expo-audio es un módulo nativo: si un development build viejo no lo trae, se carga con `require`
 * en línea y, sin él, la app sigue muda (nunca rompe).
 */
export type SoundEvent = "tap" | "line" | "win" | "error";

const FILES: Record<SoundEvent, number> = {
  tap: require("../../assets/sounds/tap.wav"),
  line: require("../../assets/sounds/line.wav"),
  win: require("../../assets/sounds/win.wav"),
  error: require("../../assets/sounds/error.wav"),
};

type AudioModule = typeof import("expo-audio");
type Player = ReturnType<AudioModule["createAudioPlayer"]>;

let audio: AudioModule | null | undefined;
const players: Partial<Record<SoundEvent, Player>> = {};

function load(): AudioModule | null {
  if (audio !== undefined) return audio;
  try {
    audio = require("expo-audio") as AudioModule;
    void audio.setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers", shouldPlayInBackground: false }).catch(() => {});
  } catch {
    audio = null;
  }
  return audio;
}

/** Suena `event` si el sonido está activado (o con `force`, para probarlo al prenderlo). */
export function sound(event: SoundEvent, force = false) {
  if (!force && !getPrefs().sound) return;
  try {
    const mod = load();
    if (!mod) return;
    const player = (players[event] ??= mod.createAudioPlayer(FILES[event]));
    player.volume = 1;
    void player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    /* sin audio disponible */
  }
}
