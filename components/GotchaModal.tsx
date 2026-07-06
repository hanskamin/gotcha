"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useGame } from "@/lib/store";
import type { Player } from "@/lib/types";
import Icon from "./Icon";

type Mode = "killer" | "victim";

export default function GotchaModal({
  open,
  onClose,
  onConfirmed,
}: {
  open: boolean;
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const players = useGame((s) => s.players);
  const gotchaByKiller = useGame((s) => s.gotchaByKiller);
  const gotchaByVictim = useGame((s) => s.gotchaByVictim);

  const [mode, setMode] = useState<Mode>("killer");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const nameOf = useMemo(() => {
    const m = new Map<string, string>();
    players.forEach((p) => m.set(p.id, p.name));
    return (id: string | null) => (id ? m.get(id) ?? "???" : "???");
  }, [players]);

  const alive = useMemo(
    () => players.filter((p) => p.status === "alive"),
    [players]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? alive.filter((p) => p.name.toLowerCase().includes(q))
      : alive;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [alive, query]);

  const selectedPlayer = selected
    ? players.find((p) => p.id === selected) ?? null
    : null;

  // Derive the killer/victim pairing from the current selection + mode.
  const pairing = useMemo(() => {
    if (!selectedPlayer) return null;
    if (mode === "killer") {
      return {
        killer: selectedPlayer,
        victim: players.find((p) => p.id === selectedPlayer.targetId) ?? null,
      };
    }
    const killer =
      players.find(
        (p) => p.status === "alive" && p.targetId === selectedPlayer.id
      ) ?? null;
    return { killer, victim: selectedPlayer };
  }, [selectedPlayer, mode, players]);

  const reset = () => {
    setQuery("");
    setSelected(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const confirm = () => {
    if (!pairing?.killer || !pairing?.victim) return;
    if (mode === "killer") gotchaByKiller(pairing.killer.id);
    else gotchaByVictim(pairing.victim.id);
    reset();
    onConfirmed();
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setSelected(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="arcade-panel max-h-[90dvh] w-full max-w-lg overflow-hidden border-neon-pink"
            style={{ boxShadow: "0 -6px 0 #c2156a" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-neon-pink/50 p-3">
              <h2 className="text-sm text-neon-pink text-glow-pink">
                LOG A GOTCHA
              </h2>
              <button
                onClick={close}
                className="px-2 text-neon-cyan hover:text-neon-pink"
                aria-label="Close"
              >
                <Icon>✕</Icon>
              </button>
            </div>

            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2 p-3">
              {(["killer", "victim"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`arcade-btn py-2 text-[10px] ${
                    mode === m
                      ? "border-neon-cyan text-neon-cyan text-glow-cyan"
                      : "border-ink/20 text-ink/40"
                  }`}
                >
                  {m === "killer" ? "PICK HUNTER" : "PICK VICTIM"}
                </button>
              ))}
            </div>

            <div className="px-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`SEARCH ${mode === "killer" ? "HUNTER" : "VICTIM"}…`}
                className="w-full border-2 border-ink/40 bg-panel p-3 text-xs text-ink outline-none focus:border-neon-cyan"
                autoFocus
              />
            </div>

            <div className="mt-2 max-h-[34dvh] overflow-y-auto px-3">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`mb-1 flex w-full items-center justify-between border-2 px-3 py-3 text-left text-[11px] ${
                    selected === p.id
                      ? "border-neon-pink bg-neon-pink/10 text-neon-pink"
                      : "border-ink/10 bg-paper text-neon-green hover:border-neon-green/50"
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  {mode === "killer" && (
                    <span className="ml-2 shrink-0 text-[9px] text-neon-cyan/70">
                      <Icon>→</Icon> {nameOf(p.targetId)}
                    </span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="py-6 text-center text-[10px] text-gray-500">
                  NO MATCHES
                </p>
              )}
            </div>

            {/* Confirm bar */}
            <div className="border-t-2 border-neon-pink/50 p-3">
              {pairing && pairing.killer && pairing.victim ? (
                <ConfirmRow killer={pairing.killer} victim={pairing.victim} />
              ) : (
                <p className="py-2 text-center text-[10px] text-gray-500">
                  {selectedPlayer
                    ? "NO VALID HUNTER FOR THIS PLAYER"
                    : "SELECT A PLAYER"}
                </p>
              )}
              <motion.button
                whileTap={{ scale: 0.96 }}
                disabled={!pairing?.killer || !pairing?.victim}
                onClick={confirm}
                className={`arcade-btn mt-2 w-full py-4 text-sm ${
                  pairing?.killer && pairing?.victim
                    ? "border-neon-pink text-neon-pink text-glow-pink shadow-neon-pink animate-pulse-glow"
                    : "cursor-not-allowed border-ink/20 text-ink/30"
                }`}
              >
                CONFIRM GOTCHA
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ConfirmRow({ killer, victim }: { killer: Player; victim: Player }) {
  return (
    <div className="flex items-center justify-center gap-2 text-[11px]">
      <span className="truncate text-neon-green text-glow-green">
        {killer.name}
      </span>
      <span className="shrink-0 text-neon-yellow">👉🏽</span>
      <span className="truncate text-neon-pink text-glow-pink line-through decoration-2">
        {victim.name}
      </span>
    </div>
  );
}
