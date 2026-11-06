"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { DownloadIcon } from "lucide-react";
import { WORLDS } from "@cranea/core/cifra";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
const LEVEL_COUNT = WORLDS.reduce((total, world) => total + world.levels, 0);
const PwaContext = createContext<{
  installed: boolean; ready: boolean; failed: boolean; ios: boolean;
  prompt: InstallPrompt | null; install: () => Promise<void>;
}>({ installed: true, ready: false, failed: false, ios: false, prompt: null, install: async () => {} });

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [installed, setInstalled] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ios, setIos] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const reloading = useRef(false);
  const t = useT();

  useEffect(() => {
    const standalone = matchMedia("(display-mode: standalone)");
    const syncInstalled = () => setInstalled(standalone.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone);
    syncInstalled();
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    standalone.addEventListener("change", syncInstalled);
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const didInstall = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", didInstall);
    const controllerChanged = () => {
      setReady(true);
      if (reloading.current) location.reload();
    };
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    const checkUpdate = () => { if (document.visibilityState === "visible") void registration?.update().catch(() => {}); };
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", controllerChanged);
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then((reg) => {
        if (disposed) return;
        registration = reg;
        if (reg.active) setReady(true);
        if (reg.waiting) setWaiting(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          worker?.addEventListener("statechange", () => {
            if (disposed) return;
            if (worker.state === "installed" && navigator.serviceWorker.controller) setWaiting(worker);
            if (worker.state === "redundant" && !reg.active) setFailed(true);
          });
        });
      }).catch(() => { if (!disposed) setFailed(true); });
      void navigator.serviceWorker.ready.then(() => { if (!disposed) setReady(true); });
      document.addEventListener("visibilitychange", checkUpdate);
    }
    return () => {
      disposed = true;
      standalone.removeEventListener("change", syncInstalled);
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", didInstall);
      navigator.serviceWorker?.removeEventListener("controllerchange", controllerChanged);
      document.removeEventListener("visibilitychange", checkUpdate);
    };
  }, []);

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    setPrompt(null);
    if (choice.outcome === "accepted") setInstalled(true);
  };

  return <PwaContext.Provider value={{ installed, ready, failed, ios, prompt, install }}>
    {waiting && <div role="status" className="flex flex-wrap items-center justify-center gap-3 bg-ink px-4 py-2 text-sm text-paper">
      <span>{t("shell.updateAvailable")}</span>
      <button type="button" className="min-h-11 font-bold underline underline-offset-4 focus-visible:outline-2" onClick={() => {
        reloading.current = true;
        waiting.postMessage({ type: "SKIP_WAITING" });
      }}>{t("shell.update")}</button>
    </div>}
    {children}
  </PwaContext.Provider>;
}

export const usePwa = () => useContext(PwaContext);

export function InstallApp() {
  const { installed, ready, failed, ios, prompt, install } = usePwa();
  const t = useT();
  if (installed) return null;
  return <Dialog>
    <DialogTrigger asChild>
      <button type="button" aria-label={t("shell.installCranea")} title={t("shell.installCranea")} className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2">
        <DownloadIcon className="size-5" />
      </button>
    </DialogTrigger>
    <DialogContent>
      <img src="/icons/icon-192.png" width="72" height="72" className="rounded-2xl" alt="" />
      <DialogHeader>
        <DialogTitle>{t("shell.installTitle")}</DialogTitle>
        <DialogDescription>{t("shell.installBody")}</DialogDescription>
      </DialogHeader>
      {prompt ? <button type="button" onClick={() => void install()} className="min-h-12 rounded-lg bg-ink px-5 py-3 font-bold text-paper focus-visible:outline-2 focus-visible:outline-offset-2">{t("shell.installCranea")}</button>
        : <p className="text-sm leading-relaxed">{ios ? t("shell.installIos") : t("shell.installOther")}</p>}
      <p role="status" className="text-sm text-muted-foreground">{ready ? t("shell.offlineReady", { count: LEVEL_COUNT }) : failed ? t("shell.offlineFailed") : process.env.NODE_ENV === "production" ? t("shell.offlinePreparing") : t("shell.offlineDev")}</p>
    </DialogContent>
  </Dialog>;
}
