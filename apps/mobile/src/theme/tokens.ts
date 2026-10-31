/**
 * Los mismos tokens que la web (apps/web/src/app/globals.css): cuaderno claro y pizarrón oscuro.
 * Si cambia un color allá, cambialo acá también.
 */
export interface Palette {
  paper: string;
  gridLine: string;
  ink: string;
  pencil: string;
  margin: string;
  ok: string;
  clueExact: string;
  clueExactBg: string;
  cluePresent: string;
  cluePresentBg: string;
  tile: string;
  shadowInk: string;
  card: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  border: string;
  ring: string;
}

export const light: Palette = {
  paper: "#f6f8fb",
  gridLine: "#dbe5f1",
  ink: "#1c2b4b",
  pencil: "#6f7a8f",
  margin: "#d2453d",
  ok: "#23774f",
  clueExact: "#21643d",
  clueExactBg: "#e4f3e9",
  cluePresent: "#806000",
  cluePresentBg: "#fff1ac",
  tile: "#ffffff",
  shadowInk: "#1c2b4b",
  card: "#ffffff",
  primary: "#1c2b4b",
  primaryForeground: "#ffffff",
  secondary: "#e6edf6",
  muted: "#eaf0f7",
  mutedForeground: "#6f7a8f",
  accent: "#e6edf6",
  border: "#c5d2e3",
  ring: "#3a63b8",
};

export const dark: Palette = {
  paper: "#202124",
  gridLine: "rgba(255,255,255,0.055)",
  ink: "#eceef2",
  pencil: "#adb1ba",
  margin: "#f28b7d",
  ok: "#8bd6a7",
  clueExact: "#8bd6a7",
  clueExactBg: "#283d30",
  cluePresent: "#f2d66c",
  cluePresentBg: "#413a24",
  tile: "#2b2d31",
  shadowInk: "#111214",
  card: "#27292d",
  primary: "#eceef2",
  primaryForeground: "#202124",
  secondary: "#32353b",
  muted: "#2b2d31",
  mutedForeground: "#adb1ba",
  accent: "#353840",
  border: "#4a4d55",
  ring: "#92b4e7",
};

/** Familias cargadas en el layout raíz con expo-font. */
export const fonts = {
  body: "AtkinsonHyperlegible_400Regular",
  bodyBold: "AtkinsonHyperlegible_700Bold",
  display: "BricolageGrotesque_700Bold",
  displayHeavy: "BricolageGrotesque_800ExtraBold",
} as const;

export const radius = { sm: 6, md: 8, lg: 10, xl: 14 } as const;

/** Mitad con transparencia de un color hex (#rrggbb), para fondos suaves. */
export function alpha(hex: string, a: number) {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const n = Math.round(a * 255).toString(16).padStart(2, "0");
  return `${hex}${n}`;
}
