"use client";
import Link from "next/link";
import { PartyPopperIcon } from "lucide-react";
import { PlusBadge, PlusPitch } from "@/components/plus/paywall";
import { Button } from "@/components/ui/button";
import { PLUS_BENEFITS, usePlus } from "@/lib/plus";

/** Encabezado de /plus: la propuesta, o la confirmación si ya hay Plus. */
export function PlusHero() {
  const { plus } = usePlus();
  if (!plus) return <PlusPitch reason="general" title="h1" more={false} />;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <PlusBadge />
        <h1 className="mt-2 font-display text-3xl leading-tight font-extrabold tracking-tight">Craneá Plus</h1>
        <p className="mt-1 flex items-center gap-2 font-semibold">
          <PartyPopperIcon aria-hidden className="size-4 text-ok" /> Ya lo tenés activo. ¡Gracias por bancar Craneá!
        </p>
      </div>
      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
        {PLUS_BENEFITS.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <Button asChild size="lg" className="h-12 w-full">
        <Link href="/">A jugar</Link>
      </Button>
    </div>
  );
}
