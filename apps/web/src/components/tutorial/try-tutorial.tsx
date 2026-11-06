"use client";
import Link from "next/link";
import { ChevronRightIcon, GraduationCapIcon } from "lucide-react";
import { useT } from "@/lib/i18n";

/** Acceso al tutorial desde "Cómo se juega": jugarlo explica más rápido que leerlo. */
export function TryTutorial({ href }: { href: string }) {
  const t = useT();
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center gap-3 rounded-xl border-2 border-ink bg-card p-4 shadow-[0_3px_0_0_var(--shadow-ink)] transition-[translate,background-color] duration-(--dur-fast) outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 active:translate-y-px"
    >
      <GraduationCapIcon aria-hidden className="size-6 shrink-0 text-ring" />
      <span className="min-w-0 flex-1 leading-snug">
        <span className="block font-display text-lg font-bold">{t("tutorialUi.tryTitle")}</span>
        <span className="block text-sm text-muted-foreground">{t("tutorialUi.tryBody")}</span>
      </span>
      <ChevronRightIcon aria-hidden className="size-5 shrink-0" />
    </Link>
  );
}
