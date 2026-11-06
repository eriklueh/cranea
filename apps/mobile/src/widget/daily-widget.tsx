"use no memo"; // react-native-android-widget llama a los componentes como funciones: sin React Compiler.

import { gameCopy, type Locale } from "@cranea/core/i18n";
import type { DailyStatus, DailyWidgetState } from "@cranea/core/widget";
import type { ColorProp } from "react-native-android-widget";
import { translator } from "@/lib/i18n";
import { colorblind, dark, light, type Palette } from "@/theme/tokens";
import { widgetModule } from "./module";

/**
 * Widget «Diarios de hoy» (Android). Se dibuja con los componentes de react-native-android-widget
 * (no son vistas de React Native: se convierten en RemoteViews). Tres tamaños según el lugar que le da
 * el launcher: tira (2×1), chico (2×2) y mediano (4×2). Todo el widget abre el próximo diario.
 */

/** Familias copiadas a android/app/src/main/assets/fonts por el plugin (plugins/with-daily-widget.js). */
export const WIDGET_FONTS = { display: "BricolageGrotesque_800ExtraBold", bold: "AtkinsonHyperlegible_700Bold" } as const;

export interface WidgetLook {
  locale: Locale;
  palette: "classic" | "colorblind";
}

type Size = "strip" | "small" | "medium";

const sizeFor = (width: number, height: number): Size => (height < 100 ? "strip" : width < 230 ? "small" : "medium");

interface Colors {
  bg: ColorProp;
  ink: ColorProp;
  muted: ColorProp;
  border: ColorProp;
  won: ColorProp;
  lost: ColorProp;
  pending: ColorProp;
  button: ColorProp;
  buttonInk: ColorProp;
  doneBg: ColorProp;
  doneInk: ColorProp;
}

const hex = (c: string) => c as ColorProp;

function colorsFor(theme: "light" | "dark", palette: WidgetLook["palette"]): Colors {
  const base: Palette = theme === "dark" ? dark : light;
  const p = palette === "colorblind" ? { ...base, ...colorblind[theme] } : base;
  return {
    bg: hex(p.paper),
    ink: hex(p.ink),
    muted: hex(p.mutedForeground),
    border: hex(p.border),
    // Los mismos tonos que la etiqueta del diario en el inicio: resuelto, no salió, por jugar.
    won: hex(p.clueExact),
    lost: hex(p.pencil),
    pending: hex(p.cluePresent),
    button: hex(p.primary),
    buttonInk: hex(p.primaryForeground),
    doneBg: hex(p.clueExactBg),
    doneInk: hex(p.clueExact),
  };
}

export interface DailyWidgetProps {
  state: DailyWidgetState;
  look: WidgetLook;
  theme: "light" | "dark";
  width: number;
  height: number;
}

export function DailyWidget({ state, look, theme, width, height }: DailyWidgetProps) {
  // Solo se dibuja en Android con el módulo nativo (ver module.ts).
  const { FlexWidget, TextWidget } = widgetModule()!;
  const t = translator(look.locale);
  const c = colorsFor(theme, look.palette);
  const size = sizeFor(width, height);
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

  const count = (fontSize: number) => (
    <TextWidget
      text={t("widget.progress", { done: state.done, total: state.total })}
      style={{ fontSize, fontFamily: WIDGET_FONTS.display, color: state.allDone ? c.doneInk : c.ink }}
    />
  );

  const badges = (fontSize: number) =>
    state.streak > 0 || state.protectors > 0 ? (
      <FlexWidget style={{ flexDirection: "row", alignItems: "center", flexGap: 6 }}>
        {state.streak > 0 ? <TextWidget text={`🔥${state.streak}`} style={{ fontSize, fontFamily: WIDGET_FONTS.bold, color: c.ink }} /> : null}
        {state.protectors > 0 ? <TextWidget text={`🛡️${state.protectors}`} style={{ fontSize, fontFamily: WIDGET_FONTS.bold, color: c.ink }} /> : null}
      </FlexWidget>
    ) : null;

  const dots = (d: number, gap: number) => (
    <FlexWidget style={{ flexDirection: "row", alignItems: "center", flexGap: gap }}>
      {state.games.map((g) => (
        <FlexWidget
          key={g.id}
          style={{
            width: d,
            height: d,
            borderRadius: d / 2,
            backgroundColor: g.status === "won" ? c.won : g.status === "lost" ? c.lost : c.bg,
            borderWidth: g.status === "pending" ? 2 : 0,
            borderColor: c.pending,
          }}
        />
      ))}
    </FlexWidget>
  );

  const title = (fontSize: number) => (
    <TextWidget text={t("widget.title")} maxLines={1} truncate="END" style={{ fontSize, fontFamily: WIDGET_FONTS.bold, color: c.muted }} />
  );

  const cta = (fontSize: number, full: boolean) =>
    state.allDone ? (
      <FlexWidget style={{ flexDirection: "column", width: full ? "match_parent" : "wrap_content" }}>
        <TextWidget text={t("widget.allDone")} maxLines={1} truncate="END" style={{ fontSize, fontFamily: WIDGET_FONTS.display, color: c.doneInk }} />
        <TextWidget text={t("widget.allDoneSub")} maxLines={1} truncate="END" style={{ fontSize: fontSize - 2, fontFamily: WIDGET_FONTS.bold, color: c.muted }} />
      </FlexWidget>
    ) : (
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: state.link }}
        accessibilityLabel={action}
        style={{
          width: full ? "match_parent" : "wrap_content",
          backgroundColor: c.button,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TextWidget text={`${action} →`} maxLines={1} truncate="END" style={{ fontSize, fontFamily: WIDGET_FONTS.bold, color: c.buttonInk }} />
      </FlexWidget>
    );

  const root = {
    clickAction: "OPEN_URI" as const,
    clickActionData: { uri: state.link },
    accessibilityLabel: a11y,
  };
  const frame = { width: "match_parent" as const, height: "match_parent" as const, backgroundColor: c.bg, borderRadius: 22 };

  if (size === "strip") {
    return (
      <FlexWidget {...root} style={{ ...frame, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14 }}>
        <FlexWidget style={{ flexDirection: "column" }}>
          {title(11)}
          {count(22)}
        </FlexWidget>
        <FlexWidget style={{ flexDirection: "column", alignItems: "flex-end", flexGap: 4 }}>
          {dots(10, 5)}
          {badges(12)}
        </FlexWidget>
      </FlexWidget>
    );
  }

  if (size === "small") {
    return (
      <FlexWidget {...root} style={{ ...frame, flexDirection: "column", justifyContent: "space-between", padding: 14 }}>
        <FlexWidget style={{ width: "match_parent", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          {title(12)}
          {badges(12)}
        </FlexWidget>
        {count(30)}
        {dots(12, 6)}
        {cta(13, true)}
      </FlexWidget>
    );
  }

  return (
    <FlexWidget {...root} style={{ ...frame, flexDirection: "column", justifyContent: "space-between", padding: 16 }}>
      <FlexWidget style={{ width: "match_parent", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        {title(14)}
        {badges(14)}
      </FlexWidget>
      <FlexWidget style={{ width: "match_parent", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        {count(34)}
        {dots(16, 8)}
      </FlexWidget>
      {cta(14, true)}
    </FlexWidget>
  );
}
