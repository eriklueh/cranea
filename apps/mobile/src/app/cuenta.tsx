import { useAuth, useClerk, useSignIn, useSignUp, useSSO, useUser } from "@clerk/expo";
import { useSignInWithApple } from "@clerk/expo/apple";
import * as AppleAuthentication from "expo-apple-authentication";
import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Switch, TextInput, View } from "react-native";
import { PlusBadge, usePlusPaywall } from "@/components/plus";
import { Button, Card, Icon, Row, Screen, Text } from "@/components/ui";
import { PRIVACY_URL } from "@/config";
import { usePlus } from "@/entitlements";
import { adPrivacyOptionsRequired, adsAvailable, showAdPrivacyOptions } from "@/monetization/ads";
import { openManageSubscription } from "@/monetization/purchases";
import { api, accountsEnabled } from "@/lib/convex";
import { useTheme, type ThemePreference } from "@/theme/theme";
import { fonts, radius } from "@/theme/tokens";

// Cierra la ventana del navegador cuando Google vuelve a la app.
WebBrowser.maybeCompleteAuthSession();

/** Cuenta y ajustes. La cuenta es opcional: sin sesión todo funciona en el dispositivo. */
export default function AccountScreen() {
  return (
    <Screen contentStyle={{ gap: 18 }}>
      {accountsEnabled ? <Account /> : <Card><Text variant="muted">Las cuentas no están configuradas en esta versión. Tu progreso se guarda en este dispositivo.</Text></Card>}
      <PlusCard />
      <ThemePicker />
      <About />
    </Screen>
  );
}

function Account() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <Card><Text variant="muted">Cargando tu cuenta…</Text></Card>;
  return isSignedIn ? <SignedIn /> : <SignInForm />;
}

/** Código de error de Clerk ("form_identifier_not_found", …), venga como error de API o propio. */
function clerkCode(e: unknown) {
  const x = e as { errors?: { code?: string }[]; code?: string } | null;
  return x?.errors?.[0]?.code ?? x?.code;
}

function clerkMessage(e: unknown) {
  const code = clerkCode(e);
  if (code === "form_code_incorrect") return "El código no es correcto.";
  if (code === "verification_expired") return "El código venció. Pedí otro.";
  if (code === "form_param_format_invalid" || code === "form_identifier_invalid") return "Revisá el mail.";
  if (code === "too_many_requests") return "Demasiados intentos. Esperá un momento.";
  const x = e as { errors?: { longMessage?: string; message?: string }[]; message?: string } | null;
  return x?.errors?.[0]?.longMessage ?? x?.errors?.[0]?.message ?? x?.message ?? "No se pudo. Probá de nuevo.";
}

