import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { enUS, esES } from "@clerk/localizations";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";
import { Protectors } from "@/components/protectors";
import { ReminderScheduler } from "@/components/reminder";
import { accountsEnabled, clerkPublishableKey, convexUrl } from "@/lib/convex";
import { useLocale } from "@/lib/i18n";
import { EntitlementsSync } from "@/monetization/sync";
import { ProgressSync } from "./progress-sync";

const convex = accountsEnabled ? new ConvexReactClient(convexUrl!, { unsavedChangesWarning: false }) : null;

/**
 * Cuenta opcional, como en la web: sin sesión el progreso vive solo en el dispositivo.
 * La sesión de Clerk se guarda cifrada con expo-secure-store (token cache).
 * Convex valida el JWT de Clerk con la plantilla "convex" (apps/web/convex/auth.config.ts).
 */
export function AccountProvider({ children }: { children: ReactNode }) {
  // Textos propios de Clerk (errores, mails) en el idioma activo.
  const locale = useLocale();
  if (!convex || !clerkPublishableKey) {
    return (
      <>
        {children}
        <Protectors synced={false} />
        <ReminderScheduler />
      </>
    );
  }
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache} localization={locale === "en" ? enUS : esES}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ProgressSync />
        <EntitlementsSync />
        {children}
        <Protectors synced />
        <ReminderScheduler />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
