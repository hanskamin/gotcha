import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Daytime arcade palette: warm paper + deep ink, high-contrast accents
        // chosen to stay legible in bright sunlight.
        void: "#fdf3df", // page background (light)
        paper: "#fdf3df",
        panel: "#ffffff",
        ink: "#241640", // text + borders (deep indigo, near-black)
        neon: {
          pink: "#c2156a",
          cyan: "#0b7a91", // deep teal — readable on white
          green: "#1c7d28",
          yellow: "#a86600", // amber/gold
          purple: "#6a1b9a",
          orange: "#c2410c",
        },
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", "monospace"],
      },
      boxShadow: {
        // Chunky hard-offset arcade shadows (no soft glow → stays crisp in sun)
        arcade: "4px 4px 0 #241640",
        "arcade-sm": "2px 2px 0 #241640",
        "neon-pink": "4px 4px 0 #c2156a",
        "neon-cyan": "3px 3px 0 #0b7a91",
        "neon-green": "4px 4px 0 #1c7d28",
        "neon-yellow": "4px 4px 0 #a86600",
      },
      keyframes: {
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "marquee-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.72" },
        },
      },
      animation: {
        blink: "blink 1s steps(1) infinite",
        marquee: "marquee-scroll 18s linear infinite",
        "pulse-glow": "pulse-glow 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
