import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'pixel': ['VT323', 'monospace'],
        'orbitron': ['Orbitron', 'sans-serif'],
      },
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
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Dark Theme Colors
        'primary-blue': '#3b82f6',
        'primary-purple': '#8b5cf6',
        'primary-green': '#10b981',
        'accent-orange': '#f59e0b',
        'accent-red': '#ef4444',
        'accent-teal': '#14b8a6',
        'accent-indigo': '#6366f1',
        'dark': {
          100: '#0a0a0a',
          200: '#0f0f0f',
          300: '#151515',
          400: '#1a1a1a',
          500: '#202020',
          600: '#262626',
          700: '#2d2d2d',
          800: '#333333',
          900: '#404040',
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "glow": {
          "0%, 100%": { 
            boxShadow: "0 0 3px rgba(59, 130, 246, 0.3), 0 0 6px rgba(59, 130, 246, 0.2)",
            filter: "brightness(1)"
          },
          "50%": { 
            boxShadow: "0 0 6px rgba(59, 130, 246, 0.4), 0 0 12px rgba(59, 130, 246, 0.3)",
            filter: "brightness(1.1)"
          },
        },
        "text-glow": {
          "0%, 100%": {
            textShadow: "0 0 3px rgba(59, 130, 246, 0.5), 0 0 6px rgba(59, 130, 246, 0.3)",
          },
          "50%": {
            textShadow: "0 0 6px rgba(59, 130, 246, 0.6), 0 0 12px rgba(59, 130, 246, 0.4)",
          },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "slide-glow": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow": "glow 2s ease-in-out infinite",
        "text-glow": "text-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "slide-glow": "slide-glow 2s linear infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
