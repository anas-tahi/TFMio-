/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#E14A5F", // coral-red accent — links, secondary buttons, badges
          dark: "#2B0F14", // near-black maroon — primary buttons, black with a red undertone
          light: "#FDF0F1", // soft pink tint — backgrounds, subtle highlights
          mid: "#EF7A8A", // lighter coral — hover states, softer accents
        },
        mint: "#A8FFDD",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(20px, -30px) scale(1.05)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-25px, 25px) scale(1.08)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        float: "float 8s ease-in-out infinite",
        "float-slow": "float-slow 11s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};