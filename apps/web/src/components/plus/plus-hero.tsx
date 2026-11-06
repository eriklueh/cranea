"use client";
import Link from "next/link";
import { PartyPopperIcon } from "lucide-react";
import { PlusBadge, PlusPitch } from "@/components/plus/paywall";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { PLUS_BENEFITS, usePlus } from "@/lib/plus";

/** Encabezado de /plus: la propuesta, o la confirmación si ya hay Plus. */
export function PlusHero() {
  const { plus } = usePlus();
  const t = useT();
  if (!plus) return <PlusPitch reason="general" title="h1" more={false} />;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <PlusBadge />
        <h1 className="mt-2 font-display text-3xl leading-tight font-extrabold tracking-tight">Craneá Plus</h1>
        <p className="mt-1 flex items-center gap-2 font-semibold">
          <PartyPopperIcon aria-hidden className="size-4 text-ok" /> {t("plus.active")}
        </p>
      </div>
      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
        {PLUS_BENEFITS.map((b) => (
          <li key={b}>{t(b)}</li>
        ))}
      </ul>
      <Button asChild size="lg" className="h-12 w-full">
        <Link href="/">{t("plus.letsPlay")}</Link>
      </Button>
    </div>
  );
}
