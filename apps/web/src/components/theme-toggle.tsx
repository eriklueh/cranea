"use client";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Choice } from "@/components/settings/controls";
import { useT } from "@/lib/i18n";

/** Tema: cuaderno (claro), pizarrón (oscuro) o el del sistema. */
export function ThemeChoice() {
  const { theme, setTheme } = useTheme();
  const t = useT();
  const options = [
    { value: "light", label: t("shell.themeLight"), icon: SunIcon },
    { value: "dark", label: t("shell.themeDark"), icon: MoonIcon },
    { value: "system", label: t("shell.themeSystem"), icon: MonitorIcon },
  ];
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <Choice name="theme" legend={t("shell.theme")} value={mounted ? theme ?? "system" : ""} options={options} onChange={setTheme} />;
}
