import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Stitch "Authentic Verity" design-system tokens (exact hex, used
        // where a precise match to the Stitch export is needed instead of
        // the shadcn semantic colors above).
        "surface-canvas": "#0A0E0F",
        "surface-card": "#12171A",
        "surface-card-elevated": "#151C20",
        "border-subtle": "#1A2228",
        "border-prominent": "#1F2933",
        "text-headline": "#F8FAFC",
        "text-body": "#B8C0C8",
        "text-metadata": "#64748B",
        "verdict-pass": "#0D9488",
        "verdict-warning": "#B8860B",
        "verdict-danger": "#9F1239",
        "verdict-indeterminate": "#475569",
      },
      fontFamily: {
        headline: ["var(--font-newsreader)", "Newsreader", "serif"],
        serif: ["var(--font-newsreader)", "Newsreader", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
        urdu: ["var(--font-urdu)", "Noto Nastaliq Urdu", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)", // 0.5rem — cards/modals
        md: "calc(var(--radius) - 2px)",
        sm: "0.25rem", // inputs/badges/inner cells
      },
    },
  },
  plugins: [animate],
};

export default config;
