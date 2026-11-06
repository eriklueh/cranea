"use client";
import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";
import { CheckIcon, ChevronRightIcon, SparklesIcon, XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useState, type ReactNode } from "react";
import { create } from "zustand";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { APP_STORE_URL, FREE_LEVELS, PLAY_STORE_URL, PLUS_BENEFITS, usePlus } from "@/lib/plus";
import { cn } from "@/lib/utils";

/** Igual que `accountsEnabled`, sin importar el proveedor (que importa este módulo). */
const accounts = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

/** Qué se quiso hacer: cambia solo la primera línea. */
export type PaywallReason = "levels" | "archive" | "hints" | "general";

const REASON = {
  levels: "plus.reasonLevels",
  archive: "plus.reasonArchive",
  hints: "plus.reasonHints",
  general: "plus.reasonGeneral",
} as const satisfies Record<PaywallReason, string>;

const usePaywall = create<{ reason: PaywallReason | null }>(() => ({ reason: null }));

/** Abre la hoja de Craneá Plus (montada una vez en el layout). */
export const openPaywall = (reason: PaywallReason = "general") => usePaywall.setState({ reason });
const closePaywall = () => usePaywall.setState({ reason: null });

/** Pastilla "Plus". */
export function PlusBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-clue-present-bg px-2 py-0.5 text-xs font-bold text-clue-present", className)}>
      <SparklesIcon aria-hidden className="size-3" /> Plus
    </span>
  );
}

/** La tienda que corresponde a este dispositivo (o la que haya). */
function storeLinks() {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const ios = /iPhone|iPad|iPod|Macintosh.*Mobile/.test(ua);
  const android = /Android/.test(ua);
  const stores = [
    { name: "App Store", url: APP_STORE_URL, mine: ios },
    { name: "Google Play", url: PLAY_STORE_URL, mine: android },
  ].filter((s) => s.url);
  const primary = stores.find((s) => s.mine) ?? (stores.length === 1 ? stores[0] : null);
  return { primary, stores };
}

