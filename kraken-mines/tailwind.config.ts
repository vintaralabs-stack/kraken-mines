import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: "#050a12",
          900: "#0a1220",
          800: "#0f1a2e",
          700: "#152238",
          600: "#1c2d4a",
        },
        gold: {
          300: "#E8C547",
          400: "#d4af37",
          500: "#c9a227",
          600: "#a8861e",
        },
        crimson: {
          300: "#FCA5A5",
          400: "#dc2626",
          500: "#b91c1c",
          600: "#991b1b",
          700: "#7f1d1d",
          800: "#5c1520",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        "treasure-glow": "treasureGlow 2.8s ease-in-out infinite",
        "crimson-pulse": "crimsonPulse 0.55s ease-out",
        "grid-gold-flash": "gridGoldFlash 1.4s ease-out forwards",
        "controls-gold-flash": "controlsGoldFlash 1.4s ease-out forwards",
        "crimson-status": "crimsonStatusPulse 0.7s ease-out",
        shake: "shake 0.55s ease-in-out",
        "shake-soft": "shakeSoft 0.55s ease-in-out",
      },
      keyframes: {
        treasureGlow: {
          "0%, 100%": {
            boxShadow: "inset 0 0 0 rgba(212, 175, 55, 0)",
          },
          "50%": {
            boxShadow: "inset 0 0 18px rgba(212, 175, 55, 0.07)",
          },
        },
        crimsonPulse: {
          "0%, 100%": { boxShadow: "inset 0 0 0 rgba(185, 28, 28, 0)" },
          "45%": { boxShadow: "inset 0 0 22px rgba(185, 28, 28, 0.18)" },
        },
        gridGoldFlash: {
          "0%": { boxShadow: "0 0 0 rgba(212, 175, 55, 0)" },
          "35%": { boxShadow: "0 0 36px rgba(212, 175, 55, 0.4)" },
          "100%": { boxShadow: "0 0 0 rgba(212, 175, 55, 0)" },
        },
        controlsGoldFlash: {
          "0%": { boxShadow: "inset 0 0 0 rgba(212, 175, 55, 0)" },
          "35%": { boxShadow: "inset 0 0 20px rgba(212, 175, 55, 0.15)" },
          "100%": { boxShadow: "inset 0 0 0 rgba(212, 175, 55, 0)" },
        },
        crimsonStatusPulse: {
          "0%": { opacity: "0.65", transform: "scale(0.98)" },
          "40%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shake: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "15%": { transform: "translate(-6px, 2px)" },
          "30%": { transform: "translate(6px, -2px)" },
          "45%": { transform: "translate(-4px, -1px)" },
          "60%": { transform: "translate(4px, 1px)" },
          "75%": { transform: "translate(-2px, 0)" },
        },
        shakeSoft: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-4px)" },
          "40%": { transform: "translateX(4px)" },
          "60%": { transform: "translateX(-2px)" },
          "80%": { transform: "translateX(2px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
