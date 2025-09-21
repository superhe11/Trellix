import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb",
          foreground: "#ffffff",
          subtle: "#1d4ed8",
        },
        surface: {
          DEFAULT: "#0f172a",
          foreground: "#f8fafc",
          muted: "#1e293b",
        },
        accent: {
          DEFAULT: "#22d3ee",
          foreground: "#0f172a",
        },
        success: {
          DEFAULT: "#22c55e",
          foreground: "#052e16",
        },
        warning: {
          DEFAULT: "#facc15",
          foreground: "#422006",
        },
        danger: {
          DEFAULT: "#f87171",
          foreground: "#450a0a",
        },
      },
      borderRadius: {
        xl: "1rem",
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
      },
      boxShadow: {
        floating: "0 20px 45px -20px rgba(15, 23, 42, 0.45)",
      },
    },
  },
  plugins: [forms],
};

export default config;
