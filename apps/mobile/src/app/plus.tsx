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
import { useT, type Key, type T } from "@/lib/i18n";
import { isExpoGo } from "@/monetization/native";
import { freeTrialOf, getPackages, openManageSubscription, purchase, purchasesAvailable, restore, trialIneligible, trialText, type FreeTrial } from "@/monetization/purchases";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";

const HEADLINE: Record<PlusReason, Key> = {
  mundos: "plus.headlineMundos",
  archivo: "plus.headlineArchivo",
  pistas: "plus.headlinePistas",
  anuncios: "plus.headlineAnuncios",
};

const PERKS: { icon: IconName; title: Key; text: Key }[] = [
  { icon: "map-outline", title: "plus.perkWorlds", text: "plus.perkWorldsText" },
  { icon: "calendar-outline", title: "plus.perkArchive", text: "plus.perkArchiveText" },
  { icon: "bulb-outline", title: "plus.perkHints", text: "plus.perkHintsText" },
  { icon: "eye-off-outline", title: "plus.perkNoAds", text: "plus.perkNoAdsText" },
];

/**
 * Craneá Plus. Los precios salen de la oferta actual de RevenueCat (los cargan las tiendas): nunca
 * se escriben acá. Para comprar hay que tener cuenta, así Plus queda con la persona y vale en la web.
 */
