"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useGame } from "@/lib/store";
import Icon from "./Icon";

export default function TargetList() {
  const players = useGame((s) => s.players);
  const feed = useGame((s) => s.feed);
  const reshuffle = useGame((s) => s.reshuffle);
  const removePlayer = useGame((s) => s.removePlayer);
  const [query, setQuery] = useState("");

  const nameOf = useMemo(() => {
    const m = new Map<string, string>();
    players.forEach((p) => m.set(p.id, p.name));
    return (id: string | null) => (id ? m.get(id) ?? "???" : "—");
  }, [players]);

  const alive = useMemo(
    () => players.filter((p) => p.status === "alive"),
    [players]
  );

  const pristine = feed.length === 0 && alive.length === players.length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? alive.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            nameOf(p.targetId).toLowerCase().includes(q)
        )
      : alive;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [alive, query, nameOf]);

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-10 flex gap-2 bg-void/90 py-1 backdrop-blur">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SEARCH…"
          className="min-w-0 flex-1 border-2 border-ink/40 bg-panel p-3 text-xs text-ink outline-none focus:border-neon-cyan"
        />
        {pristine && (
          <button
            onClick={() => reshuffle()}
            className="arcade-btn border-neon-purple px-3 py-2 text-[9px] text-neon-purple"
            title="Re-randomize chain (only before the first elimination)"
          >
            <Icon>⟳</Icon> SHUFFLE
          </button>
        )}
      </div>

      <p className="text-[10px] text-neon-cyan/70">
        {alive.length} ALIVE · HUNTER <Icon className="text-neon-yellow">▸</Icon> TARGET
      </p>

      <ul className="flex flex-col gap-2">
        <AnimatePresence>
          {filtered.map((p) => (
            <motion.li
              key={p.id}
              layout
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="flex items-center justify-between border-2 border-l-8 border-ink/15 border-l-neon-green bg-panel px-3 py-3 text-[11px] shadow-arcade-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-neon-green">{p.name}</span>
                <Icon className="shrink-0 text-neon-yellow">▸</Icon>
                <span className="truncate text-neon-pink text-glow-pink">
                  {nameOf(p.targetId)}
                </span>
              </span>
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Remove ${p.name} from the game (dropout, not a kill)?`
                    )
                  )
                    removePlayer(p.id);
                }}
                className="ml-2 shrink-0 px-2 text-gray-500 hover:text-neon-pink"
                title="Player dropped out"
              >
                <Icon>✕</Icon>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-[10px] text-gray-500">
          NO PLAYERS MATCH
        </p>
      )}
    </div>
  );
}
