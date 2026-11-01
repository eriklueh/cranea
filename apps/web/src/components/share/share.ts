/** Compartir texto o imágenes desde el navegador, con alternativa cuando no hay hoja de compartir. */

export type ShareOutcome = "shared" | "copied" | "downloaded" | "saved" | "cancelled" | "failed";

const cancelled = (e: unknown) => e instanceof DOMException && e.name === "AbortError";

/** La hoja de compartir del sistema; si no hay, copia al portapapeles. */
export async function shareText(text: string): Promise<ShareOutcome> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (e) {
      if (cancelled(e)) return "cancelled";
      // Algunos navegadores tienen share pero lo rechazan (permisos, iframe): se copia.
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

/** Comparte una imagen como archivo si el navegador puede; si no, la descarga. */
export async function shareImage(blob: Blob, filename: string, title?: string): Promise<ShareOutcome> {
  const file = new File([blob], filename, { type: blob.type || "image/png" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (e) {
      if (cancelled(e)) return "cancelled";
    }
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return "downloaded";
  } catch {
    return "failed";
  }
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * La imagen y el texto juntos en la hoja de compartir. Sin hoja que acepte archivos,
 * descarga la imagen y copia el texto, así se puede pegar en el chat igual.
 */
export async function shareImageWithText(blob: Blob, filename: string, text: string, title?: string): Promise<ShareOutcome> {
  const file = new File([blob], filename, { type: blob.type || "image/png" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text, title });
      return "shared";
    } catch (e) {
      if (cancelled(e)) return "cancelled";
    }
  }
  let saved = false;
  try {
    download(blob, filename);
    saved = true;
  } catch {
    /* sigue con el texto */
  }
  try {
    await navigator.clipboard.writeText(text);
    return saved ? "saved" : "copied";
  } catch {
    return saved ? "downloaded" : "failed";
  }
}

/** Mensaje corto para anunciar cómo terminó; null si no hace falta decir nada. */
export function outcomeMessage(o: ShareOutcome): string | null {
  switch (o) {
    case "copied":
      return "Copiado. Pegalo donde quieras.";
    case "downloaded":
      return "Imagen descargada.";
    case "saved":
      return "Imagen descargada y texto copiado.";
    case "failed":
      return "No se pudo compartir.";
    default:
      return null;
  }
}
