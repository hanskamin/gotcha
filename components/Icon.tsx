import type { ReactNode } from "react";

/**
 * Renders a Unicode icon glyph at a consistent, enlarged size.
 *
 * The pixel UI font ("Press Start 2P") lacks symbol glyphs, so they fall back
 * to the system font and render small next to the chunky pixel letters. The
 * `.icon` utility (app/globals.css) scales them up relative to surrounding
 * text — that class is the single knob for icon sizing app-wide.
 */
export default function Icon({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span aria-hidden className={`icon ${className}`}>
      {children}
    </span>
  );
}
