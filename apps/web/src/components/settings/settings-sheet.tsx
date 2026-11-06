"use client";
import Link from "next/link";
import { ChartColumnIcon, SettingsIcon, ShieldIcon, SparklesIcon, XIcon } from "lucide-react";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import { useClerk } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { accountsEnabled } from "@/components/account-provider";
import { LEGAL_PATHS } from "@/components/legal-page";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useState, type ReactNode } from "react";
import { DailyReminder } from "@/components/daily-reminder";
import { InstallApp } from "@/components/pwa-provider";
import { ThemeChoice } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ActionRow, Choice, Toggle } from "@/components/settings/controls";
import { PlusBadge } from "@/components/plus/paywall";
import { TilePreview } from "@/components/settings/tile-preview";
import { canVibrate } from "@/lib/motion";
import { PLUS_ENABLED, usePlus } from "@/lib/plus";
import { usePrefs } from "@/lib/prefs";
import { useLocale, useT } from "@/lib/i18n";
import { sound } from "@/lib/sound";

/** Botón del encabezado: abre Ajustes (tema, pantalla, sonido, instalar, aviso y estadísticas). En el celular es una hoja desde abajo. */
export function SettingsSheet() {
  const t = useT();
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("common.settings")} title={t("common.settings")} className="size-11 [&_svg:not([class*='size-'])]:size-5">
          <SettingsIcon />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:anim-fade data-[state=closed]:anim-fade-out" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl border-2 border-b-0 border-foreground/80 bg-card text-card-foreground shadow-[0_-4px_0_0_var(--shadow-ink)] outline-none data-[state=open]:anim-sheet-in data-[state=closed]:anim-sheet-out sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[min(44rem,90dvh)] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border-b-2 sm:shadow-[0_6px_0_0_var(--shadow-ink)] sm:data-[state=open]:anim-dialog-in sm:data-[state=closed]:anim-dialog-out"
        >
          <div className="flex items-center justify-between gap-2 border-b-2 border-border py-2 pr-2 pl-5">
            <div className="flex items-center gap-2">
              <DialogPrimitive.Title className="font-display text-2xl font-bold">{t("common.settings")}</DialogPrimitive.Title>
              <PlusState badge />
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label={t("common.close")} className="size-11 [&_svg:not([class*='size-'])]:size-5">
                <XIcon />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <div className="space-y-6 overflow-y-auto overscroll-contain px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <Preferences />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Craneá Plus: pastilla junto al título si está activo, y una fila que lleva a /plus. */
function PlusState({ badge = false }: { badge?: boolean }) {
  const { plus } = usePlus();
  const t = useT();
  if (!PLUS_ENABLED) return null;
  if (badge) return plus ? <PlusBadge /> : null;
  return (
    <ActionRow label="Craneá Plus" hint={plus ? t("shell.plusActive") : t("shell.plusHint")}>
      <DialogPrimitive.Close asChild>
        <Button asChild variant="ghost" size="icon" className="size-11">
          <Link href="/plus" aria-label="Craneá Plus"><SparklesIcon /></Link>
        </Button>
      </DialogPrimitive.Close>
    </ActionRow>
  );
}

/** Solo para cuentas de administración: regalar Plus desde /admin. */
function AdminRow() {
  const { isAuthenticated } = useConvexAuth();
  const isAdmin = useQuery(api.admin.isAdmin, isAuthenticated ? {} : "skip");
  const t = useT();
  if (!isAdmin) return null;
  return (
    <ActionRow label={t("shell.admin")} hint={t("shell.adminHint")}>
      <DialogPrimitive.Close asChild>
        <Button asChild variant="ghost" size="icon" className="size-11">
          <Link href="/admin" aria-label={t("shell.admin")}><ShieldIcon /></Link>
        </Button>
      </DialogPrimitive.Close>
    </ActionRow>
  );
}

