/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F14",
        panel: "#111820",
        panelSoft: "#17212B",
        line: "#263241",
        brand: "#38D39F",
        signal: "#5BC0EB",
        caution: "#F4B942",
        danger: "#FF6B6B",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(56, 211, 159, 0.16), 0 18px 60px rgba(0, 0, 0, 0.28)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
