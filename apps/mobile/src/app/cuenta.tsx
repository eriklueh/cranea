import { useAuth, useClerk, useSignIn, useSignUp, useSSO, useUser } from "@clerk/expo";
import { useSignInWithApple } from "@clerk/expo/apple";
import * as AppleAuthentication from "expo-apple-authentication";
import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useMutation, useQuery, useAction } from "convex/react";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Switch, TextInput, View } from "react-native";
import { PlusBadge, usePlusPaywall } from "@/components/plus";
import { Button, Card, Icon, Row, Screen, Text } from "@/components/ui";
import { legalUrl } from "@/config";
import { usePlus } from "@/entitlements";
import { adPrivacyOptionsRequired, adsAvailable, showAdPrivacyOptions } from "@/monetization/ads";
import { openManageSubscription } from "@/monetization/purchases";
import { api, accountsEnabled } from "@/lib/convex";
import { useT, type T, getLocale } from "@/lib/i18n";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";

// Cierra la ventana del navegador cuando Google vuelve a la app.
WebBrowser.maybeCompleteAuthSession();

/** Tu cuenta: sesión, ranking, Plus y borrar la cuenta. Lo del dispositivo está en Ajustes. La cuenta es opcional. */
export default function AccountScreen() {
  const t = useT();
  return (
    <Screen contentStyle={{ gap: 18 }}>
      {accountsEnabled ? <Account /> : <Card><Text variant="muted">{t("account.notConfigured")}</Text></Card>}
      <PlusCard />
      <SettingsLink />
      <About />
    </Screen>
  );
}

function Account() {
  const { isLoaded, isSignedIn } = useAuth();
  const t = useT();
  if (!isLoaded) return <Card><Text variant="muted">{t("account.loading")}</Text></Card>;
  return isSignedIn ? <SignedIn /> : <SignInForm />;
}

/** Código de error de Clerk ("form_identifier_not_found", …), venga como error de API o propio. */
function clerkCode(e: unknown) {
  const x = e as { errors?: { code?: string }[]; code?: string } | null;
  return x?.errors?.[0]?.code ?? x?.code;
}

function clerkMessage(e: unknown, t: T) {
  const code = clerkCode(e);
  if (code === "form_code_incorrect") return t("account.errCode");
  if (code === "verification_expired") return t("account.errExpired");
  if (code === "form_param_format_invalid" || code === "form_identifier_invalid") return t("account.errEmail");
  if (code === "too_many_requests") return t("account.errTooMany");
  const x = e as { errors?: { longMessage?: string; message?: string }[]; message?: string } | null;
  return x?.errors?.[0]?.longMessage ?? x?.errors?.[0]?.message ?? x?.message ?? t("account.errGeneric");
}