/** Borrar la cuenta y todos sus datos (lo exigen las tiendas también en la web). */
function DeleteAccountRow() {
  const { isAuthenticated } = useConvexAuth();
  const deleteMyAccount = useAction(api.account.deleteMyAccount);
  const { signOut } = useClerk();
  const [busy, setBusy] = useState(false);
  const t = useT();
  if (!isAuthenticated) return null;
  const remove = async () => {
    if (!confirm(t("shell.deleteConfirm"))) return;
    setBusy(true);
    try {
      await deleteMyAccount({});
      await signOut();
    } catch {
      alert(t("shell.deleteFailed"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <ActionRow label={t("shell.deleteAccount")} hint={t("shell.deleteHint")}>
      <Button variant="ghost" className="min-h-11 text-destructive" disabled={busy} onClick={remove}>
        {busy ? t("shell.deleting") : t("shell.delete")}
      </Button>
    </ActionRow>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-sm font-bold tracking-wide text-pencil uppercase">{title}</h2>
      {children}
    </section>
  );
}

/** Idioma: Automático (el del navegador), Español o English. Cada opción se nombra en su idioma. */
function LanguageChoice() {
  const t = useT();
  const locale = useLocale();
  const language = usePrefs((s) => s.language);
  const set = usePrefs((s) => s.set);
  return (
    <Choice
      name="language"
      legend={t("common.language")}
      value={language}
      options={[
        { value: "auto", label: t("common.languageAuto") },
        { value: "es", label: t("common.languageEs") },
        { value: "en", label: t("common.languageEn") },
      ]}
      onChange={(language) => set({ language })}
      hint={language === "auto" ? `${t("common.languageAutoHint")} (${locale === "en" ? t("common.languageEn") : t("common.languageEs")})` : undefined}
    />
  );
}

function Preferences() {
  const { sound: soundOn, vibration, motion, palette, text, set } = usePrefs();
  const t = useT();
  const legal = LEGAL_PATHS[useLocale()];
  // Solo se monta con la hoja abierta (en el cliente), pero igual se evita leer `navigator` al renderizar en el servidor.
  const [vibrates, setVibrates] = useState(true);
  useEffect(() => setVibrates(canVibrate()), []);

  return (
    <>
      <Section title={t("shell.sectionDisplay")}>
        <LanguageChoice />
        <ThemeChoice />
        <Choice
          name="palette"
          legend={t("shell.palette")}
          value={palette}
          options={[{ value: "classic", label: t("shell.paletteClassic") }, { value: "colorblind", label: t("shell.paletteColorblind") }]}
          onChange={(palette) => set({ palette })}
          hint={palette === "colorblind" ? t("shell.paletteColorblindHint") : t("shell.paletteClassicHint")}
        />
        <TilePreview />
        <Choice
          name="text"
          legend={t("shell.textSize")}
          value={text}
          options={[{ value: "normal", label: t("shell.textNormal") }, { value: "large", label: t("shell.textLarge") }]}
          onChange={(text) => set({ text })}
        />
        <Choice
          name="motion"
          legend={t("shell.motion")}
          value={motion}
          options={[{ value: "system", label: t("shell.motionSystem") }, { value: "reduced", label: t("shell.motionReduced") }]}
          onChange={(motion) => set({ motion })}
        />
      </Section>

      <Section title={t("shell.sectionGame")}>
        <div className="space-y-2">
          <Toggle
            label={t("shell.sound")}
            hint={t("shell.soundHint")}
            checked={soundOn}
            onChange={(on) => {
              set({ sound: on });
              if (on) sound("line", true);
            }}
          />
          <Toggle
            label={t("shell.vibration")}
            hint={vibrates ? t("shell.vibrationHint") : t("shell.vibrationNone")}
            checked={vibrates && vibration}
            disabled={!vibrates}
            onChange={(on) => {
              set({ vibration: on });
              if (on) navigator.vibrate?.(14);
            }}
          />
        </div>
      </Section>

      <Section title={t("shell.sectionMore")}>
        <div className="-mx-2 space-y-1">
          <PlusState />
          {accountsEnabled && <AdminRow />}
          {accountsEnabled && <DeleteAccountRow />}
          <ActionRow label={t("common.stats")} hint={t("shell.statsHint")}>
            <DialogPrimitive.Close asChild>
              <Button asChild variant="ghost" size="icon" className="size-11">
                <Link href="/estadisticas" aria-label={t("common.stats")}><ChartColumnIcon /></Link>
              </Button>
            </DialogPrimitive.Close>
          </ActionRow>
          <ActionRow label={t("shell.installApp")} hint={t("shell.installAppHint")}>
            <InstallApp />
          </ActionRow>
          <ActionRow label={t("shell.reminder")} hint={t("shell.reminderHint")}>
            <DailyReminder />
          </ActionRow>
        </div>
        <p className="flex gap-4 text-sm text-muted-foreground">
          <DialogPrimitive.Close asChild>
            <Link href={legal.privacy} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">{t("common.privacy")}</Link>
          </DialogPrimitive.Close>
          <DialogPrimitive.Close asChild>
            <Link href={legal.terms} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">{t("common.terms")}</Link>
          </DialogPrimitive.Close>
        </p>
      </Section>
    </>
  );
}
