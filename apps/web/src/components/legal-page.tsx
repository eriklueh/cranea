import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const LEGAL = {
  owner: "Erik Luis Estrada Herrera",
  country: "Argentina",
  email: "hola@cranea.app",
  updated: "1 de noviembre de 2026",
};

/** Texto legal: una sola columna, cómodo de leer en el celular. */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-5 pt-2 pb-16 leading-relaxed sm:pl-16 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-extrabold [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">Última actualización: {LEGAL.updated}</p>
        {children}
        <p className="mt-10 text-sm text-muted-foreground">
          <Link href="/privacidad" className="underline underline-offset-4">Privacidad</Link>
          {" · "}
          <Link href="/terminos" className="underline underline-offset-4">Términos</Link>
          {" · "}
          <a href={`mailto:${LEGAL.email}`} className="underline underline-offset-4">{LEGAL.email}</a>
        </p>
      </main>
    </>
  );
}