/** Entrar con Google o con un código por mail (sin contraseñas). Si el mail es nuevo, crea la cuenta. */
function SignInForm() {
  const { colors } = useTheme();
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
      setError(clerkMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const sendCode = async () => {
    const emailAddress = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(emailAddress)) return setError("Escribí un mail válido.");
    setBusy("email");
    setError(null);
    try {
      const sent = await signIn.emailCode.sendCode({ emailAddress });
      if (!sent.error) return setStep({ kind: "code", flow: "signIn" });
      if (clerkCode(sent.error) !== "form_identifier_not_found") return setError(clerkMessage(sent.error));
      // Mail nuevo: se crea la cuenta y se verifica con el mismo código.
      const created = await signUp.create({ emailAddress });
      if (created.error) return setError(clerkMessage(created.error));
      const mailed = await signUp.verifications.sendEmailCode();
      if (mailed.error) return setError(clerkMessage(mailed.error));
      setStep({ kind: "code", flow: "signUp" });
    } catch (e) {
      setError(clerkMessage(e));
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
        if (r.error) return setError(clerkMessage(r.error));
        // Si la cuenta pide un paso más (por ejemplo, segundo factor), finalize avisa con un error.
        const f = await signIn.finalize();
        if (f.error) setError(clerkMessage(f.error));
      } else {
        const r = await signUp.verifications.verifyEmailCode({ code: code.trim() });
        if (r.error) return setError(clerkMessage(r.error));
        // Si Clerk pide más datos para crear la cuenta (nombre, aceptar términos), finalize avisa con un error.
        const f = await signUp.finalize();
        if (f.error) setError(clerkMessage(f.error));
      }
    } catch (e) {
      setError(clerkMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const input = [styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.ink }];

  return (
    <Card raised style={{ gap: 12 }}>
      <Text variant="title">Guardá tu progreso</Text>
      <Text variant="muted">Con una cuenta, tus partidas se juntan entre el celular y la web, y tus diarios entran al ranking.</Text>
      {step.kind === "email" ? (
        <>
          {Platform.OS === "ios" && <AppleButton disabled={busy !== null} onBusy={(b) => setBusy(b ? "apple" : null)} onError={setError} />}
          <Button title="Continuar con Google" icon="logo-google" variant="outline" size="lg" loading={busy === "google"} disabled={busy !== null} onPress={google} />
          <Row gap={8}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text variant="small">o con tu mail</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </Row>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tu@mail.com"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={sendCode}
            accessibilityLabel="Mail"
            style={input}
          />
          <Button title="Enviarme un código" size="lg" loading={busy === "email"} disabled={busy !== null} onPress={sendCode} />
        </>
      ) : (
        <>
          <Text>Te mandamos un código a <Text variant="bodyBold">{email.trim()}</Text>.</Text>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            returnKeyType="done"
            onSubmitEditing={verify}
            accessibilityLabel="Código"
            style={[input, { fontFamily: fonts.display, fontSize: 24, letterSpacing: 6, textAlign: "center" }]}
          />
          <Button title="Entrar" size="lg" loading={busy === "code"} disabled={busy !== null || code.trim().length < 6} onPress={verify} />
          <Button title="Usar otro mail" variant="ghost" onPress={() => { setStep({ kind: "email" }); setCode(""); setError(null); }} />
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
            if ((e as { code?: string })?.code !== "ERR_REQUEST_CANCELED") onError(clerkMessage(e));
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
  const [saving, setSaving] = useState(false);

  const remove = () =>
    Alert.alert("Borrar tu cuenta", "Se borra tu cuenta y dejás de aparecer en el ranking. El progreso de este dispositivo queda acá. No se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: async () => {
          try {
            await setRanked({ ranked: false }).catch(() => {});
            await user?.delete();
          } catch {
            Alert.alert("No se pudo borrar la cuenta", "Probá de nuevo más tarde.");
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
            <Text variant="bodyBold" style={{ flexShrink: 1 }}>{user?.fullName || user?.firstName || "Tu cuenta"}</Text>
            <AccountPlusBadge />
          </Row>
          <Text variant="small">{user?.primaryEmailAddress?.emailAddress}</Text>
        </View>
      </Row>
      <Text variant="small">Tu progreso se sincroniza con la web.</Text>
      <Row style={{ justifyContent: "space-between", paddingVertical: 4 }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyBold">Aparecer en el ranking</Text>
          <Text variant="small">{profile ? `Como «${profile.name}».` : "Cargando…"}</Text>
        </View>
        <Switch
          value={profile?.ranked ?? true}
          disabled={!profile || saving}
          onValueChange={async (ranked) => {
            setSaving(true);
            await setRanked({ ranked }).catch(() => {});
            setSaving(false);
          }}
          accessibilityLabel="Aparecer en el ranking"
        />
      </Row>
      <Button title="Cerrar sesión" variant="outline" icon="log-out-outline" onPress={() => signOut()} />
      <Pressable onPress={remove} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center", alignSelf: "center" }}>
        <Text style={{ color: colors.margin, fontFamily: fonts.bodyBold }}>Borrar mi cuenta</Text>
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
          <Text variant="bodyBold">Tenés Craneá Plus</Text>
          <PlusBadge />
        </Row>
        <Text variant="small">Todos los mundos, el archivo de diarios y pistas sin límite, sin anuncios. También vale en la web.</Text>
        <Button title="Gestionar suscripción" variant="outline" icon="open-outline" onPress={openManageSubscription} />
      </Card>
    );
  }
  return (
    <View style={{ gap: 4 }}>
      <Card style={{ gap: 10 }}>
        <Row gap={8}>
          <Text variant="bodyBold">Craneá Plus</Text>
          <PlusBadge />
        </Row>
        <Text variant="small">Todos los mundos, diarios anteriores, pistas sin límite y sin anuncios. Los desafíos del día siguen siendo gratis.</Text>
        <Button title="Conocer Craneá Plus" variant="outline" icon="star" onPress={() => paywall()} />
      </Card>
      {privacy && (
        <Pressable onPress={showAdPrivacyOptions} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center", alignSelf: "center" }}>
          <Text variant="bodyBold" style={{ fontSize: 14, textDecorationLine: "underline" }}>Privacidad de los anuncios</Text>
        </Pressable>
      )}
    </View>
  );
}

function ThemePicker() {
  const { colors, preference, setPreference } = useTheme();
  const options: { value: ThemePreference; label: string }[] = [
    { value: "system", label: "Automático" },
    { value: "light", label: "Cuaderno" },
    { value: "dark", label: "Pizarrón" },
  ];
  return (
    <View style={{ gap: 8 }}>
      <Text variant="label">Tema</Text>
      <View accessibilityRole="radiogroup" style={[styles.segment, { backgroundColor: colors.muted }]}>
        {options.map((o) => {
          const selected = preference === o.value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setPreference(o.value)}
              style={[styles.segmentItem, selected && { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={{ fontFamily: fonts.bodyBold, color: selected ? colors.ink : colors.mutedForeground }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function About() {
  return (
    <View style={{ gap: 6, alignItems: "center", marginTop: 8 }}>
      <Pressable onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL).catch(() => {})} accessibilityRole="link" style={{ minHeight: 44, justifyContent: "center" }}>
        <Text variant="bodyBold" style={{ textDecorationLine: "underline" }}>Política de privacidad</Text>
      </Pressable>
      <Text variant="small">Craneá {Constants.expoConfig?.version ?? ""}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 2, borderRadius: radius.md, minHeight: 50, paddingHorizontal: 14, fontSize: 17, fontFamily: fonts.body },
  segment: { flexDirection: "row", borderRadius: radius.xl, padding: 4, gap: 4 },
  segmentItem: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.lg, borderWidth: 1, borderColor: "transparent" },
});
