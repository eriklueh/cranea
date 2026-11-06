"use client";
import { useT, type Key } from "@/lib/i18n";

const FAQ: { q: Key; a: Key }[] = [
  { q: "plus.faqIncludesQ", a: "plus.faqIncludesA" },
  { q: "plus.faqPriceQ", a: "plus.faqPriceA" },
  { q: "plus.faqFreeQ", a: "plus.faqFreeA" },
  { q: "plus.faqGetQ", a: "plus.faqGetA" },
  { q: "plus.faqCancelQ", a: "plus.faqCancelA" },
  { q: "plus.faqMissingQ", a: "plus.faqMissingA" },
];

/** Preguntas y "La app" de /plus, en el idioma activo. */
export function PlusFaq() {
  const t = useT();
  return (
    <>
      <section aria-labelledby="preguntas" className="mt-8">
        <h2 id="preguntas" className="mb-2 font-display text-xl font-extrabold">{t("plus.faqTitle")}</h2>
        <div className="divide-y-2 divide-border rounded-xl border-2 border-border bg-card">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                {t(q)}
                <span aria-hidden className="text-xl leading-none text-pencil transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">{t(a, { price: t("plus.price") })}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="app" aria-labelledby="la-app" className="mt-8 scroll-mt-4 rounded-xl border-2 border-dashed border-border p-4">
        <h2 id="la-app" className="font-display text-xl font-extrabold">{t("plus.appTitle")}</h2>
        <p className="mt-1 text-muted-foreground">{t("plus.appBody")}</p>
      </section>
    </>
  );
}
