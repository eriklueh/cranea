import { useAuth } from "@clerk/expo";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { PlusBadge, type PlusReason } from "@/components/plus";
import { Button, Card, Icon, Row, Screen, Text, type IconName } from "@/components/ui";
import { PRIVACY_URL, TERMS_URL } from "@/config";
import { usePlus } from "@/entitlements";
import { accountsEnabled } from "@/lib/convex";
import { haptic } from "@/lib/haptics";
import { isExpoGo } from "@/monetization/native";
import { getPackages, openManageSubscription, purchase, purchasesAvailable, restore } from "@/monetization/purchases";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";

const HEADLINE: Record<PlusReason, string> = {
  mundos: "Todos los mundos te esperan",
  archivo: "Jugá los diarios que te perdiste",
  pistas: "Pistas cuando las necesites",
  anuncios: "Sin anuncios",
};

const PERKS: { icon: IconName; title: string; text: string }[] = [
  { icon: "map-outline", title: "Todos los mundos y niveles", text: "En todos los juegos, a tu ritmo." },
  { icon: "calendar-outline", title: "Archivo de diarios", text: "Los desafíos de días anteriores, para practicar." },
  { icon: "bulb-outline", title: "Pistas sin límite", text: "Cuando te trabás, sin esperar." },
  { icon: "eye-off-outline", title: "Sin anuncios", text: "Nunca vas a ver uno." },
];

/**
 * Craneá Plus. Los precios salen de la oferta actual de RevenueCat (los cargan las tiendas): nunca
 * se escriben acá. Para comprar hay que tener cuenta, así Plus queda con la persona y vale en la web.
 */
export default function PlusScreen() {
  const { motivo } = useLocalSearchParams<{ motivo?: string }>();
  const plus = usePlus();
  const headline = motivo && motivo in HEADLINE ? HEADLINE[motivo as PlusReason] : "Craneá Plus";

  return (
    <>
      <Stack.Screen options={{ title: "Craneá Plus" }} />
      <Screen contentStyle={{ gap: 18 }}>
        <View style={{ gap: 6 }}>
          <PlusBadge />
          <Text variant="display" accessibilityRole="header">{plus ? "Ya tenés Plus" : headline}</Text>
          <Text variant="muted">
            {plus ? "¡Gracias por bancar Craneá! Tenés todo abierto, en el celular y en la web." : "Los desafíos del día, el ranking y tus estadísticas son y van a seguir siendo gratis. Plus suma esto:"}
          </Text>
        </View>
        <Perks />
        {plus ? <Subscribed /> : <Buy />}
        <Legal />
      </Screen>
    </>
  );
}

function Perks() {
  const { colors } = useTheme();
  return (
    <Card style={{ gap: 14 }}>
      {PERKS.map((p) => (
        <Row key={p.title} gap={12} style={{ alignItems: "flex-start" }}>
          <View style={[styles.perkIcon, { backgroundColor: colors.cluePresentBg }]}>
            <Icon name={p.icon} size={18} color={colors.cluePresent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyBold">{p.title}</Text>
            <Text variant="small">{p.text}</Text>
          </View>
        </Row>
      ))}
    </Card>
  );
}

function Subscribed() {
  const router = useRouter();
  return (
    <View style={{ gap: 8 }}>
      <Button title="Seguir jugando" size="lg" onPress={() => (router.canGoBack() ? router.back() : router.navigate("/"))} />
      <Button title="Gestionar suscripción" variant="outline" icon="open-outline" onPress={openManageSubscription} />
    </View>
  );
}

function Buy() {
  if (!accountsEnabled || !purchasesAvailable()) {
    return (
      <Card>
        <Text variant="muted">
          {isExpoGo ? "Las compras no funcionan en Expo Go. Probalas con un development build." : "Las compras todavía no están disponibles en esta versión."}
        </Text>
      </Card>
    );
  }
  return <BuySignedIn />;
}

function BuySignedIn() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  if (!isLoaded) return <ActivityIndicator />;
  if (!isSignedIn) {
    return (
      <Card raised style={{ gap: 12 }}>
        <Text variant="bodyBold">Primero, entrá a tu cuenta</Text>
        <Text variant="muted">Así Plus queda con vos: en este celular, en otro y en la web.</Text>
        <Button title="Entrar o crear cuenta" icon="person-outline" size="lg" onPress={() => router.push("/cuenta")} />
      </Card>
    );
  }
  return <Plans />;
}

