"use client";

import { useEffect, useState } from "react";
import Dashboard from "@/components/Dashboard";
import SetupScreen from "@/components/SetupScreen";
import Starfield from "@/components/Starfield";
import WinnerScreen from "@/components/WinnerScreen";
import { useGame } from "@/lib/store";

export default function Home() {
  const phase = useGame((s) => s.phase);

  // Guard against SSR/client hydration mismatch: the persisted store only has
  // its real value after mount, so render a placeholder on the first paint.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="relative min-h-dvh">
      <Starfield />
      {!mounted ? (
        <div className="flex min-h-dvh items-center justify-center">
          <span className="animate-blink text-sm text-neon-cyan text-glow-cyan">
            LOADING<span>_</span>
          </span>
        </div>
      ) : phase === "setup" ? (
        <SetupScreen />
      ) : phase === "finished" ? (
        <WinnerScreen />
      ) : (
        <Dashboard />
      )}
    </main>
  );
}
