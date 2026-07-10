import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#3B82F6",
          foreground: "#FFFFFF",
        },
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
        background: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E5E7EB",
        dark: {
          background: "#060a14",
          surface: "#0c1024",
          card: "#1E293B",
          text: "#F8FAFC",
        },
        muted: "#6B7280",
        glass: {
          border: "rgba(255,255,255,0.06)",
          hover: "rgba(255,255,255,0.10)",
          bg: "rgba(255,255,255,0.04)",
          surface: "rgba(255,255,255,0.03)",
          highlight: "rgba(255,255,255,0.05)",
        },
        neon: {
          blue: "#3B82F6",
          purple: "#A855F7",
          cyan: "#06B6D4",
          green: "#22C55E",
          amber: "#F59E0B",
          red: "#EF4444",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "fade-in-up": "fadeSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-in-down": "fadeSlideDown 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "neon-pulse": "neonPulse 3s ease-in-out infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "orb-float-1": "orbFloat1 25s ease-in-out infinite",
        "orb-float-2": "orbFloat2 30s ease-in-out infinite",
        "orb-float-3": "orbFloat3 28s ease-in-out infinite",
        "shimmer": "shimmerSlide 3.5s ease-in-out infinite",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        "glass": "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.03) inset",
        "glass-hover": "0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.08) inset, 0 0 40px rgba(99, 102, 241, 0.03)",
        "glass-lg": "0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04) inset",
        "neon-blue": "0 0 15px rgba(59, 130, 246, 0.1), 0 0 45px rgba(59, 130, 246, 0.04)",
        "neon-purple": "0 0 15px rgba(168, 85, 247, 0.1), 0 0 45px rgba(168, 85, 247, 0.04)",
        "neon-cyan": "0 0 15px rgba(6, 182, 212, 0.1), 0 0 45px rgba(6, 182, 212, 0.04)",
        "depth-sm": "0 2px 8px rgba(0, 0, 0, 0.2)",
        "depth-md": "0 8px 32px rgba(0, 0, 0, 0.3)",
        "depth-lg": "0 20px 60px rgba(0, 0, 0, 0.4)",
        "depth-xl": "0 24px 80px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
