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
  return (
    <Screen contentStyle={{ gap: 24 }}>
      <Section title="Pantalla">
        <Choice
          legend="Tema"
          value={preference}
          options={[
            { value: "light", label: "Cuaderno", icon: "sunny-outline" },
            { value: "dark", label: "Pizarrón", icon: "moon-outline" },
            { value: "system", label: "Sistema", icon: "phone-portrait-outline" },
          ]}
          onChange={setPreference}
        />
        <Choice
          legend="Colores de las pistas"
          value={prefs.palette}
          options={[{ value: "classic", label: "Clásicos" }, { value: "colorblind", label: "Daltonismo" }]}
          onChange={(palette) => prefs.set({ palette })}
          hint={prefs.palette === "colorblind" ? "Azul y naranja, con más contraste." : "Verde y amarillo."}
        />
        <TilePreview />
        <Choice
          legend="Tamaño de letra"
          value={prefs.text}
          options={[{ value: "normal", label: "Normal" }, { value: "large", label: "Grande" }]}
          onChange={(text) => prefs.set({ text })}
        />
        <Choice
          legend="Animaciones"
          value={prefs.motion}
          options={[{ value: "system", label: "Según el sistema" }, { value: "reduced", label: "Reducidas" }]}
          onChange={(motion) => prefs.set({ motion })}
          hint={prefs.motion === "reduced" ? "Todo aparece en su lugar, sin moverse." : "Cortas y suaves; si el teléfono pide menos movimiento, se apagan."}
        />
      </Section>

      <Section title="Juego">
        <Card style={{ gap: 4, paddingVertical: 8 }}>
          <Toggle
            label="Sonido"
            hint="Toques, aciertos y errores, bajito."
            value={prefs.sound}
            onChange={(on) => {
              prefs.set({ sound: on });
              if (on) sound("line", true);
            }}
          />
          <Toggle
            label="Vibración"
            hint="Al tocar, al ganar o al equivocarte."
            value={prefs.vibration}
            onChange={(on) => {
              prefs.set({ vibration: on });
              if (on && Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
            }}
          />
        </Card>
      </Section>

      <Section title="Más">
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
  return (
    <Card style={{ paddingVertical: 4, paddingHorizontal: 4 }}>
      <LinkRow icon="stats-chart-outline" label="Estadísticas" hint="Rachas y resultados de cada juego." onPress={() => router.push("/estadisticas")} />
      <LinkRow
        icon="star-outline"
        label="Craneá Plus"
        badge={plus ? <PlusBadge /> : undefined}
        hint={plus ? "Activo en tu cuenta. ¡Gracias!" : "Todos los niveles, el archivo y pistas sin límite."}
        onPress={() => paywall()}
      />
      <LinkRow icon="person-circle-outline" label="Tu cuenta" hint="Sesión, ranking y borrar la cuenta." onPress={() => router.push("/cuenta")} />
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
  return (
    <View
      accessible
      accessibilityLabel="Vista previa de las pistas"
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
          <Text variant="small" style={{ color: colors.clueExact }}>en su lugar</Text>
        </Row>
        <Row gap={6}>
          <Indicator kind="present" value={2} />
          <Text variant="small" style={{ color: colors.cluePresent }}>en otro lugar</Text>
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
