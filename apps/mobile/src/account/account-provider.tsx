import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { esES } from "@clerk/localizations";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";
import { accountsEnabled, clerkPublishableKey, convexUrl } from "@/lib/convex";
import { ProgressSync } from "./progress-sync";

const convex = accountsEnabled ? new ConvexReactClient(convexUrl!, { unsavedChangesWarning: false }) : null;

/**
 * Cuenta opcional, como en la web: sin sesión el progreso vive solo en el dispositivo.
 * La sesión de Clerk se guarda cifrada con expo-secure-store (token cache).
 * Convex valida el JWT de Clerk con la plantilla "convex" (apps/web/convex/auth.config.ts).
 */
export function AccountProvider({ children }: { children: ReactNode }) {
  if (!convex || !clerkPublishableKey) return <>{children}</>;
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache} localization={esES}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ProgressSync />
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
