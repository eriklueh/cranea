"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useGameAvailable, useT } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";

/**
 * Palabra es un juego en castellano: en inglés no aparece en ningún listado, pero sus rutas siguen
 * andando y muestran este aviso con un atajo para pasar a español (el progreso no se toca).
 */
export function SpanishOnly({ gameId, children }: { gameId: string; children: ReactNode }) {
  const available = useGameAvailable(gameId);
  const t = useT();
  const set = usePrefs((s) => s.set);
  if (available) return children;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-col items-center px-6 pt-16 pb-16 text-center">
        <h1 className="font-display text-2xl font-extrabold text-balance">{t("games.spanishOnlyTitle")}</h1>
        <p className="mt-2 text-muted-foreground text-pretty">{t("games.spanishOnlyBody")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button size="lg" onClick={() => set({ language: "es" })}>{t("games.spanishOnlyAction")}</Button>
          <Button asChild size="lg" variant="outline"><Link href="/">{t("common.goHome")}</Link></Button>
        </div>
      </main>
    </>
  );
}
