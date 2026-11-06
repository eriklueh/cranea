"use client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircleIcon, Share2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLocale, translator, useT, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { renderResultCard, type ResultCard } from "./share-image";
import { outcomeMessage, shareImageWithText, shareText } from "./share";

/**
 * "Compartir resultado" de un diario o un nivel: la imagen de la partida (sin la solución) y el texto.
 * La imagen se arma al abrir el resultado, así al tocar se comparte enseguida: algunos navegadores
 * (Safari) no abren la hoja de compartir si pasa demasiado tiempo desde el toque.
 */
export function ResultShareButton({ text, card, filename, className }: { text: string; card: ResultCard; filename: string; className?: string }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const image = useRef<Promise<Blob> | null>(null);
  const key = JSON.stringify(card);

  useEffect(() => {
    const p = renderResultCard(JSON.parse(key) as ResultCard);
    p.catch(() => undefined);
    image.current = p;
  }, [key]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(t);
  }, [message]);

  const onShare = async () => {
    setBusy(true);
    try {
      const blob = await (image.current ?? renderResultCard(card));
      setMessage(outcomeMessage(await shareImageWithText(blob, filename, text, card.game)));
    } catch {
      // Sin imagen (canvas bloqueado, poca memoria): por lo menos el texto.
      setMessage(outcomeMessage(await shareText(text)));
    }
    setBusy(false);
  };

  return (
    <div className={cn("grid gap-1", className)}>
      <Button variant="outline" onClick={onShare} disabled={busy}>
        {busy ? <LoaderCircleIcon aria-hidden className="motion-safe:animate-spin" /> : <Share2Icon aria-hidden />}
        {t("share.shareResult")}
      </Button>
      <p role="status" aria-live="polite" className={cn("text-center text-xs text-muted-foreground", !message && "sr-only")}>
        {message}
      </p>
    </div>
  );
}

/** "Diario #12" o "Nivel 2-3" ("Daily #12", "Level 2-3"), para la imagen. Sin `locale`, el activo. */
export const resultLabel = (
  mode: { kind: "daily"; number: number } | { kind: "level"; world: number; level: number },
  locale: Locale = getLocale(),
) => {
  const t = translator(locale);
  return mode.kind === "daily" ? t("share.dailyLabel", { n: mode.number }) : t("share.levelLabel", { world: mode.world, level: mode.level });
};

/** Marcas de intentos para la imagen: los fallados, el que salió y los que sobraron. */
export function attemptMarks(total: number, misses: number, won: boolean): ("miss" | "win" | "empty")[] {
  return Array.from({ length: total }, (_, i) => (i < misses ? "miss" : won && i === misses ? "win" : !won ? "miss" : "empty"));
}

export const SHARE_FOOTER = "cranea.app";
