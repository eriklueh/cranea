"use client";

import { useAuth } from "@clerk/nextjs";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import { applyEntitlement, settleEntitlement } from "@/lib/plus";

/** Sin conexión la cuenta puede no responder: después de esto se usa lo guardado. */
const WAIT_MS = 4000;

/** Lee Craneá Plus de la cuenta y lo guarda en el dispositivo. Va dentro del proveedor de Convex. */
export function PlusSync() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const mine = useQuery(api.entitlements.mine, isAuthenticated ? {} : "skip");

  // Solo se olvida Plus al cerrar sesión; sin conexión vale lo guardado.
  useEffect(() => {
    if (isLoaded && !isSignedIn) applyEntitlement(null);
    else if (isAuthenticated && mine !== undefined) applyEntitlement(mine);
  }, [isLoaded, isSignedIn, isAuthenticated, mine]);

  useEffect(() => {
    const t = setTimeout(settleEntitlement, WAIT_MS);
    return () => clearTimeout(t);
  }, []);

  return null;
}
