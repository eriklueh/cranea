"use client";
import { useEffect, useState } from "react";
import { formatTime } from "@/lib/utils";
import { playedMs, useCifra } from "../store";

export function Timer() {
  const startedAt = useCifra((s) => s.startedAt);
  const elapsed = useCifra((s) => s.elapsed);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return <span className="tabular-nums">{formatTime(playedMs({ elapsed, startedAt }, Math.max(now, startedAt)))}</span>;
}
