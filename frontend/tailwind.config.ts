import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./stores/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        accent: "hsl(var(--accent))",
        line: "hsl(var(--line))",
        panel: "hsl(var(--panel))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        xl2: "1.5rem"
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono-stack)"]
      }
    }
  },
  plugins: []
}

export default config
