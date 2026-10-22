"use client";
import { useEffect, useState } from "react";

/** true después del primer render en el cliente (evita desajustes con datos de localStorage). */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
