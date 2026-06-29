"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useGame } from "@/lib/store";

export default function EliminatedList() {
  const players = useGame((s) => s.players);

  const nameOf = useMemo(() => {
    const m = new Map<string, string>();
    players.forEach((p) => m.set(p.id, p.name));
    return (id: string | null) => (id ? m.get(id) ?? "???" : null);
  }, [players]);

  const out = useMemo(
    () =>
      players
        .filter((p) => p.status === "out")
        .sort((a, b) => (b.eliminatedAt ?? 0) - (a.eliminatedAt ?? 0)),
    [players]
  );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] text-neon-cyan/70">{out.length} ELIMINATED</p>
      {out.map((p, i) => {
        const killer = nameOf(p.eliminatedById);
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(i * 0.02, 0.3) }}
            className="flex items-center justify-between border-2 border-l-8 border-ink/15 border-l-neon-pink bg-panel px-3 py-3 text-[11px]"
          >
            <span className="truncate text-ink/50 line-through decoration-neon-pink decoration-2">
              {p.name}
            </span>
            <span className="ml-2 shrink-0 text-[9px]">
              {killer ? (
                <span className="text-neon-cyan/80">GOT BY {killer}</span>
              ) : (
                <span className="text-neon-yellow/80">DROPPED OUT</span>
              )}
            </span>
          </motion.div>
        );
      })}
      {out.length === 0 && (
        <p className="py-8 text-center text-[10px] text-gray-500">
          NOBODY&apos;S BEEN GOT YET
        </p>
      )}
    </div>
  );
}
