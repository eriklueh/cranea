import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Switch, View } from "react-native";
import { PlusBadge, usePlusPaywall } from "@/components/plus";
import { ReminderSettings } from "@/components/reminder";
import { Card, Icon, Row, Screen, Text, type IconName } from "@/components/ui";
import { usePlus } from "@/entitlements";
import { Indicator } from "@/games/cifra/components/tiles";
import { LetterTile } from "@/games/palabra/components/palabra-game";
import { usePrefs } from "@/lib/prefs";
import { useLocale, useT } from "@/lib/i18n";
import { sound } from "@/lib/sound";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";

/**
 * Ajustes del dispositivo, como la hoja de Ajustes de la web: Pantalla, Juego y Más.
 * Se guardan en el teléfono (`cranea-prefs`) y se aplican antes del primer cuadro (ver _layout.tsx).
 * Lo de la cuenta (sesión, ranking, borrar la cuenta) queda en Tu cuenta.
 */
export default function SettingsScreen() {
  const prefs = usePrefs();
  const { preference, setPreference } = useTheme();
  const t = useT();
  const locale = useLocale();
  return (
    <Screen contentStyle={{ gap: 24 }}>
      <Section title={t("shell.sectionDisplay")}>
        {/* Idioma: Automático (el del teléfono), Español o English; cada opción en su idioma. */}
        <Choice
          legend={t("common.language")}
          value={prefs.language}
          options={[
            { value: "auto", label: t("common.languageAuto") },
            { value: "es", label: t("common.languageEs") },
            { value: "en", label: t("common.languageEn") },
          ]}
          onChange={(language) => prefs.set({ language })}
          hint={prefs.language === "auto" ? `${t("common.languageAutoHint")} (${locale === "en" ? t("common.languageEn") : t("common.languageEs")})` : undefined}
        />
        <Choice
          legend={t("shell.theme")}
          value={preference}
          options={[
            { value: "light", label: t("shell.themeLight"), icon: "sunny-outline" },
            { value: "dark", label: t("shell.themeDark"), icon: "moon-outline" },
            { value: "system", label: t("shell.themeSystem"), icon: "phone-portrait-outline" },
          ]}
          onChange={setPreference}
        />
        <Choice
          legend={t("shell.clueColors")}
          value={prefs.palette}
          options={[{ value: "classic", label: t("shell.paletteClassic") }, { value: "colorblind", label: t("shell.paletteColorblind") }]}
          onChange={(palette) => prefs.set({ palette })}
          hint={prefs.palette === "colorblind" ? t("shell.paletteColorblindHint") : t("shell.paletteClassicHint")}
        />
        <TilePreview />
        <Choice
          legend={t("shell.textSize")}
          value={prefs.text}
          options={[{ value: "normal", label: t("shell.textNormal") }, { value: "large", label: t("shell.textLarge") }]}
          onChange={(text) => prefs.set({ text })}
        />
        <Choice
          legend={t("shell.motion")}
          value={prefs.motion}
          options={[{ value: "system", label: t("shell.motionSystem") }, { value: "reduced", label: t("shell.motionReduced") }]}
          onChange={(motion) => prefs.set({ motion })}
          hint={prefs.motion === "reduced" ? t("shell.motionReducedHint") : t("shell.motionSystemHint")}
        />
      </Section>

      <Section title={t("shell.sectionGame")}>
        <Card style={{ gap: 4, paddingVertical: 8 }}>
          <Toggle
            label={t("shell.sound")}
            hint={t("shell.soundHint")}
            value={prefs.sound}
            onChange={(on) => {
              prefs.set({ sound: on });
              if (on) sound("line", true);
            }}
          />
          <Toggle
            label={t("shell.vibration")}
            hint={t("shell.vibrationHint")}
            value={prefs.vibration}
            onChange={(on) => {
              prefs.set({ vibration: on });
              if (on && Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
            }}
          />
        </Card>
      </Section>

      <Section title={t("shell.sectionMore")}>
        <MoreRows />
        <ReminderSettings />
      </Section>
    </Screen>
  );
}

function MoreRows() {
  const router = useRouter();
  const plus = usePlus();
  const paywall = usePlusPaywall();
  const t = useT();
  return (
    <Card style={{ paddingVertical: 4, paddingHorizontal: 4 }}>
      <LinkRow icon="stats-chart-outline" label={t("common.stats")} hint={t("shell.statsHint")} onPress={() => router.push("/estadisticas")} />
      <LinkRow
        icon="star-outline"
        label={t("common.plus")}
        badge={plus ? <PlusBadge /> : undefined}
        hint={plus ? t("shell.plusActiveHint") : t("shell.plusHint")}
        onPress={() => paywall()}
      />
      <LinkRow icon="person-circle-outline" label={t("shell.accountTitle")} hint={t("shell.accountHint")} onPress={() => router.push("/cuenta")} />
    </Card>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 14 }}>
      <Text variant="label" accessibilityRole="header">{title}</Text>
      {children}
    </View>
  );
}