/** Entrar con Google o con un código por mail (sin contraseñas). Si el mail es nuevo, crea la cuenta. */
function SignInForm() {
  const { colors } = useTheme();
  const t = useT();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<{ kind: "email" } | { kind: "code"; flow: "signIn" | "signUp" }>({ kind: "email" });
  const [busy, setBusy] = useState<null | "apple" | "google" | "email" | "code">(null);
  const [error, setError] = useState<string | null>(null);

  // En Android, precargar el navegador hace que Google abra más rápido.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const google = async () => {
    setBusy("google");
    setError(null);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri({ scheme: "cranea", path: "sso-callback" }),
      });
      if (createdSessionId && setActive) await setActive({ session: createdSessionId });
    } catch (e) {
      setError(clerkMessage(e, t));
    } finally {
      setBusy(null);
    }
  };

  const sendCode = async () => {
    const emailAddress = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(emailAddress)) return setError(t("account.invalidEmail"));
    setBusy("email");
    setError(null);
    try {
      const sent = await signIn.emailCode.sendCode({ emailAddress });
      if (!sent.error) return setStep({ kind: "code", flow: "signIn" });
      if (clerkCode(sent.error) !== "form_identifier_not_found") return setError(clerkMessage(sent.error, t));
      // Mail nuevo: se crea la cuenta y se verifica con el mismo código.
      const created = await signUp.create({ emailAddress });
      if (created.error) return setError(clerkMessage(created.error, t));
      const mailed = await signUp.verifications.sendEmailCode();
      if (mailed.error) return setError(clerkMessage(mailed.error, t));
      setStep({ kind: "code", flow: "signUp" });
    } catch (e) {
      setError(clerkMessage(e, t));
    } finally {
      setBusy(null);
    }
  };

  const verify = async () => {
    if (step.kind !== "code") return;
    setBusy("code");
    setError(null);
    try {
      if (step.flow === "signIn") {
        const r = await signIn.emailCode.verifyCode({ code: code.trim() });
        if (r.error) return setError(clerkMessage(r.error, t));
        // Si la cuenta pide un paso más (por ejemplo, segundo factor), finalize avisa con un error.
        const f = await signIn.finalize();
        if (f.error) setError(clerkMessage(f.error, t));
      } else {
        const r = await signUp.verifications.verifyEmailCode({ code: code.trim() });
        if (r.error) return setError(clerkMessage(r.error, t));
        // Si Clerk pide más datos para crear la cuenta (nombre, aceptar términos), finalize avisa con un error.
        const f = await signUp.finalize();
        if (f.error) setError(clerkMessage(f.error, t));
      }
    } catch (e) {
      setError(clerkMessage(e, t));
    } finally {
      setBusy(null);
    }
  };

  const input = [styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.ink }];

  return (
    <Card raised style={{ gap: 12 }}>
      <Text variant="title">{t("account.saveTitle")}</Text>
      <Text variant="muted">{t("account.saveBody")}</Text>
      {step.kind === "email" ? (
        <>
          {Platform.OS === "ios" && <AppleButton disabled={busy !== null} onBusy={(b) => setBusy(b ? "apple" : null)} onError={setError} />}
          <Button title={t("account.google")} icon="logo-google" variant="outline" size="lg" loading={busy === "google"} disabled={busy !== null} onPress={google} />
          <Row gap={8}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text variant="small">{t("account.orEmail")}</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </Row>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t("account.emailPlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={sendCode}
            accessibilityLabel={t("account.emailLabel")}
            style={input}
          />
          <Button title={t("account.sendCode")} size="lg" loading={busy === "email"} disabled={busy !== null} onPress={sendCode} />
        </>
      ) : (
        <>
          <Text>{t("account.codeSentBefore")}<Text variant="bodyBold">{email.trim()}</Text>{t("account.codeSentAfter")}</Text>
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            returnKeyType="done"
            onSubmitEditing={verify}
            accessibilityLabel={t("account.codeLabel")}
            style={[input, { fontFamily: fonts.display, fontSize: 24, letterSpacing: 6, textAlign: "center" }]}
          />
          <Button title={t("account.signIn")} size="lg" loading={busy === "code"} disabled={busy !== null || code.trim().length < 6} onPress={verify} />
          <Button title={t("account.otherEmail")} variant="ghost" onPress={() => { setStep({ kind: "email" }); setCode(""); setError(null); }} />
        </>
      )}
      {error && <Text style={{ color: colors.margin }} accessibilityLiveRegion="polite">{error}</Text>}
    </Card>
  );
}

/** Sign in with Apple (solo iOS): App Review lo exige cuando la app ofrece entrar con Google. */
function AppleButton({ disabled, onBusy, onError }: { disabled: boolean; onBusy: (busy: boolean) => void; onError: (message: string | null) => void }) {
  const { scheme } = useTheme();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const t = useT();
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAvailable).catch(() => {});
  }, []);
  if (!available) return null;
  return (
    <View pointerEvents={disabled ? "none" : "auto"} style={{ opacity: disabled ? 0.5 : 1 }}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={scheme === "dark" ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={radius.md}
        style={{ height: 50 }}
        onPress={async () => {
          onBusy(true);
          onError(null);
          try {
            const { createdSessionId, setActive } = await startAppleAuthenticationFlow();
            if (createdSessionId && setActive) await setActive({ session: createdSessionId });
          } catch (e) {
            if ((e as { code?: string })?.code !== "ERR_REQUEST_CANCELED") onError(clerkMessage(e, t));
          } finally {
            onBusy(false);
          }
        }}
      />
    </View>
  );
}