export default function PlusScreen() {
  const { motivo } = useLocalSearchParams<{ motivo?: string }>();
  const plus = usePlus();
  const t = useT();
  const headline = motivo && motivo in HEADLINE ? t(HEADLINE[motivo as PlusReason]) : t("common.plus");

  return (
    <>
      <Stack.Screen options={{ title: t("common.plus") }} />
      <Screen contentStyle={{ gap: 18 }}>
        <View style={{ gap: 6 }}>
          <PlusBadge />
          <Text variant="display" accessibilityRole="header">{plus ? t("plus.alreadyPlus") : headline}</Text>
          <Text variant="muted">
            {plus ? t("plus.thanks") : t("plus.intro")}
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
  const t = useT();
  return (
    <Card style={{ gap: 14 }}>
      {PERKS.map((p) => (
        <Row key={p.title} gap={12} style={{ alignItems: "flex-start" }}>
          <View style={[styles.perkIcon, { backgroundColor: colors.cluePresentBg }]}>
            <Icon name={p.icon} size={18} color={colors.cluePresent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyBold">{t(p.title)}</Text>
            <Text variant="small">{t(p.text)}</Text>
          </View>
        </Row>
      ))}
    </Card>
  );
}

function Subscribed() {
  const router = useRouter();
  const t = useT();
  return (
    <View style={{ gap: 8 }}>
      <Button title={t("plus.keepPlaying")} size="lg" onPress={() => (router.canGoBack() ? router.back() : router.navigate("/"))} />
      <Button title={t("plus.manage")} variant="outline" icon="open-outline" onPress={openManageSubscription} />
    </View>
  );
}

function Buy() {
  const t = useT();
  if (!accountsEnabled || !purchasesAvailable()) {
    return (
      <Card>
        <Text variant="muted">
          {isExpoGo ? t("plus.expoGo") : t("plus.unavailable")}
        </Text>
      </Card>
    );
  }
  return <BuySignedIn />;
}

function BuySignedIn() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const t = useT();
  if (!isLoaded) return <ActivityIndicator />;
  if (!isSignedIn) {
    return (
      <Card raised style={{ gap: 12 }}>
        <Text variant="bodyBold">{t("plus.signInFirst")}</Text>
        <Text variant="muted">{t("plus.signInWhy")}</Text>
        <Button title={t("plus.signInAction")} icon="person-outline" size="lg" onPress={() => router.push("/cuenta")} />
      </Card>
    );
  }
  return <Plans />;
}

function Plans() {
  const { colors } = useTheme();
  const t = useT();
  const [packages, setPackages] = useState<PurchasesPackage[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "buy" | "restore">(null);
  const [message, setMessage] = useState<string | null>(null);
  const [noTrial, setNoTrial] = useState<Set<string>>(new Set());

  const load = () => {
    setFailed(false);
    setPackages(null);
    getPackages()
      .then((list) => {
        // Anual primero: es el que más conviene.
        const sorted = [...list].sort((a, b) => order(a) - order(b));
        setPackages(sorted);
        setPicked((p) => p ?? sorted[0]?.identifier ?? null);
        trialIneligible(sorted).then(setNoTrial);
      })
      .catch(() => setFailed(true));
  };
  useEffect(load, []);

  const selected = packages?.find((p) => p.identifier === picked) ?? null;
  const trialOf = (p: PurchasesPackage) => (noTrial.has(p.product.identifier) ? null : freeTrialOf(p));
  const selectedTrial = selected ? trialOf(selected) : null;

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
    else if (!r.plus) setMessage(t("plus.noSubscription"));
  };

  if (failed) {
    return (
      <Card style={{ gap: 10 }}>
        <Text variant="muted">{t("plus.loadFailed")}</Text>
        <Button title={t("plus.tryAgain")} variant="outline" icon="refresh" onPress={load} />
      </Card>
    );
  }
  if (!packages) return <ActivityIndicator accessibilityLabel={t("plus.loadingPlans")} />;
  if (!packages.length) return <Card><Text variant="muted">{t("plus.noPlans")}</Text></Card>;

  return (
    <View style={{ gap: 10 }}>
      <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
        {packages.map((p) => {
          const on = p.identifier === picked;
          const period = periodOf(p, t);
          const perMonth = p.packageType === "ANNUAL" && p.product.pricePerMonthString ? t("plus.perMonthEquiv", { price: p.product.pricePerMonthString }) : null;
          const free = trialOf(p);
          const trial = free ? trialTerms(free, p.product.priceString, period.per, t) : null;
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
      <Button title={selectedTrial ? t("plus.startTrial", { trial: trialText(selectedTrial, t) }) : t("plus.subscribe")} icon="star" size="lg" loading={busy === "buy"} disabled={!selected || busy !== null} onPress={buy} />
      {message && <Text style={{ color: colors.margin, textAlign: "center" }} accessibilityLiveRegion="polite">{message}</Text>}
      <Button title={t("plus.restore")} variant="ghost" loading={busy === "restore"} disabled={busy !== null} onPress={restoreNow} />
    </View>
  );
}

const order = (p: PurchasesPackage) => (p.packageType === "ANNUAL" ? 0 : p.packageType === "MONTHLY" ? 1 : 2);

function periodOf(p: PurchasesPackage, t: T) {
  if (p.packageType === "ANNUAL") return { name: t("plus.annual"), per: t("plus.perYear") };
  if (p.packageType === "MONTHLY") return { name: t("plus.monthly"), per: t("plus.perMonth") };
  if (p.packageType === "LIFETIME") return { name: t("plus.lifetime"), per: t("plus.once") };
  return { name: p.product.title, per: "" };
}

/** "2 días gratis, después USD 19,99 por año": lo que las tiendas piden que quede claro. */
function trialTerms(trial: FreeTrial, price: string, per: string, t: T) {
  return t("plus.trialTerms", { trial: trialText(trial, t), price: per ? `${price} ${per}` : price });
}

/** Lo que Apple y Google piden mostrar junto a una suscripción. */
function Legal() {
  const t = useT();
  const open = (url: string) => WebBrowser.openBrowserAsync(url).catch(() => {});
  return (
    <View style={{ gap: 6, alignItems: "center" }}>
      <Text variant="small" style={{ textAlign: "center" }}>
        {t("plus.legal")}
      </Text>
      <Row gap={16}>
        <Pressable onPress={() => open(TERMS_URL)} accessibilityRole="link" style={styles.link}>
          <Text variant="small" style={{ textDecorationLine: "underline" }}>{t("plus.terms")}</Text>
        </Pressable>
        <Pressable onPress={() => open(PRIVACY_URL)} accessibilityRole="link" style={styles.link}>
          <Text variant="small" style={{ textDecorationLine: "underline" }}>{t("common.privacy")}</Text>
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
