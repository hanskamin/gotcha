"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useGame } from "@/lib/store";
import Icon from "./Icon";

function timeLabel(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function Feed() {
  const players = useGame((s) => s.players);
  const feed = useGame((s) => s.feed);
  const undo = useGame((s) => s.undo);

  const nameOf = useMemo(() => {
    const m = new Map<string, string>();
    players.forEach((p) => m.set(p.id, p.name));
    return (id: string) => m.get(id) ?? "???";
  }, [players]);

  const entries = useMemo(() => [...feed].reverse(), [feed]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-neon-cyan/70">{feed.length} GOTCHAS</p>
        {feed.length > 0 && (
          <button
            onClick={() => undo()}
            className="arcade-btn border-neon-yellow px-3 py-2 text-[9px] text-neon-yellow"
            title="Undo the most recent gotcha"
          >
            <Icon>⟲</Icon> UNDO LAST
          </button>
        )}
      </div>

      <ul className="flex flex-col gap-1">
        {entries.map((e, i) => (
          <motion.li
            key={`${e.killerId}-${e.victimId}-${e.at}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 px-2 py-2 text-[11px] ${
              i === 0
                ? "border-2 border-neon-yellow bg-neon-yellow/15"
                : "border-b border-ink/15"
            }`}
          >
            <span className="shrink-0 text-[9px] text-neon-cyan/60">
              {timeLabel(e.at)}
            </span>
            <span className="truncate text-neon-green">{nameOf(e.killerId)}</span>
            <span className="shrink-0 text-neon-yellow">▸</span>
            <span className="truncate text-neon-pink line-through decoration-2">
              {nameOf(e.victimId)}
            </span>
          </motion.li>
        ))}
      </ul>

      {feed.length === 0 && (
        <p className="py-8 text-center text-[10px] text-gray-500">
          NO ELIMINATIONS LOGGED
        </p>
      )}
    </div>
  );
}
