import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        hospital: {
          50: "#eefdf5",
          100: "#d7fae7",
          200: "#b1f3d0",
          300: "#76e6ae",
          400: "#36d184",
          500: "#13b969",
          600: "#089654",
          700: "#087845",
          800: "#0a5f39",
          900: "#084a2f",
          950: "#032a1c"
        },
        danger: {
          50: "#fff1f2",
          100: "#ffe4e6",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(8, 74, 47, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
