"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useGame } from "@/lib/store";

const RANK_COLORS = [
  "text-neon-yellow text-glow-yellow",
  "text-neon-cyan text-glow-cyan",
  "text-neon-pink text-glow-pink",
];

export default function Leaderboard() {
  const players = useGame((s) => s.players);

  const ranked = useMemo(
    () =>
      [...players].sort(
        (a, b) =>
          b.kills - a.kills ||
          Number(b.status === "alive") - Number(a.status === "alive") ||
          a.name.localeCompare(b.name)
      ),
    [players]
  );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-[10px] text-neon-yellow text-glow-yellow">
        HIGH SCORES
      </p>
      <ul className="flex flex-col gap-1">
        {ranked.map((p, i) => (
          <motion.li
            key={p.id}
            layout
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 border-b border-ink/15 px-2 py-2 text-[11px]"
          >
            <span className={`text-center ${RANK_COLORS[i] ?? "text-gray-500"}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={`truncate ${
                p.status === "alive" ? "text-neon-green" : "text-gray-500 line-through"
              }`}
            >
              {p.name}
            </span>
            <span className="text-right text-neon-pink text-glow-pink">
              {String(p.kills).padStart(3, "0")}
            </span>
          </motion.li>
        ))}
      </ul>
      {ranked.length === 0 && (
        <p className="py-8 text-center text-[10px] text-gray-500">NO PLAYERS</p>
      )}
    </div>
  );
}
