"use no memo"; // react-native-android-widget llama a los componentes como funciones: sin React Compiler.

import { gameCopy, type Locale } from "@cranea/core/i18n";
import { widgetLink, type DailyStatus, type DailyWidgetState } from "@cranea/core/widget";
import type { ColorProp } from "react-native-android-widget";
import { translator } from "@/lib/i18n";
import { colorblind, dark, light, type Palette } from "@/theme/tokens";
import { widgetModule } from "./module";

/**
 * Widgets de Android de los diarios. Se dibujan con los componentes de react-native-android-widget
 * (no son vistas de React Native: se convierten en RemoteViews). Dos formas, y el usuario elige en el
 * selector de widgets:
 * - **Fila** (`DailyRowWidget`, 4×1): progreso y racha + una ficha por juego; cada ficha abre su diario.
 *   Achicado a 2×1 queda el conteo con puntos.
 * - **Anillo** (`DailyRingWidget`, 2×2): un anillo con un tramo por juego, la racha y el próximo diario.
 */

/** Familias copiadas a android/app/src/main/assets/fonts por el plugin (plugins/with-daily-widget.js). */
export const WIDGET_FONTS = { display: "BricolageGrotesque_800ExtraBold", bold: "AtkinsonHyperlegible_700Bold" } as const;

export interface WidgetLook {
  locale: Locale;
  palette: "classic" | "colorblind";
}

export interface DailyWidgetProps {
  state: DailyWidgetState;
  look: WidgetLook;
  theme: "light" | "dark";
  width: number;
  height: number;
}

interface Colors {
  bg: string;
  ink: string;
  muted: string;
  line: string;
  tile: string;
  won: string;
  wonBg: string;
  lost: string;
  pending: string;
}

function colorsFor(theme: "light" | "dark", palette: WidgetLook["palette"]): Colors {
  const base: Palette = theme === "dark" ? dark : light;
  const p = palette === "colorblind" ? { ...base, ...colorblind[theme] } : base;
  return {
    bg: p.paper,
    ink: p.ink,
    muted: p.mutedForeground,
    line: theme === "dark" ? "#3a3d44" : p.gridLine,
    tile: p.tile,
    // Los mismos tonos que la etiqueta del diario en el inicio: resuelto, no salió, por jugar.
    won: p.clueExact,
    wonBg: p.clueExactBg,
    lost: p.pencil,
    pending: p.cluePresent,
  };
}

const col = (c: string) => c as ColorProp;

/** Lo común a las dos formas: textos, accesibilidad y colores. */
function widgetBits({ state, look, theme }: DailyWidgetProps) {
  const t = translator(look.locale);
  const c = colorsFor(theme, look.palette);
  const name = (id: string) => gameCopy(id, look.locale).name;
  const action = state.next ? t("widget.play", { game: name(state.next) }) : state.allDone ? t("widget.allDone") : t("widget.openHome");
  const statusText = (id: string, s: DailyStatus) =>
    t(s === "won" ? "widget.statusWon" : s === "lost" ? "widget.statusLost" : "widget.statusPending", { game: name(id) });
  const a11y = [
    t("widget.a11y", { done: state.done, total: state.total, action }),
    ...state.games.map((g) => statusText(g.id, g.status)),
    state.streak > 0 ? t("widget.streakA11y", { count: state.streak }) : "",
    state.protectors > 0 ? t("widget.protectorsA11y", { count: state.protectors }) : "",
  ]
    .filter(Boolean)
    .join(". ");
  const badges = [state.streak > 0 ? `🔥 ${state.streak}` : "", state.protectors > 0 ? `🛡️ ${state.protectors}` : ""].filter(Boolean).join("  ");
  return { t, c, name, statusText, a11y, badges, progress: t("widget.progress", { done: state.done, total: state.total }) };
}

const frame = (c: Colors) => ({ width: "match_parent" as const, height: "match_parent" as const, backgroundColor: col(c.bg), borderRadius: 22 });

