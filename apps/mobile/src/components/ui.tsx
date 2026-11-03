import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { haptic } from "@/lib/haptics";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";

type Variant = "body" | "bodyBold" | "muted" | "small" | "title" | "display" | "label";

/** Texto con las fuentes de la marca. `display`/`title` usan Bricolage; el resto, Atkinson Hyperlegible. */
export function Text({ variant = "body", style, ...props }: TextProps & { variant?: Variant }) {
  const { colors, textScale } = useTheme();
  const base: TextStyle =
    variant === "display"
      ? { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34, color: colors.ink, letterSpacing: -0.5 }
      : variant === "title"
        ? { fontFamily: fonts.displayHeavy, fontSize: 22, lineHeight: 26, color: colors.ink }
        : variant === "bodyBold"
          ? { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22, color: colors.ink }
          : variant === "muted"
            ? { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.mutedForeground }
            : variant === "small"
              ? { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.mutedForeground }
              : variant === "label"
                ? { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: colors.mutedForeground }
                : { fontFamily: fonts.body, fontSize: 16, lineHeight: 22, color: colors.ink };
  return <RNText maxFontSizeMultiplier={1.6} {...props} style={textScale === 1 || props.maxFontSizeMultiplier === 1 ? [base, style] : scaled([base, style], textScale)} />;
}

const READING_FONTS: string[] = [fonts.body, fonts.bodyBold];

/**
 * Letra grande (Ajustes): agranda solo el texto de lectura (Atkinson). Las cifras, letras y números
 * de los tableros usan Bricolage o tamaños fijos (`maxFontSizeMultiplier={1}`), así no se desarman.
 */
function scaled(style: StyleProp<TextStyle>, k: number): TextStyle {
  const flat = StyleSheet.flatten(style) ?? {};
  if (!flat.fontFamily || !READING_FONTS.includes(flat.fontFamily)) return flat;
  return {
    ...flat,
    fontSize: flat.fontSize !== undefined ? Math.round(flat.fontSize * k) : undefined,
    lineHeight: flat.lineHeight !== undefined ? Math.round(flat.lineHeight * k) : undefined,
  };
}

export type IconName = ComponentProps<typeof Ionicons>["name"];

export function Icon({ name, size = 20, color, style }: { name: IconName; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={color ?? colors.ink} style={style} />;
}

/** Pantalla con scroll, fondo papel y márgenes seguros. */
export function Screen({ children, scroll = true, contentStyle }: { children: ReactNode; scroll?: boolean; contentStyle?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const style = [styles.content, { paddingBottom: insets.bottom + 24 }, contentStyle];
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: colors.paper }, style]}>{children}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.paper }} contentContainerStyle={style} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

type ButtonVariant = "primary" | "outline" | "ghost";

/** Botón con la sombra "de tinta" de la web. Mínimo 48 dp de alto para el dedo. */
export function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  disabled,
  loading,
  style,
  size = "md",
  accessibilityLabel,
}: {
  title: string;
  onPress?: PressableProps["onPress"];
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: "md" | "lg";
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const fg = variant === "primary" ? colors.primaryForeground : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      disabled={disabled || loading}
      onPress={(e) => {
        haptic("tap");
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.button,
        { minHeight: size === "lg" ? 52 : 46 },
        variant === "primary" && { backgroundColor: colors.primary, borderColor: colors.primary, ...shadow(colors.shadowInk, pressed ? 0 : 3) },
        variant === "outline" && { backgroundColor: colors.card, borderColor: colors.ink, ...shadow(colors.shadowInk, pressed ? 0 : 2) },
        variant === "ghost" && { backgroundColor: pressed ? colors.accent : "transparent", borderColor: "transparent" },
        pressed && variant !== "ghost" && { transform: [{ translateY: 2 }] },
        (disabled || loading) && { opacity: 0.4 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: size === "lg" ? 18 : 16, color: fg }}>{title}</Text>
    </Pressable>
  );
}

/**
 * Sombra dura hacia abajo (como `shadow-[0_4px_0_0_var(--shadow-ink)]` en la web), hecha con
 * un borde inferior más grueso: se ve igual en iOS y Android, sin `elevation` borrosa.
 */
export function shadow(color: string, y: number): ViewStyle {
  return { borderBottomWidth: 2 + y, borderBottomColor: color };
}

export function Card({ children, style, raised }: { children: ReactNode; style?: StyleProp<ViewStyle>; raised?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        raised
          ? { backgroundColor: colors.card, borderColor: colors.ink, ...shadow(colors.shadowInk, 4) }
          : { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Row({ children, style, gap = 8, ...props }: ViewProps & { gap?: number }) {
  return (
    <View {...props} style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>
      {children}
    </View>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <Screen scroll={false} contentStyle={{ alignItems: "center", justifyContent: "center", gap: 12 }}>
      <ActivityIndicator />
      <Text variant="muted">{label}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 12, gap: 14, width: "100%", maxWidth: 560, alignSelf: "center" },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 2,
    paddingHorizontal: 16,
  },
  card: { borderRadius: radius.xl, borderWidth: 2, padding: 16 },
});
