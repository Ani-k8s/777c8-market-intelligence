/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Core backgrounds
        ink: "#07070F",
        surface: "#0D0D1A",
        surfaceHigh: "#121220",
        surfaceMid: "#10101E",

        // Borders
        line: "#1C1C2E",
        lineGlow: "#2A0A10",
        lineGold: "#2A1E00",

        // Brand — Deep Crimson Red
        brand: "#C8102E",
        brandLight: "#E8192C",
        brandDim: "rgba(200,16,46,0.10)",
        brandGlow: "rgba(200,16,46,0.25)",

        // Gold — Luxury Amber
        gold: "#C9920A",
        goldLight: "#F0B429",
        goldDim: "rgba(201,146,10,0.10)",
        goldGlow: "rgba(201,146,10,0.25)",

        // Semantic
        success: "#22C55E",
        successDim: "rgba(34,197,94,0.10)",
        danger: "#EF4444",
        dangerDim: "rgba(239,68,68,0.10)",
        caution: "#F59E0B",
        cautionDim: "rgba(245,158,11,0.10)",
        signal: "#60A5FA",
        signalDim: "rgba(96,165,250,0.10)",

        // Text
        textPrimary: "#F0F0F8",
        textSecondary: "#8888AA",
        textMuted: "#4A4A6A",

        // Legacy aliases (keeps existing Dashboard code working)
        panel: "#0D0D1A",
        panelSoft: "#121220",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        // Premium glow shadows
        glow: "0 0 0 1px rgba(200,16,46,0.15), 0 24px 80px rgba(0,0,0,0.55)",
        glowGold: "0 0 0 1px rgba(201,146,10,0.20), 0 24px 80px rgba(0,0,0,0.55)",
        glowSm: "0 0 0 1px rgba(200,16,46,0.12), 0 8px 32px rgba(0,0,0,0.45)",
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 24px 80px rgba(0,0,0,0.50)",
        navbar: "0 1px 0 0 rgba(200,16,46,0.08), 0 4px 24px rgba(0,0,0,0.40)",
        inner: "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        // Premium gradient fills
        "brand-gradient": "linear-gradient(135deg, #8B0000 0%, #C8102E 50%, #A00020 100%)",
        "gold-gradient": "linear-gradient(135deg, #7A5500 0%, #C9920A 50%, #9A7000 100%)",
        "card-gradient": "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)",
        "hero-gradient":
          "radial-gradient(ellipse at 20% 50%, rgba(200,16,46,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(201,146,10,0.10) 0%, transparent 40%)",
        "dot-grid":
          "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
        "sidebar-gradient":
          "linear-gradient(180deg, rgba(200,16,46,0.05) 0%, rgba(201,146,10,0.02) 100%)",
      },
      backgroundSize: {
        "dot-grid": "28px 28px",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        pulse_glow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.15)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        countUp: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        shimmer: "shimmer 1.8s linear infinite",
        pulse_glow: "pulse_glow 2.4s ease-in-out infinite",
        ticker: "ticker 28s linear infinite",
        fadeIn: "fadeIn 0.4s ease-out forwards",
        slideInLeft: "slideInLeft 0.35s ease-out forwards",
      },
    },
  },
  plugins: [],
};
