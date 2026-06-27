import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0f172a",
        "navy-soft": "#1e293b",
        canvas: "#f8f7f4",
        surface: "#ffffff",
        "surface-soft": "#f1f5f3",
        line: "#e5e7eb",
        "line-strong": "#cbd5d1",
        body: "#171d1c",
        muted: "#5f6b68",
        teal: "#0d9488",
        "teal-dark": "#00685f",
        "teal-soft": "#d7f6f1",
        gold: "#b59410",
        "gold-soft": "#fff3c4",
        danger: "#ba1a1a",
        "danger-soft": "#ffe4e1"
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"]
      },
      boxShadow: {
        operational: "0 18px 45px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
