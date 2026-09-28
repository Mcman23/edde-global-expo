import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        edde: {
          purple: "#53226C",
          vivid: "#6a0deb",
          yellow: "#ffde00",
          dark: "#000000",
          gray: "#d9d9d9",
          light: "#faf7fb",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
        poppins: ["var(--font-poppins)", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(106, 13, 235, 0.3)",
        "glow-yellow": "0 0 25px -5px rgba(255, 222, 0, 0.4)",
        card: "0 10px 30px -5px rgba(83, 34, 108, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