function SignedIn() {
  const { colors } = useTheme();
  const { user } = useUser();
  const { signOut } = useClerk();
  const profile = useQuery(api.ranking.profile);
  const setRanked = useMutation(api.ranking.setRanked);
  const deleteMyAccount = useAction(api.account.deleteMyAccount);
  const [saving, setSaving] = useState(false);
  const t = useT();

  const remove = () =>
    Alert.alert(t("account.deleteTitle"), t("account.deleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("account.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            // Convex borra los datos y la cuenta de Clerk; después se cierra la sesión acá.
            await deleteMyAccount({});
            await signOut();
          } catch {
            Alert.alert(t("account.deleteFailed"), t("account.tryLater"));
          }
        },
      },
    ]);

  return (
    <Card raised style={{ gap: 12 }}>
      <Row gap={12}>
        <Icon name="person-circle" size={44} color={colors.ink} />
        <View style={{ flex: 1 }}>
          <Row gap={6}>
            <Text variant="bodyBold" style={{ flexShrink: 1 }}>{user?.fullName || user?.firstName || t("shell.accountTitle")}</Text>
            <AccountPlusBadge />
          </Row>
          <Text variant="small">{user?.primaryEmailAddress?.emailAddress}</Text>
        </View>
      </Row>
      <Text variant="small">{t("account.synced")}</Text>
      <Row style={{ justifyContent: "space-between", paddingVertical: 4 }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyBold">{t("account.ranked")}</Text>
          <Text variant="small">{profile ? t("account.rankedAs", { name: profile.name }) : t("common.loading")}</Text>
        </View>
        <Switch
          value={profile?.ranked ?? true}
          disabled={!profile || saving}
          onValueChange={async (ranked) => {
            setSaving(true);
            await setRanked({ ranked }).catch(() => {});
            setSaving(false);
          }}
          accessibilityLabel={t("account.ranked")}
        />
      </Row>
      <Button title={t("account.signOut")} variant="outline" icon="log-out-outline" onPress={() => signOut()} />
      <Pressable onPress={remove} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center", alignSelf: "center" }}>
        <Text style={{ color: colors.margin, fontFamily: fonts.bodyBold }}>{t("account.deleteMine")}</Text>
      </Pressable>
    </Card>
  );
}

function AccountPlusBadge() {
  return usePlus() ? <PlusBadge /> : null;
}

/** Plus: con suscripción, cómo gestionarla; sin ella, una invitación (y el consentimiento de anuncios). */
function PlusCard() {
  const plus = usePlus();
  const paywall = usePlusPaywall();
  const [privacy, setPrivacy] = useState(false);
  const t = useT();
  useEffect(() => {
    if (plus || !adsAvailable()) return;
    let alive = true;
    adPrivacyOptionsRequired().then((v) => alive && setPrivacy(v));
    return () => {
      alive = false;
    };
  }, [plus]);

  if (plus) {
    return (
      <Card style={{ gap: 10 }}>
        <Row gap={8}>
          <Text variant="bodyBold">{t("account.hasPlus")}</Text>
          <PlusBadge />
        </Row>
        <Text variant="small">{t("account.plusActiveBody")}</Text>
        <Button title={t("plus.manage")} variant="outline" icon="open-outline" onPress={openManageSubscription} />
      </Card>
    );
  }
  return (
    <View style={{ gap: 4 }}>
      <Card style={{ gap: 10 }}>
        <Row gap={8}>
          <Text variant="bodyBold">{t("common.plus")}</Text>
          <PlusBadge />
        </Row>
        <Text variant="small">{t("account.plusPitch")}</Text>
        <Button title={t("plus.discover")} variant="outline" icon="star" onPress={() => paywall()} />
      </Card>
      {privacy && (
        <Pressable onPress={showAdPrivacyOptions} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center", alignSelf: "center" }}>
          <Text variant="bodyBold" style={{ fontSize: 14, textDecorationLine: "underline" }}>{t("account.adPrivacy")}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Tema, colores, letra, animaciones, sonido, vibración y recordatorio: en Ajustes. */
function SettingsLink() {
  const { colors } = useTheme();
  const router = useRouter();
  const t = useT();
  return (
    <Pressable
      onPress={() => router.push("/ajustes")}
      accessibilityRole="button"
      accessibilityLabel={`${t("common.settings")}. ${t("account.settingsHint")}`}
      style={({ pressed }) => [styles.settings, { borderColor: colors.border, backgroundColor: pressed ? colors.accent : colors.card }]}
    >
      <Icon name="settings-outline" size={22} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyBold">{t("common.settings")}</Text>
        <Text variant="small">{t("account.settingsHint")}</Text>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.pencil} />
    </Pressable>
  );
}

function About() {
  const t = useT();
  return (
    <View style={{ gap: 6, alignItems: "center", marginTop: 8 }}>
      <Pressable onPress={() => WebBrowser.openBrowserAsync(legalUrl("privacy", getLocale())).catch(() => {})} accessibilityRole="link" style={{ minHeight: 44, justifyContent: "center" }}>
        <Text variant="bodyBold" style={{ textDecorationLine: "underline" }}>{t("account.privacyPolicy")}</Text>
      </Pressable>
      <Text variant="small">{t("common.appName")} {Constants.expoConfig?.version ?? ""}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 2, borderRadius: radius.md, minHeight: 50, paddingHorizontal: 14, fontSize: 17, fontFamily: fonts.body },
  settings: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, borderWidth: 2, borderRadius: radius.xl, paddingHorizontal: 16, paddingVertical: 10 },
});
