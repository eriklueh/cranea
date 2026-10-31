"use client";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

/** Opciones excluyentes como botones segmentados. Son radios nativos: se recorren con las flechas. */
export function Choice<T extends string>({ name, legend, hint, value, options, onChange }: {
  name: string;
  legend: string;
  hint?: ReactNode;
  value: T | "";
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 font-semibold">{legend}</legend>
      <div className="flex gap-1 rounded-lg border-2 border-foreground/80 bg-card p-1">
        {options.map(({ value: v, label, icon: Icon }) => (
          <label key={v} className="relative flex min-h-11 min-w-0 flex-1 cursor-pointer">
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} className="peer sr-only" />
            <span className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-center text-sm leading-tight font-semibold text-muted-foreground transition-colors peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring hover:bg-accent peer-checked:hover:bg-ink">
              {Icon && <Icon className="size-4 shrink-0" />}
              {label}
            </span>
          </label>
        ))}
      </div>
      {hint && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>}
    </fieldset>
  );
}

/** Interruptor con su etiqueta; toda la fila se puede tocar. */
export function Toggle({ label, hint, checked, disabled, onChange }: {
  label: string;
  hint?: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full items-center justify-between gap-4 rounded-lg py-1 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
    >
      <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border-2 transition-colors",
          checked ? "border-ink bg-ink" : "border-pencil bg-card",
        )}
      >
        <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full transition-transform", checked ? "translate-x-5 bg-paper" : "bg-pencil")} />
      </span>
    </button>
  );
}

/**
 * Fila de la sección "Más": el botón o enlace que contiene (con su ícono a la derecha) se estira a toda la fila.
 * Si el componente de adentro no muestra nada (app ya instalada, avisos no configurados), la fila no aparece.
 */
export function ActionRow({ label, hint, children }: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-12 items-center gap-3 rounded-lg px-2 not-has-[button,a]:hidden hover:bg-accent has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 [&_:is(button,a)]:outline-none [&_:is(button,a)]:after:absolute [&_:is(button,a)]:after:inset-0 [&_:is(button,a)]:after:content-['']">
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
      </span>
      <span className="shrink-0 [&_:is(button,a)]:hover:bg-transparent [&_svg]:size-5">{children}</span>
    </div>
  );
}
