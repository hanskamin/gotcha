"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useGame } from "@/lib/store";
import Marquee from "./Marquee";
import Icon from "./Icon";

const MAX = 200;

export default function SetupScreen() {
  const setRoster = useGame((s) => s.setRoster);
  const startGame = useGame((s) => s.startGame);
  const [text, setText] = useState("");

  const { names, dupes, count } = useMemo(() => {
    const raw = text
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    const seen = new Set<string>();
    const dupeSet = new Set<string>();
    for (const n of raw) {
      const key = n.toLowerCase();
      if (seen.has(key)) dupeSet.add(n);
      seen.add(key);
    }
    return { names: raw, dupes: Array.from(dupeSet), count: raw.length };
  }, [text]);

  const canStart = count >= 2 && count <= MAX;

  const handleStart = () => {
    setRoster(names);
    // setRoster + startGame both operate on store state sequentially.
    startGame();
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-10 pt-6">
      <motion.h1
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="text-center text-4xl text-neon-pink text-glow-pink sm:text-6xl"
      >
        GOTCHA
      </motion.h1>
      <p className="mt-2 text-center text-[10px] leading-relaxed text-neon-cyan">
        CAMP ASSASSIN TRACKER
        <span className="animate-blink">_</span>
      </p>

      <div className="my-4">
        <Marquee text="ENTER YOUR HUNTERS — ONE NAME PER LINE — UP TO 200 PLAYERS" />
      </div>

      <div className="arcade-panel flex flex-1 flex-col p-4">
        <label className="mb-2 block text-[10px] text-neon-yellow text-glow-yellow">
          PLAYER ROSTER
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder={"Ada\nBlinky\nClyde\nDot\n..."}
          className="min-h-[40dvh] w-full flex-1 resize-none border-2 border-ink/40 bg-panel p-3 text-xs leading-relaxed text-ink outline-none focus:border-neon-cyan"
        />

        <div className="mt-3 flex items-center justify-between text-[10px]">
          <span
            className={
              count > MAX ? "text-neon-pink" : "text-neon-green text-glow-green"
            }
          >
            {count}/{MAX} PLAYERS
          </span>
          {dupes.length > 0 && (
            <span className="text-neon-yellow">
              <Icon>⚠</Icon> DUPES: {dupes.slice(0, 3).join(", ")}
              {dupes.length > 3 ? "…" : ""}
            </span>
          )}
        </div>

        {count > MAX && (
          <p className="mt-2 text-[10px] text-neon-pink">
            TOO MANY PLAYERS — MAX {MAX}.
          </p>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        disabled={!canStart}
        onClick={handleStart}
        className={`arcade-btn mt-5 w-full py-5 text-base ${
          canStart
            ? "border-neon-green text-neon-green text-glow-green shadow-neon-green animate-pulse-glow"
            : "cursor-not-allowed border-ink/20 text-ink/30"
        }`}
      >
        START GAME
      </motion.button>
      {!canStart && count < 2 && (
        <p className="mt-2 text-center text-[10px] text-gray-500">
          NEED AT LEAST 2 PLAYERS
        </p>
      )}
    </div>
  );
}
