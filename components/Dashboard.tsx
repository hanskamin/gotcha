"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useGame } from "@/lib/store";
import EliminatedList from "./EliminatedList";
import ExplosionFX from "./ExplosionFX";
import Feed from "./Feed";
import GotchaModal from "./GotchaModal";
import Leaderboard from "./Leaderboard";
import Marquee from "./Marquee";
import TabBar, { type Tab } from "./TabBar";
import TargetList from "./TargetList";

export default function Dashboard() {
  const players = useGame((s) => s.players);
  const addPlayer = useGame((s) => s.addPlayer);

  const [tab, setTab] = useState<Tab>("targets");
  const [modalOpen, setModalOpen] = useState(false);
  const [boom, setBoom] = useState(false);

  const aliveCount = players.filter((p) => p.status === "alive").length;
  const outCount = players.length - aliveCount;

  const handleAdd = () => {
    const name = window.prompt("Add a late arrival — player name:");
    if (name && name.trim()) addPlayer(name.trim());
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-28 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl text-neon-pink text-glow-pink">GOTCHA</h1>
        <div className="flex items-center gap-3 text-[9px]">
          <span className="text-neon-green text-glow-green">
            {aliveCount} ALIVE
          </span>
          <span className="text-neon-pink">{outCount} OUT</span>
          <button
            onClick={handleAdd}
            className="arcade-btn border-neon-purple px-2 py-1 text-[9px] text-neon-purple"
          >
            ADD
          </button>
        </div>
      </div>

      <div className="my-3">
        <Marquee text="STAY FROSTY — WATCH YOUR BACK — GOTCHA IS AFOOT" />
      </div>

      {/* Tab content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {tab === "targets" && <TargetList />}
            {tab === "eliminated" && <EliminatedList />}
            {tab === "leaderboard" && <Leaderboard />}
            {tab === "feed" && <Feed />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating GOTCHA button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setModalOpen(true)}
        className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2 border-2 border-neon-pink bg-panel px-6 py-4 text-sm text-neon-pink text-glow-pink shadow-neon-pink animate-pulse-glow"
      >
        GOTCHA!
      </motion.button>

      <TabBar active={tab} onChange={setTab} />

      <GotchaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirmed={() => {
          setModalOpen(false);
          setBoom(true);
        }}
      />

      <ExplosionFX show={boom} onDone={() => setBoom(false)} />
    </div>
  );
}
