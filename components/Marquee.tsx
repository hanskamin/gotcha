"use client";

/** Endlessly scrolling arcade marquee strip. */
export default function Marquee({ text }: { text: string }) {
  const cell = `★ ${text} `;
  return (
    <div className="overflow-hidden border-y-2 border-neon-cyan bg-panel py-1">
      <div className="animate-marquee whitespace-nowrap text-[10px] text-neon-cyan text-glow-cyan">
        <span className="inline-block">{cell.repeat(12)}</span>
        <span className="inline-block">{cell.repeat(12)}</span>
      </div>
    </div>
  );
}