function Plans() {
  const { colors } = useTheme();
  const [packages, setPackages] = useState<PurchasesPackage[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "buy" | "restore">(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    setFailed(false);
    setPackages(null);
    getPackages()
      .then((list) => {
        // Anual primero: es el que más conviene.
        const sorted = [...list].sort((a, b) => order(a) - order(b));
        setPackages(sorted);
        setPicked((p) => p ?? sorted[0]?.identifier ?? null);
      })
      .catch(() => setFailed(true));
  };
  useEffect(load, []);

  const selected = packages?.find((p) => p.identifier === picked) ?? null;

  const buy = async () => {
    if (!selected) return;
    setBusy("buy");
    setMessage(null);
    const r = await purchase(selected);
    setBusy(null);
    if (r.ok) haptic("win");
    else if (!r.cancelled) setMessage(r.message);
  };

  const restoreNow = async () => {
    setBusy("restore");
    setMessage(null);
    const r = await restore();
    setBusy(null);
    if ("error" in r) setMessage(r.error);
    else if (!r.plus) setMessage("No encontramos una suscripción con esta cuenta de la tienda.");
  };

  if (failed) {
    return (
      <Card style={{ gap: 10 }}>
        <Text variant="muted">No pudimos cargar los planes. Revisá la conexión.</Text>
        <Button title="Probar de nuevo" variant="outline" icon="refresh" onPress={load} />
      </Card>
    );
  }
  if (!packages) return <ActivityIndicator accessibilityLabel="Cargando planes" />;
  if (!packages.length) return <Card><Text variant="muted">Los planes todavía no están disponibles. Probá más tarde.</Text></Card>;

  return (
    <View style={{ gap: 10 }}>
      <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
        {packages.map((p) => {
          const on = p.identifier === picked;
          const period = periodOf(p);
          const perMonth = p.packageType === "ANNUAL" && p.product.pricePerMonthString ? `Equivale a ${p.product.pricePerMonthString} por mes` : null;
          const trial = p.product.introPrice?.price === 0 ? `Probalo gratis: ${trialText(p.product.introPrice.periodNumberOfUnits, p.product.introPrice.periodUnit)}` : null;
          return (
            <Pressable
              key={p.identifier}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${period.name}: ${p.product.priceString} ${period.per}${perMonth ? `. ${perMonth}` : ""}${trial ? `. ${trial}` : ""}`}
              onPress={() => setPicked(p.identifier)}
              style={[styles.plan, { borderColor: on ? colors.ink : colors.border, backgroundColor: colors.card }, on && { borderWidth: 3 }]}
            >
              <Icon name={on ? "radio-button-on" : "radio-button-off"} color={on ? colors.ink : colors.mutedForeground} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyBold">{period.name}</Text>
                {perMonth && <Text variant="small">{perMonth}</Text>}
                {trial && <Text variant="small" style={{ color: colors.ok }}>{trial}</Text>}
              </View>
              <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 18, color: colors.ink }}>
                {p.product.priceString}
                <Text variant="small"> {period.per}</Text>
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Button title="Suscribirme" icon="star" size="lg" loading={busy === "buy"} disabled={!selected || busy !== null} onPress={buy} />
      {message && <Text style={{ color: colors.margin, textAlign: "center" }} accessibilityLiveRegion="polite">{message}</Text>}
      <Button title="Restaurar compras" variant="ghost" loading={busy === "restore"} disabled={busy !== null} onPress={restoreNow} />
    </View>
  );
}

const order = (p: PurchasesPackage) => (p.packageType === "ANNUAL" ? 0 : p.packageType === "MONTHLY" ? 1 : 2);

function periodOf(p: PurchasesPackage) {
  if (p.packageType === "ANNUAL") return { name: "Anual", per: "por año" };
  if (p.packageType === "MONTHLY") return { name: "Mensual", per: "por mes" };
  if (p.packageType === "LIFETIME") return { name: "Para siempre", per: "una vez" };
  return { name: p.product.title, per: "" };
}

function trialText(n: number, unit: string) {
  const names: Record<string, [string, string]> = { DAY: ["día", "días"], WEEK: ["semana", "semanas"], MONTH: ["mes", "meses"], YEAR: ["año", "años"] };
  const [one, many] = names[unit] ?? ["", ""];
  return `${n} ${n === 1 ? one : many}`;
}

/** Lo que Apple y Google piden mostrar junto a una suscripción. */
function Legal() {
  const open = (url: string) => WebBrowser.openBrowserAsync(url).catch(() => {});
  return (
    <View style={{ gap: 6, alignItems: "center" }}>
      <Text variant="small" style={{ textAlign: "center" }}>
        La suscripción se renueva sola hasta que la canceles, y se cobra a tu cuenta de la tienda. Podés cancelarla cuando quieras desde la tienda, hasta 24 h antes de la renovación.
      </Text>
      <Row gap={16}>
        <Pressable onPress={() => open(TERMS_URL)} accessibilityRole="link" style={styles.link}>
          <Text variant="small" style={{ textDecorationLine: "underline" }}>Términos de uso</Text>
        </Pressable>
        <Pressable onPress={() => open(PRIVACY_URL)} accessibilityRole="link" style={styles.link}>
          <Text variant="small" style={{ textDecorationLine: "underline" }}>Privacidad</Text>
        </Pressable>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  perkIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  plan: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 2, borderRadius: radius.xl, padding: 14, minHeight: 64 },
  link: { minHeight: 44, justifyContent: "center" },
});
