import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { PlusHero } from "@/components/plus/plus-hero";
import { PLUS_PRICE } from "@/lib/plus";

export const metadata: Metadata = {
  title: "Craneá Plus",
  description: `Todos los niveles, el archivo de diarios y pistas sin límite, ${PLUS_PRICE}. Los desafíos del día siguen gratis.`,
};

const FAQ = [
  {
    q: "¿Qué incluye?",
    a: "Todos los niveles y mundos de Cifra, Puentes, Nonograma, Torres y Palabra; el archivo para jugar los diarios que te perdiste; pistas sin límite; y la app sin publicidad.",
  },
  {
    q: "¿Cuánto sale?",
    a: `Hay plan mensual y anual, ${PLUS_PRICE}. El precio final lo ves en la tienda antes de confirmar, en tu moneda.`,
  },
  {
    q: "¿Los diarios siguen siendo gratis?",
    a: "Sí, siempre. Los cinco desafíos de cada día, los tutoriales, el ranking, las estadísticas y los logros son gratis, con o sin Plus.",
  },
  {
    q: "¿Cómo lo consigo?",
    a: "Desde la app de Craneá, en App Store o Google Play. Iniciá sesión en la app y después acá con la misma cuenta: Plus se activa en los dos lados.",
  },
  {
    q: "¿Cómo lo cancelo?",
    a: "Desde la tienda donde lo sacaste: en iPhone, Ajustes → tu nombre → Suscripciones; en Android, Google Play → Pagos y suscripciones. Seguís con Plus hasta que termine el período que pagaste.",
  },
  {
    q: "Ya lo compré y acá no aparece",
    a: "Revisá que hayas iniciado sesión con la misma cuenta que en la app. Si recién lo compraste, puede tardar unos minutos.",
  },
];

export default function PlusPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md px-5 pt-1 pb-16">
        <PlusHero />

        <section aria-labelledby="preguntas" className="mt-8">
          <h2 id="preguntas" className="mb-2 font-display text-xl font-extrabold">Preguntas</h2>
          <div className="divide-y-2 divide-border rounded-xl border-2 border-border bg-card">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden className="text-xl leading-none text-pencil transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="px-4 pb-4 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="app" aria-labelledby="la-app" className="mt-8 scroll-mt-4 rounded-xl border-2 border-dashed border-border p-4">
          <h2 id="la-app" className="font-display text-xl font-extrabold">La app</h2>
          <p className="mt-1 text-muted-foreground">
            Craneá para iPhone y Android llega pronto a App Store y Google Play. Mientras tanto, los diarios se juegan gratis acá, también sin conexión.
          </p>
        </section>
      </main>
    </>
  );
}
