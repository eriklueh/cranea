"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { BellIcon, BellRingIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { accountsEnabled } from "@/components/account-provider";
import { usePwa } from "@/components/pwa-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getLocale, useIntlLocale, useLocale, useT } from "@/lib/i18n";

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const STORAGE = "cranea-reminder";
const DEFAULT_TIME = "10:00";

type Support = "checking" | "ok" | "dev" | "ios" | "unsupported" | "denied";

/** Última combinación de cuenta, idioma y suscripción que ya se le informó al servidor en esta sesión. */
let syncedFor: string | null = null;

const toMinutes = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };
const savedTime = () => { try { return localStorage.getItem(STORAGE) || DEFAULT_TIME; } catch { return DEFAULT_TIME; } };

function applicationServerKey(base64: string) {
  const raw = atob((base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** "10:00" en español; "10:00 AM" en inglés. */
const showTime = (time: string, intl: string) => {
  if (intl === "es-AR") return time;
  const [h, m] = time.split(":").map(Number);
  return new Intl.DateTimeFormat(intl, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(Date.UTC(2000, 0, 1, h, m));
};

const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const registration = async () => (await navigator.serviceWorker.getRegistration("/")) ?? null;

/** Aviso diario opcional. Sin Convex o sin clave VAPID no se muestra. */
export function DailyReminder() {
  if (!accountsEnabled || !VAPID_KEY) return null;
  return <Reminder vapidKey={VAPID_KEY} />;
}

function Reminder({ vapidKey }: { vapidKey: string }) {
  const { ios, installed } = usePwa();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const subscribe = useMutation(api.reminders.subscribe);
  const unsubscribe = useMutation(api.reminders.unsubscribe);
  const [support, setSupport] = useState<Support>("checking");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [time, setTime] = useState(DEFAULT_TIME);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const t = useT();
  // El aviso llega en el idioma activo: al cambiarlo se vuelve a guardar la suscripción.
  const locale = useLocale();
  const intl = useIntlLocale();

  const save = (sub: PushSubscription, at: string) => {
    const json = sub.toJSON();
    return subscribe({
      subscription: { endpoint: sub.endpoint, keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" } },
      minutes: toMinutes(at),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
      offset: -new Date().getTimezoneOffset(),
      locale: getLocale(),
    });
  };

  useEffect(() => {
    setTime(savedTime());
    if (process.env.NODE_ENV !== "production") return setSupport("dev");
    if (!pushSupported()) return setSupport(ios && !installed ? "ios" : "unsupported");
    if (Notification.permission === "denied") return setSupport("denied");
    setSupport("ok");
    void registration().then((reg) => reg?.pushManager.getSubscription()).then((sub) => setSubscription(sub ?? null)).catch(() => {});
  }, [ios, installed]);

  // Mantiene el servidor al día: asocia la cuenta al iniciar sesión y recupera suscripciones perdidas.
  useEffect(() => {
    if (!subscription || isLoading) return;
    const key = `${isAuthenticated}:${locale}:${subscription.endpoint}`;
    if (syncedFor === key) return;
    syncedFor = key;
    save(subscription, savedTime()).catch(() => { syncedFor = null; });
  }, [subscription, isLoading, isAuthenticated, locale]);

  const enable = async () => {
    setBusy(true);
    setError(false);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        if (permission === "denied") setSupport("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription() ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(vapidKey) });
      await save(sub, time);
      syncedFor = `${isAuthenticated}:${getLocale()}:${sub.endpoint}`;
      localStorage.setItem(STORAGE, time);
      setSubscription(sub);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!subscription) return;
    setBusy(true);
    setError(false);
    try {
      await unsubscribe({ endpoint: subscription.endpoint });
      await subscription.unsubscribe();
      syncedFor = null;
      setSubscription(null);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const changeTime = async (next: string) => {
    if (!next) return;
    setTime(next);
    if (!subscription) return;
    setError(false);
    try {
      await save(subscription, next);
      localStorage.setItem(STORAGE, next);
    } catch {
      setError(true);
    }
  };

  const on = !!subscription;
  const shown = showTime(time, intl);
  const label = on ? t("shell.reminderAt", { time: shown }) : t("shell.reminderTitle");
  return <Dialog>
    <DialogTrigger asChild>
      <Button variant="ghost" size="icon" aria-label={label} title={label}>
        {on ? <BellRingIcon /> : <BellIcon />}
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t("shell.reminderTitle")}</DialogTitle>
        <DialogDescription>{t("shell.reminderBody")}</DialogDescription>
      </DialogHeader>
      {support === "ok" ? <>
        <label className="flex items-center justify-between gap-4 font-semibold">
          {t("shell.reminderTime")}
          <input type="time" value={time} step={900} disabled={busy} onChange={(e) => void changeTime(e.target.value)}
            className="min-h-11 rounded-lg border-2 border-foreground/80 bg-card px-3 font-sans tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2" />
        </label>
        <Button size="lg" variant={on ? "outline" : "default"} disabled={busy} onClick={() => void (on ? disable() : enable())}>
          {on ? t("shell.reminderTurnOff") : t("shell.reminderTurnOn")}
        </Button>
        <p role="status" className="text-sm text-muted-foreground">
          {error ? t("shell.reminderError")
            : on ? `${t("shell.reminderEveryDay", { time: shown })}${isAuthenticated ? t("shell.reminderSkipPlayed") : ""}`
            : t("shell.reminderCanStop")}
        </p>
      </> : <p className="text-sm leading-relaxed">{{
        checking: t("shell.reminderChecking"),
        dev: t("shell.reminderDev"),
        ios: t("shell.reminderIos"),
        unsupported: t("shell.reminderUnsupported"),
        denied: t("shell.reminderDenied"),
      }[support]}</p>}
    </DialogContent>
  </Dialog>;
}
