import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "Craneá", short_name: "Craneá", lang: "es-AR",
    description: "Juegos de lógica cortos. Pensá, probá y descubrí el código.",
    start_url: "/", scope: "/", display: "standalone",
    background_color: "#1d3a31", theme_color: "#1d3a31",
    categories: ["games", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Cifra del día", url: "/cifra/diario", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Todos los niveles", url: "/cifra" },
    ],
  };
}
