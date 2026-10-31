"use client";
import { useEffect, useState } from "react";
import { formatTime } from "@/lib/utils";
import { usePuentes } from "../store";

export function Timer() {
  const startedAt = usePuentes((s) => s.startedAt);
  const finishedAt = usePuentes((s) => s.finishedAt);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (finishedAt || !startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [finishedAt, startedAt]);
  if (!startedAt) return <span className="tabular-nums">0:00</span>;
  return <span className="tabular-nums">{formatTime(Math.max(0, (finishedAt ?? now) - startedAt))}</span>;
}
