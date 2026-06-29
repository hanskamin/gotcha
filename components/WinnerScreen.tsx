"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useGame } from "@/lib/store";

const CONFETTI = Array.from({ length: 40 });
const COLORS = ["#c2156a", "#0b7a91", "#1c7d28", "#a86600", "#6a1b9a"];

export default function WinnerScreen() {
  const players = useGame((s) => s.players);
  const winnerId = useGame((s) => s.winnerId);
  const feed = useGame((s) => s.feed);
  const newGame = useGame((s) => s.newGame);

  const winner = players.find((p) => p.id === winnerId);

  const podium = useMemo(
    () => [...players].sort((a, b) => b.kills - a.kills).slice(0, 3),
    [players]
  );

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* Confetti */}
      {CONFETTI.map((_, i) => (
        <motion.span
          key={i}
          className="absolute top-0 h-2 w-2"
          style={{
            left: `${(i * 37) % 100}%`,
            backgroundColor: COLORS[i % COLORS.length],
          }}
          initial={{ y: -40, opacity: 0, rotate: 0 }}
          animate={{ y: "100dvh", opacity: [0, 1, 1, 0], rotate: 360 }}
          transition={{
            duration: 2.5 + (i % 5) * 0.4,
            repeat: Infinity,
            delay: (i % 10) * 0.2,
            ease: "linear",
          }}
        />
      ))}

      <motion.p
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-neon-cyan text-glow-cyan"
      >
        GAME OVER
      </motion.p>

      <motion.h1
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
        className="my-4 text-4xl text-neon-yellow text-glow-yellow sm:text-6xl"
      >
        WINNER!
      </motion.h1>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="arcade-panel border-neon-yellow px-6 py-5"
        style={{ boxShadow: "6px 6px 0 #a86600" }}
      >
        <motion.p
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="text-2xl text-neon-pink text-glow-pink sm:text-3xl"
        >
          {winner?.name ?? "???"}
        </motion.p>
        <p className="mt-3 text-[10px] text-neon-green text-glow-green">
          {winner?.kills ?? 0} ELIMINATIONS · LAST ONE STANDING
        </p>
      </motion.div>

      {/* Mini podium */}
      <div className="mt-6 w-full max-w-xs">
        <p className="mb-2 text-[10px] text-neon-cyan/70">★ TOP HUNTERS ★</p>
        {podium.map((p, i) => (
          <div
            key={p.id}
            className="flex justify-between border-b border-ink/15 py-1 text-[11px]"
          >
            <span className="text-ink/80">
              {i + 1}. {p.name}
            </span>
            <span className="text-neon-pink">{p.kills}</span>
          </div>
        ))}
        <p className="mt-2 text-[9px] text-gray-500">{feed.length} TOTAL GOTCHAS</p>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (confirm("Start a brand-new game? This clears the current game."))
            newGame();
        }}
        className="arcade-btn mt-8 border-neon-green text-neon-green text-glow-green shadow-neon-green animate-pulse-glow"
      >
        ▶ NEW GAME
      </motion.button>
    </div>
  );
}
