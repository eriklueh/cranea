"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { DownloadIcon } from "lucide-react";
import { WORLDS } from "@cranea/core/cifra";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
      <span>Hay una nueva versión de Craneá.</span>
      <button type="button" className="min-h-11 font-bold underline underline-offset-4 focus-visible:outline-2" onClick={() => {
        reloading.current = true;
        waiting.postMessage({ type: "SKIP_WAITING" });
      }}>Actualizar</button>
    </div>}
    {children}
  </PwaContext.Provider>;
}

export function InstallApp() {
  const { installed, ready, failed, ios, prompt, install } = useContext(PwaContext);
  if (installed) return null;
  return <Dialog>
    <DialogTrigger asChild>
      <button type="button" aria-label="Instalar Craneá" title="Instalar Craneá" className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2">
        <DownloadIcon className="size-5" />
      </button>
    </DialogTrigger>
    <DialogContent>
      <img src="/icons/icon-192.png" width="72" height="72" className="rounded-2xl" alt="" />
      <DialogHeader>
        <DialogTitle>Craneá, a mano</DialogTitle>
        <DialogDescription>Agregala a tu inicio y jugá también sin conexión.</DialogDescription>
      </DialogHeader>
      {prompt ? <button type="button" onClick={() => void install()} className="min-h-12 rounded-lg bg-ink px-5 py-3 font-bold text-paper focus-visible:outline-2 focus-visible:outline-offset-2">Instalar Craneá</button>
        : <p className="text-sm leading-relaxed">{ios ? "En Safari, tocá Compartir y elegí Agregar a pantalla de inicio." : "Abrí el menú de tu navegador y elegí Instalar app o Agregar a pantalla de inicio, si está disponible."}</p>}
      <p role="status" className="text-sm text-muted-foreground">{ready ? `Los ${LEVEL_COUNT} niveles y el desafío diario ya están listos para jugar sin conexión.` : failed ? "No se completó la descarga. Volvé a abrir la app con conexión para reintentar." : process.env.NODE_ENV === "production" ? "Preparando los niveles para jugar sin conexión…" : "La descarga sin conexión se activa en la versión publicada."}</p>
    </DialogContent>
  </Dialog>;
}
