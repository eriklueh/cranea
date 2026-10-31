"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ProgressSync } from "@/components/progress-sync";
import { PaywallSheet } from "@/components/plus/paywall";
import { PlusSync } from "@/components/plus/plus-sync";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = url ? new ConvexReactClient(url) : null;

/** Cuenta opcional: sin sesión el progreso sigue viviendo solo en el dispositivo. */
export function AccountProvider({ children }: { children: React.ReactNode }) {
  if (!convex) {
    return (
      <>
        {children}
        <PaywallSheet />
      </>
    );
  }
  return (
    <ClerkProvider localization={esES} appearance={{ variables: { colorPrimary: "#2f6fde" } }}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ProgressSync />
        <PlusSync />
        {children}
        <PaywallSheet />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export const accountsEnabled = !!convex;
