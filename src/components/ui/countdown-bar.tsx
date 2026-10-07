"use client";

import { useEffect, useRef, useState } from "react";

interface CountdownBarProps {
  deadlineAt: string;
  servedAt: string;
  serverTime: string;
  timerSeconds: number;
  onExpire: () => void;
}

/**
 * A shrinking bar driven by the server's deadline, not the device clock.
 * `serverTime`/`servedAt` let us compute the client/server clock offset once
 * so the bar still tracks accurately even if the device clock is off.
 */
export function CountdownBar({
  deadlineAt,
  serverTime,
  timerSeconds,
  onExpire,
}: CountdownBarProps) {
  const [percent, setPercent] = useState(100);

  // Always call the latest handler so it sees current state (e.g. "already answered").
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    const clockOffsetMs = Date.now() - new Date(serverTime).getTime();
    const deadlineMs = new Date(deadlineAt).getTime() + clockOffsetMs;
    const totalMs = timerSeconds * 1000;
    let expired = false;

    const tick = () => {
      const remaining = deadlineMs - Date.now();
      const pct = Math.max(0, Math.min(100, (remaining / totalMs) * 100));
      setPercent(pct);
      if (remaining <= 0 && !expired) {
        expired = true;
        onExpireRef.current();
      }
    };

    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [deadlineAt, serverTime, timerSeconds]);

  const colorClass =
    percent > 50 ? "bg-green-400" : percent > 20 ? "bg-yellow-400" : "bg-red-400";

  return (
    <div
      className="w-full h-3 rounded-full bg-white/10 overflow-hidden"
      role="progressbar"
      aria-label="Time remaining"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-100 ease-linear ${colorClass}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
