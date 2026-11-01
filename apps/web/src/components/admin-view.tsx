"use client";

import { useState } from "react";
import { SignInButton } from "@clerk/nextjs";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { accountsEnabled } from "@/components/account-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DURATIONS = [
  { label: "1 mes", days: 30 },
  { label: "3 meses", days: 90 },
  { label: "1 año", days: 365 },
  { label: "Sin vencimiento", days: null },
] as const;

const formatDate = (ms: number) => new Date(ms).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

/** Regalar Craneá Plus por email de la cuenta. Solo para administradores (ADMIN_EMAILS en Convex). */
export function AdminView() {
  if (!accountsEnabled) return <p className="text-muted-foreground">Las cuentas no están disponibles en esta versión.</p>;
  return <Admin />;
}

function Admin() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const isAdmin = useQuery(api.admin.isAdmin, isAuthenticated ? {} : "skip");
  if (isLoading || (isAuthenticated && isAdmin === undefined)) return <p className="text-muted-foreground">Cargando…</p>;
  if (!isAuthenticated) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground">Iniciá sesión con una cuenta de administración.</p>
        <SignInButton mode="modal"><Button className="w-full sm:w-auto">Iniciar sesión</Button></SignInButton>
      </div>
    );
  }
  if (!isAdmin) return <p className="text-muted-foreground">Esta cuenta no tiene acceso.</p>;
  return (
    <div className="space-y-8">
      <GrantForm />
      <Grants />
    </div>
  );
}

function GrantForm() {
  const setPlus = useAction(api.admin.setPlusByEmail);
  const [email, setEmail] = useState("");
  const [days, setDays] = useState<number | null>(30);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await setPlus({ email, plus: true, days });
      setMsg(r.ok ? { ok: true, text: `Listo: ${email.trim()} tiene Plus.` } : { ok: false, text: r.error });
      if (r.ok) setEmail("");
    } catch {
      setMsg({ ok: false, text: "No se pudo guardar. Probá de nuevo." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border-2 border-ink bg-card p-4 shadow-[0_4px_0_0_var(--shadow-ink)] sm:p-5">
      <h2 className="font-display text-xl font-extrabold">Regalar Plus</h2>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">Email de la cuenta</span>
        <input
          type="email"
          required
          inputMode="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@gmail.com"
          className="h-12 w-full rounded-md border-2 border-foreground/80 bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </label>
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-semibold">Duración</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DURATIONS.map((d) => (
            <button
              key={d.label}
              type="button"
              aria-pressed={days === d.days}
              onClick={() => setDays(d.days)}
              className={cn(
                "min-h-11 rounded-md border-2 px-3 text-sm font-semibold transition-colors",
                days === d.days ? "border-ink bg-ink text-paper" : "border-border hover:border-ink",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </fieldset>
      <Button type="submit" size="lg" className="h-12 w-full" disabled={busy || !email.trim()}>
        {busy ? "Guardando…" : "Dar Plus"}
      </Button>
      {msg && <p role="status" className={cn("text-sm", msg.ok ? "text-ok" : "text-destructive")}>{msg.text}</p>}
      <p className="text-xs text-muted-foreground">La persona tiene que haber iniciado sesión en Craneá al menos una vez. Se activa al instante en la app y en la web.</p>
    </form>
  );
}

function Grants() {
  const rows = useQuery(api.admin.grants);
  const setPlus = useAction(api.admin.setPlusByEmail);
  const [busy, setBusy] = useState<string | null>(null);
  if (!rows) return null;

  const revoke = async (email: string) => {
    if (!confirm(`¿Sacarle Plus a ${email}?`)) return;
    setBusy(email);
    try {
      await setPlus({ email, plus: false, days: null });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-extrabold">Regalados</h2>
      {!rows.length ? (
        <p className="text-muted-foreground">Todavía no regalaste Plus.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border-2 border-border">
          {rows.map((r) => (
            <li key={r.subject} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{r.email}</p>
                <p className="text-sm text-muted-foreground">
                  {!r.active ? "Sin Plus" : r.expiresAt ? `Hasta el ${formatDate(r.expiresAt)}` : "Sin vencimiento"}
                </p>
              </div>
              {r.active && (
                <Button variant="outline" size="sm" className="min-h-11" disabled={busy === r.email} onClick={() => revoke(r.email)}>
                  Sacar
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
