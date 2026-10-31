"use client";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Choice } from "@/components/settings/controls";

const OPTIONS = [
  { value: "light", label: "Cuaderno", icon: SunIcon },
  { value: "dark", label: "Pizarrón", icon: MoonIcon },
  { value: "system", label: "Sistema", icon: MonitorIcon },
];

/** Tema: cuaderno (claro), pizarrón (oscuro) o el del sistema. */
export function ThemeChoice() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <Choice name="theme" legend="Tema" value={mounted ? theme ?? "system" : ""} options={OPTIONS} onChange={setTheme} />;
}
