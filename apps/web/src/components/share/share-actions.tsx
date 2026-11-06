"use client";
import { useEffect, useState } from "react";
import { ImageIcon, LoaderCircleIcon, Share2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { renderShareCard, type ShareCard } from "./share-image";
import { outcomeMessage, shareImage, shareText } from "./share";

/**
 * "Compartir" (texto) y "Imagen" (PNG de la tarjeta). Lo que se comparte se arma al tocar,
 * así siempre sale con el progreso del momento.
 */
export function ShareActions({
  text,
  card,
  filename,
  label,
  className,
  size = "lg",
}: {
  text: () => string;
  card: () => ShareCard;
  filename: string;
  label?: string;
  className?: string;
  size?: "lg" | "default";
}) {
  const t = useT();
  const [busy, setBusy] = useState<"text" | "image" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(t);
  }, [message]);

  const onText = async () => {
    setBusy("text");
    setMessage(outcomeMessage(await shareText(text())));
    setBusy(null);
  };

  const onImage = async () => {
    setBusy("image");
    try {
      const c = card();
      setMessage(outcomeMessage(await shareImage(await renderShareCard(c), filename, c.title)));
    } catch {
      setMessage(t("share.imageFailed"));
    }
    setBusy(null);
  };

  const h = size === "lg" ? "h-12" : "h-11";
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex gap-2">
        <Button size="lg" className={cn(h, "min-w-0 flex-1 shrink")} onClick={onText} disabled={busy !== null}>
          {busy === "text" ? <LoaderCircleIcon aria-hidden className="motion-safe:animate-spin" /> : <Share2Icon aria-hidden />}
          {label ?? t("common.share")}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className={cn(h, "px-3.5 min-[400px]:px-4")}
          onClick={onImage}
          disabled={busy !== null}
          aria-label={t("share.asImage")}
        >
          {busy === "image" ? <LoaderCircleIcon aria-hidden className="motion-safe:animate-spin" /> : <ImageIcon aria-hidden />}
          <span className="max-[399px]:sr-only">{t("share.image")}</span>
        </Button>
      </div>
      <p role="status" aria-live="polite" className={cn("min-h-5 text-center text-sm text-muted-foreground", !message && "sr-only")}>
        {message}
      </p>
    </div>
  );
}

/** Botón cuadrado que comparte solo el texto; el aviso aparece como globito debajo. */
export function ShareIconButton({ text, label, className }: { text: () => string; label: string; className?: string }) {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <span className={cn("relative inline-flex", className)}>
      <Button
        size="icon"
        variant="outline"
        className="size-12 rounded-lg"
        aria-label={label}
        title={label}
        onClick={async () => setMessage(outcomeMessage(await shareText(text())))}
      >
        <Share2Icon aria-hidden />
      </Button>
      <span
        role="status"
        aria-live="polite"
        className={cn(
          "absolute top-full right-0 z-10 mt-1.5 w-max max-w-56 rounded-md bg-ink px-2.5 py-1.5 text-xs font-semibold text-paper shadow",
          !message && "sr-only",
        )}
      >
        {message}
      </span>
    </span>
  );
}
