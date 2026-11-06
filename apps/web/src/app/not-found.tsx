"use client";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export default function NotFound() {
  const t = useT();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md space-y-4 px-6 pt-10 sm:pl-16">
        <h1 className="font-display text-3xl font-extrabold">{t("shell.notFoundTitle")}</h1>
        <p className="text-muted-foreground">{t("shell.notFoundBody")}</p>
        <Button asChild>
          <Link href="/">{t("common.goHome")}</Link>
        </Button>
      </main>
    </>
  );
}
