import type { NamespaceShape } from "../translate";

/**
 * Motor y pantalla de los tutoriales guiados (apps/web/src/components/tutorial/*). Los guiones de
 * cada juego van en `tutorials/<juego>.ts` (espacios `tutorialCifra`, `tutorialPuentes`…).
 */
export const es = {
  /** Encabezado del globo y nombre de la región: «Tutorial de Cifra». */
  title: "Tutorial de {name}",
  progress: "Paso {step} de {total}",
  skip: "Saltar",
  next: "Siguiente",
  done: "¡Listo!",
  repeat: "Repetir",
  toLevel1: "Ahora el nivel 1",
  nudgeWrong: "Esa no. Probá con lo resaltado.",
  nudgeOutside: "Tocá lo resaltado.",
  nudgeInfo: "Primero tocá Siguiente.",
};

export const en: NamespaceShape<typeof es> = {
  title: "{name} tutorial",
  progress: "Step {step} of {total}",
  skip: "Skip",
  next: "Next",
  done: "All set!",
  repeat: "Replay",
  toLevel1: "On to level 1",
  nudgeWrong: "Not that one. Try the highlighted spot.",
  nudgeOutside: "Tap the highlighted spot.",
  nudgeInfo: "Tap Next first.",
};
