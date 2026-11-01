import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { useRef, useState, type ComponentProps, type ComponentRef } from "react";
import { Platform, Share, StyleSheet, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { shareText } from "@/components/result-sheet";
import { Button, Row, Text } from "@/components/ui";
import { light as C, alpha, fonts } from "@/theme/tokens";

/**
 * Imagen para compartir el resultado de una partida, como la de la web (components/share/share-image.ts):
 * hoja cuadriculada con margen rojo y una ficha con borde de tinta. Se dibuja con Views fuera de la
 * pantalla y se captura con react-native-view-shot. Nunca muestra la solución.
 */

/** Marca de un intento: fallado, el que salió o sin usar. */
export type AttemptMark = "miss" | "win" | "empty";

export type ResultVisual =
  /** Palabra: los colores de cada intento, sin letras. 2 = en su lugar, 1 = está, 0 = no está. */
  | { kind: "colors"; rows: (0 | 1 | 2)[][] }
  /** Silueta del tablero: solo la cuadrícula y, si hay, las islas (sin números ni puentes). */
  | { kind: "board"; width: number; height: number; dots?: { r: number; c: number }[]; blocks?: number };

export interface ResultCard {
  /** "Palabra" */
  game: string;
  /** "Diario #12", "Nivel 2-3" */
  label: string;
  won: boolean;
  /** "3/6", "Sin errores", "No salió" */
  headline: string;
  /** "3 intentos · 1:23" */
  detail: string;
  visual?: ResultVisual;
  marks?: AttemptMark[];
}

export const SHARE_FOOTER = "cranea.app";

/** "Diario #12" o "Nivel 2-3". */
export const resultLabel = (mode: { kind: "daily"; number: number } | { kind: "level"; world: number; level: number }) =>
  mode.kind === "daily" ? `Diario #${mode.number}` : `Nivel ${mode.world}-${mode.level}`;

/** Los intentos fallados, el que salió y los que sobraron (perdido: todos fallados). */
export function attemptMarks(total: number, misses: number, won: boolean): AttemptMark[] {
  return Array.from({ length: total }, (_, i) => (i < misses ? "miss" : won && i === misses ? "win" : !won ? "miss" : "empty"));
}

/** Tamaño lógico de la tarjeta; se exporta a 1080 × 1080. */
const SIZE = 360;
const CELL = 12;
const OUT = 1080;
const PRESENT = "#e3b505";
const ABSENT = "#c5d2e3";
const OK_BG = "#e4f3e9";
/** Lugar para lo visual dentro de la ficha. */
const VIS_W = 248;
const VIS_H = 136;

/**
 * "Compartir resultado": captura la imagen y abre la hoja del sistema. En iOS van juntos la imagen
 * y el texto; Android no acepta texto con un archivo, así que el texto queda copiado para pegarlo.
 */
export function ResultShareButton({ text, card }: { text: string; card: ResultCard }) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const shareImage = async () => {
    setBusy(true);
    setNote(null);
    try {
      const uri = await captureRef(ref, { format: "png", quality: 1, result: "tmpfile", width: OUT, height: OUT });
      if (Platform.OS === "ios") {
        await Share.share({ url: uri, message: text });
      } else if (await Sharing.isAvailableAsync()) {
        await Clipboard.setStringAsync(text).catch(() => undefined);
        setNote("El texto quedó copiado: pegalo junto a la imagen.");
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Compartir resultado" });
      } else {
        await shareText(text);
      }
    } catch {
      // Sin imagen (poca memoria, módulo nativo ausente): por lo menos el texto.
      await shareText(text);
    }
    setBusy(false);
  };

  return (
    <View style={{ gap: 4 }}>
      <Row gap={8}>
        <Button title="Compartir resultado" variant="outline" icon="share-outline" onPress={shareImage} loading={busy} style={{ flex: 1 }} />
        <Button title="Texto" variant="outline" icon="text-outline" onPress={() => void shareText(text)} accessibilityLabel="Compartir solo el texto" style={{ paddingHorizontal: 14 }} />
      </Row>
      {note && <Text variant="small" style={{ textAlign: "center" }} accessibilityLiveRegion="polite">{note}</Text>}
      {/* Fuera de la pantalla: solo existe para la captura. */}
      <View style={styles.offscreen} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <View ref={ref} collapsable={false}>
          <ShareCardView card={card} />
        </View>
      </View>
    </View>
  );
}

/** La tarjeta en sí, siempre en claro: se lee igual en cualquier chat. */
export function ShareCardView({ card }: { card: ResultCard }) {
  const tone = card.won ? C.ok : C.margin;
  const both = Boolean(card.visual && card.marks?.length);
  return (
    <View style={styles.sheet}>
      {Array.from({ length: SIZE / CELL - 1 }, (_, i) => (
        <View key={`v${i}`} style={[styles.gridV, { left: (i + 1) * CELL }]} />
      ))}
      {Array.from({ length: SIZE / CELL - 1 }, (_, i) => (
        <View key={`h${i}`} style={[styles.gridH, { top: (i + 1) * CELL }]} />
      ))}
      <View style={styles.marginLine} />

      <View style={styles.card}>
        <Row style={{ alignItems: "flex-start", justifyContent: "space-between" }} gap={8}>
          <View style={{ flex: 1 }}>
            <T style={styles.game} numberOfLines={1}>{card.game}</T>
            <T style={styles.label} numberOfLines={1}>{card.label}</T>
          </View>
          <View style={[styles.badge, { backgroundColor: tone }]}>
            <Ionicons name={card.won ? "checkmark" : "close"} size={15} color={C.card} />
          </View>
        </Row>

        <View style={styles.visual}>
          {card.visual && <Visual visual={card.visual} won={card.won} maxH={both ? VIS_H - 36 : VIS_H} />}
          {card.marks?.length ? <Marks marks={card.marks} size={both ? 24 : 46} /> : null}
        </View>

        <View style={styles.divider} />
        <T style={[styles.headline, { color: tone }]} numberOfLines={1}>{card.headline}</T>
        <T style={styles.detail} numberOfLines={1}>{card.detail}</T>
      </View>
      <T style={styles.footer}>{SHARE_FOOTER}</T>
    </View>
  );
}