/* ───────────────────────────── A · Fila de juegos ───────────────────────────── */

export function DailyRowWidget(props: DailyWidgetProps) {
  const { FlexWidget, TextWidget } = widgetModule()!;
  const { state, width } = props;
  const { c, name, statusText, a11y, badges, progress } = widgetBits(props);
  const root = { clickAction: "OPEN_URI" as const, clickActionData: { uri: state.link }, accessibilityLabel: a11y };
  const count = (fontSize: number) => (
    <TextWidget text={progress} style={{ fontSize, fontFamily: WIDGET_FONTS.display, color: col(state.allDone ? c.won : c.ink) }} />
  );

  // 2×1: conteo con un punto por juego y la racha.
  if (width < 230) {
    return (
      <FlexWidget {...root} style={{ ...frame(c), flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 }}>
        <FlexWidget style={{ flexDirection: "column", flexGap: 6 }}>
          {count(24)}
          <FlexWidget style={{ flexDirection: "row", alignItems: "center", flexGap: 5 }}>
            {state.games.map((g) => (
              <FlexWidget key={g.id} style={mark(g.status, 10, c)} />
            ))}
          </FlexWidget>
        </FlexWidget>
        {state.streak > 0 ? <TextWidget text={`🔥 ${state.streak}`} style={{ fontSize: 14, fontFamily: WIDGET_FONTS.bold, color: col(c.ink) }} /> : null}
      </FlexWidget>
    );
  }

  // 4×1: las fichas se achican si no entran (5 juegos en español en un teléfono angosto).
  const n = Math.max(state.games.length, 1);
  const gap = 6;
  const tileW = Math.max(30, Math.min(44, Math.floor((width - 26 - 74 - gap * (n - 1)) / n)));
  const tileH = Math.min(52, Math.max(40, props.height - 24));
  return (
    <FlexWidget {...root} style={{ ...frame(c), flexDirection: "row", alignItems: "center", paddingLeft: 16, paddingRight: 10 }}>
      <FlexWidget style={{ flex: 1, flexDirection: "column", flexGap: 4 }}>
        {count(26)}
        {badges ? <TextWidget text={badges} maxLines={1} style={{ fontSize: 11, fontFamily: WIDGET_FONTS.bold, color: col(c.muted) }} /> : null}
      </FlexWidget>
      <FlexWidget style={{ flexDirection: "row", alignItems: "center", flexGap: gap }}>
        {state.games.map((g) => {
          const next = g.id === state.next;
          const won = g.status === "won";
          return (
            <FlexWidget
              key={g.id}
              clickAction="OPEN_URI"
              clickActionData={{ uri: widgetLink(g.id) }}
              accessibilityLabel={statusText(g.id, g.status)}
              style={{
                width: tileW,
                height: tileH,
                borderRadius: 12,
                backgroundColor: col(won ? c.wonBg : c.tile),
                borderWidth: won ? 0 : next ? 2 : 1,
                borderColor: col(next ? c.ink : c.line),
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flexGap: 3,
              }}
            >
              <TextWidget
                text={name(g.id).charAt(0).toUpperCase()}
                style={{ fontSize: 17, fontFamily: WIDGET_FONTS.display, color: col(won ? c.won : g.status === "lost" ? c.lost : c.ink) }}
              />
              {won ? (
                <FlexWidget style={{ ...mark("won", 15, c), alignItems: "center", justifyContent: "center" }}>
                  {/* Sin fuente propia: el ✓ sale de la del sistema (Atkinson no lo tiene). */}
                  <TextWidget text="✓" style={{ fontSize: 10, color: col(c.bg) }} />
                </FlexWidget>
              ) : (
                <FlexWidget style={mark(g.status, 15, c)} />
              )}
            </FlexWidget>
          );
        })}
      </FlexWidget>
    </FlexWidget>
  );
}

