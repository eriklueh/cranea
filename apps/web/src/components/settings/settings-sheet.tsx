"use client";
import Link from "next/link";
import { ChartColumnIcon, SettingsIcon, XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useState, type ReactNode } from "react";
import { DailyReminder } from "@/components/daily-reminder";
import { InstallApp } from "@/components/pwa-provider";
import { ThemeChoice } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ActionRow, Choice, Toggle } from "@/components/settings/controls";
import { TilePreview } from "@/components/settings/tile-preview";
import { canVibrate } from "@/lib/motion";
import { usePrefs } from "@/lib/prefs";
import { sound } from "@/lib/sound";

/** Botón del encabezado: abre Ajustes (tema, pantalla, sonido, instalar, aviso y estadísticas). En el celular es una hoja desde abajo. */
export function SettingsSheet() {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Ajustes" title="Ajustes" className="size-11 [&_svg:not([class*='size-'])]:size-5">
          <SettingsIcon />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl border-2 border-b-0 border-foreground/80 bg-card text-card-foreground shadow-[0_-4px_0_0_var(--shadow-ink)] duration-200 outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[min(44rem,90dvh)] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border-b-2 sm:shadow-[0_6px_0_0_var(--shadow-ink)] sm:data-[state=open]:animate-dialog-in data-[state=closed]:fade-out-0"
        >
          <div className="flex items-center justify-between gap-2 border-b-2 border-border py-2 pr-2 pl-5">
            <DialogPrimitive.Title className="font-display text-2xl font-bold">Ajustes</DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Cerrar" className="size-11 [&_svg:not([class*='size-'])]:size-5">
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-sm font-bold tracking-wide text-pencil uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Preferences() {
  const { sound: soundOn, vibration, motion, palette, text, set } = usePrefs();
  // Solo se monta con la hoja abierta (en el cliente), pero igual se evita leer `navigator` al renderizar en el servidor.
  const [vibrates, setVibrates] = useState(true);
  useEffect(() => setVibrates(canVibrate()), []);

  return (
    <>
      <Section title="Pantalla">
        <ThemeChoice />
        <Choice
          name="palette"
          legend="Colores de las pistas"
          value={palette}
          options={[{ value: "classic", label: "Clásicos" }, { value: "colorblind", label: "Daltonismo" }]}
          onChange={(palette) => set({ palette })}
          hint={palette === "colorblind" ? "Azul y naranja, con más contraste." : "Verde y amarillo."}
        />
        <TilePreview />
        <Choice
          name="text"
          legend="Tamaño de letra"
          value={text}
          options={[{ value: "normal", label: "Normal" }, { value: "large", label: "Grande" }]}
          onChange={(text) => set({ text })}
        />
        <Choice
          name="motion"
          legend="Animaciones"
          value={motion}
          options={[{ value: "system", label: "Según el sistema" }, { value: "reduced", label: "Reducidas" }]}
          onChange={(motion) => set({ motion })}
        />
      </Section>

      <Section title="Juego">
        <div className="space-y-2">
          <Toggle
            label="Sonido"
            hint="Toques, aciertos y errores, bajito."
            checked={soundOn}
            onChange={(on) => {
              set({ sound: on });
              if (on) sound("line", true);
            }}
          />
          <Toggle
            label="Vibración"
            hint={vibrates ? "Al ganar o al equivocarte." : "Este dispositivo no vibra."}
            checked={vibrates && vibration}
            disabled={!vibrates}
            onChange={(on) => {
              set({ vibration: on });
              if (on) navigator.vibrate?.(14);
            }}
          />
        </div>
      </Section>

      <Section title="Más">
        <div className="-mx-2 space-y-1">
          <ActionRow label="Estadísticas" hint="Rachas y resultados de cada juego.">
            <DialogPrimitive.Close asChild>
              <Button asChild variant="ghost" size="icon" className="size-11">
                <Link href="/estadisticas" aria-label="Estadísticas"><ChartColumnIcon /></Link>
              </Button>
            </DialogPrimitive.Close>
          </ActionRow>
          <ActionRow label="Instalar app" hint="Jugá sin conexión desde tu inicio.">
            <InstallApp />
          </ActionRow>
          <ActionRow label="Recordatorio" hint="Un aviso por día para el desafío.">
            <DailyReminder />
          </ActionRow>
        </div>
      </Section>
    </>
  );
}
