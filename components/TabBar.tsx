"use client";

import { motion } from "framer-motion";

import Icon from "./Icon";

export type Tab = "targets" | "eliminated" | "leaderboard" | "feed";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "targets", label: "TARGETS", icon: "◎" },
  { id: "eliminated", label: "OUT", icon: "☠" },
  { id: "leaderboard", label: "SCORES", icon: "★" },
  { id: "feed", label: "FEED", icon: "≡" },
];

export default function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto grid max-w-2xl grid-cols-4 bg-void/95 backdrop-blur">
      {TABS.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="relative flex flex-col items-center gap-1 py-3 text-[9px]"
          >
            {on && (
              <motion.span
                layoutId="tab-underline"
                className="absolute inset-x-2 top-0 h-0.5 bg-neon-cyan shadow-neon-cyan"
              />
            )}
            <Icon
              className={`text-lg ${
                on ? "text-neon-cyan text-glow-cyan" : "text-gray-500"
              }`}
            >
              {t.icon}
            </Icon>
            <span className={on ? "text-neon-cyan" : "text-gray-500"}>
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