function Marks({ marks, size }: { marks: AttemptMark[]; size: number }) {
  return (
    <Row gap={Math.round(size * 0.22)} style={{ justifyContent: "center" }}>
      {marks.map((m, i) =>
        m === "empty" ? (
          <View key={i} style={{ width: size, height: size, borderRadius: size * 0.18, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.border }} />
        ) : (
          <View key={i} style={{ width: size, height: size, borderRadius: size * 0.18, backgroundColor: m === "win" ? C.ok : C.margin, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={m === "win" ? "checkmark" : "close"} size={size * 0.62} color={C.card} />
          </View>
        ),
      )}
    </Row>
  );
}

function Visual({ visual, won, maxH }: { visual: ResultVisual; won: boolean; maxH: number }) {
  if (visual.kind === "colors") {
    const cols = Math.max(1, ...visual.rows.map((r) => r.length));
    const n = Math.max(1, visual.rows.length);
    const s = Math.floor(Math.min(28, VIS_W / (cols + (cols - 1) * 0.14), maxH / (n + (n - 1) * 0.14)));
    const gap = Math.max(2, Math.round(s * 0.14));
    return (
      <View style={{ gap, alignItems: "center" }}>
        {visual.rows.map((row, r) => (
          <View key={r} style={{ flexDirection: "row", gap }}>
            {row.map((x, c) => (
              <View key={c} style={{ width: s, height: s, borderRadius: s * 0.14, backgroundColor: x === 2 ? C.ok : x === 1 ? PRESENT : ABSENT }} />
            ))}
          </View>
        ))}
      </View>
    );
  }
  const { width: W, height: H, dots = [], blocks } = visual;
  const s = Math.min(22, VIS_W / W, maxH / H);
  return (
    <View style={{ width: W * s, height: H * s, borderRadius: 4, borderWidth: 1.5, borderColor: C.ink, backgroundColor: won ? OK_BG : C.card, overflow: "hidden" }}>
      {Array.from({ length: W - 1 }, (_, i) => {
        const thick = Boolean(blocks && (i + 1) % blocks === 0);
        return <View key={`v${i}`} style={{ position: "absolute", top: 0, bottom: 0, left: (i + 1) * s - 1.5, width: thick ? 1.5 : 1, backgroundColor: alpha(C.ink, thick ? 0.5 : 0.16) }} />;
      })}
      {Array.from({ length: H - 1 }, (_, i) => {
        const thick = Boolean(blocks && (i + 1) % blocks === 0);
        return <View key={`h${i}`} style={{ position: "absolute", left: 0, right: 0, top: (i + 1) * s - 1.5, height: thick ? 1.5 : 1, backgroundColor: alpha(C.ink, thick ? 0.5 : 0.16) }} />;
      })}
      {dots.map((d, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: (d.c + 0.14) * s - 1.5,
            top: (d.r + 0.14) * s - 1.5,
            width: s * 0.72,
            height: s * 0.72,
            borderRadius: s * 0.36,
            borderWidth: Math.max(1, s * 0.08),
            borderColor: won ? C.ok : C.ink,
            backgroundColor: C.card,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: { position: "absolute", left: -10000, top: 0, width: SIZE, height: SIZE },
  sheet: { width: SIZE, height: SIZE, backgroundColor: C.paper, overflow: "hidden" },
  gridV: { position: "absolute", top: 0, bottom: 0, width: StyleSheet.hairlineWidth * 2, backgroundColor: C.gridLine },
  gridH: { position: "absolute", left: 0, right: 0, height: StyleSheet.hairlineWidth * 2, backgroundColor: C.gridLine },
  marginLine: { position: "absolute", top: 0, bottom: 0, left: 28, width: 1, backgroundColor: alpha(C.margin, 0.55) },
  card: {
    position: "absolute",
    left: 44,
    top: 26,
    width: 288,
    height: 288,
    padding: 18,
    backgroundColor: C.card,
    borderWidth: 1.75,
    borderBottomWidth: 4.5,
    borderColor: C.ink,
    borderRadius: 10,
  },
  game: { fontFamily: fonts.displayHeavy, fontSize: 26, lineHeight: 30, color: C.ink, letterSpacing: -0.4 },
  label: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, color: C.pencil },
  badge: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 4 },
  visual: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  divider: { borderTopWidth: 1, borderStyle: "dashed", borderColor: C.border, marginBottom: 8 },
  headline: { fontFamily: fonts.displayHeavy, fontSize: 22, lineHeight: 26, textAlign: "center" },
  detail: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, color: C.ink, textAlign: "center" },
  footer: { position: "absolute", left: 44, width: 288, top: 330, textAlign: "center", fontFamily: fonts.bodyBold, fontSize: 12, color: C.pencil },
});

/** Texto de la tarjeta: sin escalar con el tamaño de letra del sistema, así la imagen siempre entra. */
function T(props: ComponentProps<typeof Text>) {
  return <Text allowFontScaling={false} {...props} />;
}
