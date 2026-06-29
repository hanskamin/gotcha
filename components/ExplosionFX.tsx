"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

const COLORS = ["#c2156a", "#0b7a91", "#1c7d28", "#a86600", "#6a1b9a"];
const PARTICLES = 18;

/**
 * Full-screen "GOTCHA!" explosion overlay. Renders while `show` is true and
 * calls onDone shortly after, so the parent can unmount it.
 */
export default function ExplosionFX({
  show,
  label = "GOTCHA!",
  onDone,
}: {
  show: boolean;
  label?: string;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, 850);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="boom"
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Flash */}
          <motion.div
            className="absolute inset-0 bg-neon-pink/20"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />

          {/* Particles */}
          {Array.from({ length: PARTICLES }).map((_, i) => {
            const angle = (i / PARTICLES) * Math.PI * 2;
            const dist = 120 + (i % 4) * 40;
            return (
              <motion.span
                key={i}
                className="absolute h-3 w-3"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos(angle) * dist,
                  y: Math.sin(angle) * dist,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            );
          })}

          {/* Word */}
          <motion.div
            className="relative font-pixel text-3xl text-neon-yellow text-glow-yellow sm:text-5xl"
            initial={{ scale: 0.2, rotate: -8 }}
            animate={{ scale: [0.2, 1.3, 1], rotate: [-8, 4, 0] }}
            transition={{ duration: 0.5 }}
          >
            {label}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