function StoreButtons({ onLeave }: { onLeave?: () => void }) {
  // Se elige en el cliente: depende del navegador.
  const [links, setLinks] = useState<ReturnType<typeof storeLinks> | null>(null);
  const t = useT();
  useEffect(() => setLinks(storeLinks()), []);
  if (!links) return <div aria-hidden className="h-12" />;
  const { primary, stores } = links;

  if (!stores.length) {
    return (
      <Button asChild size="lg" className="h-12 w-full text-base">
        <Link href="/plus#app" onClick={onLeave}>{t("plus.downloadApp")}</Link>
      </Button>
    );
  }
  return (
    <div className="grid gap-2">
      {primary ? (
        <Button asChild size="lg" className="h-12 w-full text-base">
          <a href={primary.url} target="_blank" rel="noopener noreferrer">{t("plus.getInApp")}</a>
        </Button>
      ) : (
        <p className="text-center text-sm font-semibold">{t("plus.getInApp")}</p>
      )}
      {(!primary || stores.length > 1) && (
        <div className="grid grid-cols-2 gap-2">
          {stores.map((s) => (
            <Button key={s.name} asChild size="lg" variant={primary ? "outline" : "default"} className="h-12">
              <a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

/** "Ya tengo Plus": sin sesión, a iniciarla; con sesión y sin Plus, se explica por qué no aparece. */
function HavePlus({ onLeave }: { onLeave?: () => void }) {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const [asked, setAsked] = useState(false);
  const t = useT();
  if (!isLoaded) return <div aria-hidden className="h-12" />;
  if (!isSignedIn) {
    return (
      <Button
        size="lg"
        variant="outline"
        className="h-12 w-full"
        onClick={() => {
          onLeave?.();
          clerk.openSignIn();
        }}
      >
        {t("plus.havePlus")}
      </Button>
    );
  }
  if (!asked) {
    return (
      <Button size="lg" variant="outline" className="h-12 w-full" onClick={() => setAsked(true)}>
        {t("plus.havePlus")}
      </Button>
    );
  }
  return (
    <p role="status" className="rounded-lg bg-muted px-3 py-2.5 text-sm">
      {t("plus.notOnAccount")}
    </p>
  );
}

/**
 * Qué es Plus y cómo conseguirlo. Lo usan la hoja, los niveles bloqueados y el archivo.
 * `onLeave` cierra la hoja antes de navegar o abrir el inicio de sesión.
 */
export function PlusPitch({ reason, title: Title = "h2", onLeave, more = true }: {
  reason: PaywallReason;
  title?: "h1" | "h2" | ((props: { className: string; children: ReactNode }) => ReactNode);
  onLeave?: () => void;
  /** Enlace a /plus (no hace falta en /plus). */
  more?: boolean;
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <PlusBadge />
        <Title className="mt-2 font-display text-3xl leading-tight font-extrabold tracking-tight">Craneá Plus</Title>
        <p className="mt-1 text-muted-foreground">{t(REASON[reason], { count: FREE_LEVELS })}</p>
      </div>
      <ul className="grid gap-2" aria-label={t("plus.includes")}>
        {PLUS_BENEFITS.map((b) => (
          <li key={b} className="flex items-start gap-2.5">
            <span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-clue-exact-bg text-ok">
              <CheckIcon className="size-3.5" strokeWidth={3} />
            </span>
            <span className="font-semibold">{t(b)}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        <span className="font-display text-lg font-extrabold text-foreground">{t("plus.price").replace(/^./, (c) => c.toUpperCase())}</span>
        {t("plus.cancelAnytime")}
      </p>
      <div className="grid gap-2">
        <StoreButtons onLeave={onLeave} />
        {accounts && <HavePlus onLeave={onLeave} />}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("plus.accountNote")}
        {more && (
          <>
            {" "}
            <Link href="/plus" onClick={onLeave} className="font-semibold text-foreground underline decoration-border decoration-2 underline-offset-4 hover:decoration-current">
              {t("plus.more")}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

/** Hoja desde abajo en el celular, diálogo en pantallas grandes. Se abre con `openPaywall`. */
export function PaywallSheet() {
  const reason = usePaywall((s) => s.reason);
  // Conserva el texto mientras se cierra.
  const [shown, setShown] = useState<PaywallReason>("general");
  useEffect(() => {
    if (reason) setShown(reason);
  }, [reason]);
  const { plus } = usePlus();
  const t = useT();
  // Si Plus llega con la hoja abierta (inició sesión), se cierra sola.
  useEffect(() => {
    if (plus) closePaywall();
  }, [plus]);

  return (
    <DialogPrimitive.Root open={reason !== null} onOpenChange={(o) => !o && closePaywall()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:anim-fade data-[state=closed]:anim-fade-out" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl border-2 border-b-0 border-foreground/80 bg-card text-card-foreground shadow-[0_-4px_0_0_var(--shadow-ink)] outline-none data-[state=open]:anim-sheet-in data-[state=closed]:anim-sheet-out sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[min(44rem,90dvh)] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border-b-2 sm:shadow-[0_6px_0_0_var(--shadow-ink)] sm:data-[state=open]:anim-dialog-in sm:data-[state=closed]:anim-dialog-out"
        >
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" size="icon" aria-label={t("common.close")} className="absolute top-2 right-2 size-11 [&_svg:not([class*='size-'])]:size-5">
              <XIcon />
            </Button>
          </DialogPrimitive.Close>
          <div className="overflow-y-auto overscroll-contain px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <PlusPitch
              reason={shown}
              onLeave={closePaywall}
              title={({ className, children }) => <DialogPrimitive.Title className={className}>{children}</DialogPrimitive.Title>}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * Lo que es de Plus (un nivel, un diario anterior): sin Plus muestra la propuesta en su lugar.
 * Hasta saberlo no monta el contenido, para no empezar (ni guardar) una partida.
 */
export function PlusGate({ reason, daily, free = false, children }: {
  reason: PaywallReason;
  /** El diario de hoy del juego, que es gratis. */
  daily?: string;
  /** Uno de los niveles gratis (`isFreeLevel`): se juega sin Plus. */
  free?: boolean;
  children: ReactNode;
}) {
  const { plus, ready } = usePlus();
  const t = useT();
  if (free) return children;
  if (!ready) return <div className="min-h-[70svh]" aria-busy />;
  if (plus) return children;
  return (
    <main className="mx-auto w-full max-w-md px-5 pt-2 pb-16">
      <section className="rounded-xl border-2 border-ink bg-card p-5 shadow-[0_4px_0_0_var(--shadow-ink)]">
        <PlusPitch reason={reason} title="h1" />
      </section>
      {daily && (
        <Link
          href={daily}
          className="group mt-4 flex min-h-12 items-center justify-between gap-3 rounded-xl border-2 border-border bg-card px-4 py-2 font-semibold outline-none hover:border-ink focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {t("plus.playToday")}
          <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-pencil transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </main>
  );
}
