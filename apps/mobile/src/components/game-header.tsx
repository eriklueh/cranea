import type { ReactNode } from "react";
import { Row, Text } from "@/components/ui";

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
export function gameTitle(game: string, mode: { kind: "daily"; number: number } | { kind: "level"; world: number; level: number }) {
  return mode.kind === "daily" ? `${game} del día #${mode.number}` : `${game} · Nivel ${mode.world}-${mode.level}`;
}
