import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallApp } from "@/components/pwa-provider";

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-3 pr-4 pl-16 max-sm:pl-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/" className="font-display text-xl font-extrabold tracking-tight">
          Craneá
        </Link>
        {children}
      </div>
      <div className="flex shrink-0 items-center gap-1"><InstallApp /><ThemeToggle /></div>
    </header>
  );
}
