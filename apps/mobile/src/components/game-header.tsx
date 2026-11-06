import type { ReactNode } from "react";
import type { Locale } from "@cranea/core/i18n";
import { Row, Text } from "@/components/ui";
import { getLocale, translator } from "@/lib/i18n";

/**
 * Debajo de la barra de navegación, que ya lleva el título ("Puentes del día #2", "Cifra · Nivel 1-3"):
 * el contexto chico ("Mismo tablero para todos", "7×7") con vidas y reloj a la derecha.
 * Antes el título se repetía en grande dentro de la pantalla.
 */
export function GameHeader({ context, right }: { context: string; right?: ReactNode }) {
  return (
    <Row style={{ justifyContent: "space-between", minHeight: 24 }} gap={12}>
      <Text variant="small" style={{ flex: 1 }} numberOfLines={1}>{context}</Text>
      {right && <Row gap={14}>{right}</Row>}
    </Row>
  );
}

/** Título de la barra para un diario o un nivel, igual en los cinco juegos. */
export function gameTitle(game: string, mode: { kind: "daily"; number: number } | { kind: "level"; world: number; level: number }, locale: Locale = getLocale()) {
  const t = translator(locale);
  return mode.kind === "daily" ? t("hub.dailyTitle", { game, n: mode.number }) : t("hub.levelTitle", { game, world: mode.world, level: mode.level });
}
