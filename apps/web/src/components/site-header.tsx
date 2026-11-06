"use client";
import Link from "next/link";
import { AccountButton } from "@/components/account-button";
import { SettingsSheet } from "@/components/settings/settings-sheet";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** El juego de la ruta, para la miga "Craneá / Cifra". `current` en su pantalla de inicio. */
export interface HeaderGame {
  name: string;
  href: string;
  current?: boolean;
}

export function SiteHeader({ game, children }: { game?: HeaderGame; children?: React.ReactNode }) {
  const t = useT();
  return (
    <header className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-2 pr-3 pl-16 max-sm:pl-6 sm:gap-3 sm:pr-4">
      <div className="flex min-w-0 items-center gap-3">
        {game ? (
          <nav aria-label={t("shell.youAreIn")} className="min-w-0">
            <ol className="flex min-w-0 items-center gap-1 font-display text-lg font-extrabold tracking-tight min-[400px]:gap-1.5 min-[400px]:text-xl">
              <li className="shrink-0">
                <Link href="/" className="rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                  Craneá
                </Link>
              </li>
              <li aria-hidden className="shrink-0 font-bold text-margin">/</li>
              <li className="min-w-0">
                <Link
                  href={game.href}
                  aria-current={game.current ? "page" : undefined}
                  className={cn(
                    "block truncate rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    !game.current && "underline-offset-4 hover:underline",
                  )}
                >
                  {game.name}
                </Link>
              </li>
            </ol>
          </nav>
        ) : (
          <Link href="/" className="font-display text-xl font-extrabold tracking-tight">
            Craneá
          </Link>
        )}
        {children}
      </div>
      {/* Cuenta y Ajustes; tema, instalar, aviso y estadísticas viven en la hoja de Ajustes. */}
      <div className="flex shrink-0 items-center gap-1">
        <AccountButton />
        <SettingsSheet />
      </div>
    </header>
  );
}