/** Control segmentado (radio): como `Choice` de la web. */
function Choice<T extends string>({
  legend,
  value,
  options,
  onChange,
  hint,
}: {
  legend: string;
  value: T;
  options: { value: T; label: string; icon?: IconName }[];
  onChange: (value: T) => void;
  hint?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text variant="bodyBold">{legend}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={legend} style={[styles.segment, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={o.label}
              onPress={() => onChange(o.value)}
              style={[styles.segmentItem, selected && { backgroundColor: colors.ink }]}
            >
              {o.icon && <Icon name={o.icon} size={16} color={selected ? colors.paper : colors.mutedForeground} />}
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: selected ? colors.paper : colors.mutedForeground, flexShrink: 1 }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {hint && <Text variant="small">{hint}</Text>}
    </View>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (on: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <Row gap={12} style={{ minHeight: 56, paddingHorizontal: 0 }}>
      <View style={{ flex: 1 }}>
        <Text variant="bodyBold">{label}</Text>
        <Text variant="small">{hint}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} trackColor={{ true: colors.primary }} />
    </Row>
  );
}

function LinkRow({ icon, label, hint, badge, onPress }: { icon: IconName; label: string; hint: string; badge?: ReactNode; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${hint}`}
      style={({ pressed }) => [styles.link, pressed && { backgroundColor: colors.accent }]}
    >
      <Icon name={icon} size={22} />
      <View style={{ flex: 1 }}>
        <Row gap={6}>
          <Text variant="bodyBold">{label}</Text>
          {badge}
        </Row>
        <Text variant="small">{hint}</Text>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.pencil} />
    </Pressable>
  );
}

const WORD = [
  { letter: "C", tone: "exact" },
  { letter: "R", tone: "present" },
  { letter: "A", tone: "absent" },
  { letter: "N", tone: "exact" },
  { letter: "E", tone: "present" },
] as const;

/** Cómo se ven las pistas con la paleta, el tema y la letra elegidos (usa las fichas reales). */
function TilePreview() {
  const { colors } = useTheme();
  const t = useT();
  return (
    <View
      accessible
      accessibilityLabel={t("shell.tilePreview")}
      style={[styles.preview, { borderColor: colors.pencil, backgroundColor: colors.paper }]}
    >
      <Row gap={5} importantForAccessibility="no-hide-descendants">
        {WORD.map(({ letter, tone }, i) => (
          <LetterTile key={i} letter={letter} tone={tone} size={40} />
        ))}
      </Row>
      <Row gap={14} style={{ flexWrap: "wrap", justifyContent: "center" }} importantForAccessibility="no-hide-descendants">
        <Row gap={6}>
          <Indicator kind="exact" value={2} />
          <Text variant="small" style={{ color: colors.clueExact }}>{t("shell.clueExact")}</Text>
        </Row>
        <Row gap={6}>
          <Indicator kind="present" value={2} />
          <Text variant="small" style={{ color: colors.cluePresent }}>{t("shell.cluePresent")}</Text>
        </Row>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: "row", borderRadius: radius.lg, borderWidth: 1, padding: 3, gap: 3 },
  segmentItem: { flex: 1, minHeight: 44, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", borderRadius: radius.md, paddingHorizontal: 6 },
  link: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.lg },
  preview: { alignItems: "center", gap: 10, borderWidth: 2, borderStyle: "dashed", borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 8 },
});
