import Link from "next/link";
import { createTranslator, type Locale } from "@cranea/core/i18n";
import { SiteHeader } from "@/components/site-header";
import { messages } from "@/i18n/messages";

export const LEGAL = {
  owner: "Erik Luis Estrada Herrera",
  country: "Argentina",
  email: "hola@cranea.app",
};

/** Rutas de los textos legales en cada idioma: /privacidad y /terminos en español, /privacy y /terms en inglés. */
export const LEGAL_PATHS: Record<Locale, { privacy: string; terms: string }> = {
  es: { privacy: "/privacidad", terms: "/terminos" },
  en: { privacy: "/privacy", terms: "/terms" },
};

/**
 * Texto legal: una sola columna, cómodo de leer en el celular. Cada página está fija en su idioma
 * (`lang`), con un enlace a la versión en el otro.
 */
export function LegalPage({ title, lang, page, children }: { title: string; lang: Locale; page: "privacy" | "terms"; children: React.ReactNode }) {
  const t = createTranslator(messages, lang);
  const other: Locale = lang === "es" ? "en" : "es";
  const paths = LEGAL_PATHS[lang];
  return (
    <>
      <SiteHeader />
      <main lang={lang} className="mx-auto w-full max-w-2xl px-5 pt-2 pb-16 leading-relaxed sm:pl-16 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-extrabold [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {t("legal.updated", { date: t("legal.updatedDate") })}
          {" · "}
          <Link href={LEGAL_PATHS[other][page]} hrefLang={other} lang={other} className="underline underline-offset-4">
            {t("legal.otherLanguage")}
          </Link>
        </p>
        {children}
        <p className="mt-10 text-sm text-muted-foreground">
          <Link href={paths.privacy} className="underline underline-offset-4">{t("common.privacy")}</Link>
          {" · "}
          <Link href={paths.terms} className="underline underline-offset-4">{t("common.terms")}</Link>
          {" · "}
          <a href={`mailto:${LEGAL.email}`} className="underline underline-offset-4">{LEGAL.email}</a>
        </p>
      </main>
    </>
  );
}