/** Punto de estado: lleno si se resolvió o no salió, aro amarillo si falta jugarlo. */
function mark(status: DailyStatus, d: number, c: Colors) {
  return {
    width: d,
    height: d,
    borderRadius: d / 2,
    backgroundColor: col(status === "won" ? c.won : status === "lost" ? c.lost : "#00000000"),
    borderWidth: status === "pending" ? 2 : 0,
    borderColor: col(c.pending),
  };
}

/* ───────────────────────────── B · Anillo ───────────────────────────── */

/** Anillo con un tramo por juego (SVG): verde resuelto, gris no salió, pista vacía por jugar. */
export function ringSvg(statuses: DailyStatus[], size: number, c: Pick<Colors, "won" | "lost" | "line">): string {
  const sw = Math.max(6, Math.round(size * 0.11));
  const r = (size - sw) / 2;
  const cx = size / 2;
  const n = Math.max(statuses.length, 1);
  // Con un solo juego (o todo listo) va el círculo entero; si no, tramos con un hueco (que tapa la punta redonda).
  const gapDeg = n === 1 ? 0 : (sw / r) * (180 / Math.PI) + 8;
  const pt = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cx + r * Math.sin(a)).toFixed(2)}`;
  };
  const color = (s: DailyStatus) => (s === "won" ? c.won : s === "lost" ? c.lost : c.line);
  const arcs =
    n === 1
      ? `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${color(statuses[0] ?? "pending")}" stroke-width="${sw}"/>`
      : statuses
          .map((s, i) => {
            const from = (i * 360) / n + gapDeg / 2;
            const to = ((i + 1) * 360) / n - gapDeg / 2;
            const large = to - from > 180 ? 1 : 0;
            return `<path d="M ${pt(from)} A ${r} ${r} 0 ${large} 1 ${pt(to)}" fill="none" stroke="${color(s)}" stroke-width="${sw}" stroke-linecap="round"/>`;
          })
          .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${arcs}</svg>`;
}

export function DailyRingWidget(props: DailyWidgetProps) {
  const { FlexWidget, OverlapWidget, SvgWidget, TextWidget } = widgetModule()!;
  const { state, width, height } = props;
  const { t, c, name, a11y, progress } = widgetBits(props);
  const ring = Math.max(56, Math.min(112, Math.min(width, height) - 76));
  const statuses = state.allDone ? ["won" as const] : state.games.map((g) => g.status);
  const footer = state.next ? `${name(state.next)} →` : state.allDone ? t("widget.allDoneSub") : t("widget.openHome");

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: state.link }}
      accessibilityLabel={a11y}
      style={{ ...frame(c), flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: 14 }}
    >
      <FlexWidget style={{ width: "match_parent", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <TextWidget text="Craneá" style={{ fontSize: 12, fontFamily: WIDGET_FONTS.bold, color: col(c.ink) }} />
        {state.streak > 0 ? <TextWidget text={`🔥 ${state.streak}`} style={{ fontSize: 12, fontFamily: WIDGET_FONTS.bold, color: col(c.ink) }} /> : null}
      </FlexWidget>
      <OverlapWidget style={{ width: ring, height: ring }}>
        <SvgWidget svg={ringSvg(statuses, ring, c)} style={{ width: ring, height: ring }} />
        <FlexWidget style={{ width: ring, height: ring, alignItems: "center", justifyContent: "center" }}>
          <TextWidget
            text={state.allDone ? "✓" : progress}
            style={{
              fontSize: Math.round(ring * (state.allDone ? 0.36 : 0.3)),
              ...(state.allDone ? {} : { fontFamily: WIDGET_FONTS.display }),
              color: col(state.allDone ? c.won : c.ink),
            }}
          />
        </FlexWidget>
      </OverlapWidget>
      <TextWidget
        text={footer}
        maxLines={1}
        truncate="END"
        style={{ fontSize: 12, fontFamily: WIDGET_FONTS.bold, color: col(state.next ? c.ink : c.muted) }}
      />
    </FlexWidget>
  );
}
