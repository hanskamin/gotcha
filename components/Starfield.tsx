"use client";

import { useEffect, useRef } from "react";

/** Animated 80s-style scrolling starfield drawn on a canvas. */
export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const COLORS = ["#0b7a91", "#c2156a", "#6a1b9a", "#1c7d28", "#a86600"];
    type Star = { x: number; y: number; z: number; c: string };
    let stars: Star[] = [];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const count = Math.min(160, Math.floor((w * h) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 1.5 + 0.3,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.y += s.z * 0.6;
        if (s.y > h) {
          s.y = 0;
          s.x = Math.random() * w;
        }
        const size = s.z * 1.6;
        ctx.globalAlpha = 0.12 + s.z * 0.08;
        ctx.fillStyle = s.c;
        ctx.fillRect(s.x, s.y, size, size);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
