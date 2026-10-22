import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md space-y-4 px-6 pt-10 sm:pl-16">
        <h1 className="font-display text-3xl font-extrabold">Esta página no existe</h1>
        <p className="text-muted-foreground">Puede que el nivel todavía no esté publicado.</p>
        <Button asChild>
          <Link href="/">Ir al inicio</Link>
        </Button>
      </main>
    </>
  );
}
