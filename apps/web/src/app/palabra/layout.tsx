import { SpanishOnly } from "@/components/spanish-only";

/** En inglés, Palabra no está (ver SpanishOnly). */
export default function PalabraLayout({ children }: { children: React.ReactNode }) {
  return <SpanishOnly gameId="palabra">{children}</SpanishOnly>;
}
