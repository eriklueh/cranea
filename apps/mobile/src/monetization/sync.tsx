import { useAuth } from "@clerk/expo";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect } from "react";
import { AppState } from "react-native";
import { usePlusState } from "@/entitlements";
import { api } from "@/lib/convex";
import { identify, refreshCustomerInfo } from "./purchases";

/**
 * Con la cuenta: identifica a RevenueCat con el id de Clerk (logIn / logOut) y trae Plus de Convex.
 * Va dentro de ClerkProvider + ConvexProvider (account-provider.tsx).
 */
export function EntitlementsSync() {
  const { isLoaded, userId } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const hydrated = usePlusState((s) => s.hydrated);
  const mine = useQuery(api.entitlements.mine, isAuthenticated ? {} : "skip");

  // Cambió la cuenta: lo guardado de otra cuenta no vale, y RevenueCat pasa a la nueva.
  useEffect(() => {
    if (!isLoaded || !hydrated) return;
    usePlusState.getState().setOwner(userId ?? null);
    void identify(userId ?? null);
  }, [isLoaded, hydrated, userId]);

  useEffect(() => {
    if (!mine || !hydrated || usePlusState.getState().owner !== userId) return;
    usePlusState.getState().setServer({ active: mine.plus, until: mine.expiresAt });
  }, [mine, hydrated, userId]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void refreshCustomerInfo();
    });
    return () => sub.remove();
  }, []);

  return null;
}
