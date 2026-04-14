import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/App.tsx",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Erode", "Iowan Old Style", "Hoefler Text", "Georgia", "serif"],
        body: [
          "Switzer",
          "-apple-system",
          "BlinkMacSystemFont",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SF Mono",
          "Menlo",
          "Cascadia Mono",
          "JetBrains Mono",
          "monospace",
        ],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            // Workshop palette, hex equivalents of the OKLCH tokens in globals.css.
            background: "#fbf9f3",
            foreground: "#231e1a",
            content1: "#f4f1e8",
            content2: "#ece8dd",
            divider: "#dcd6c8",
            focus: "#b4561e",
            default: {
              50: "#f4f1e8",
              100: "#ece8dd",
              200: "#dcd6c8",
              300: "#cbc4b3",
              400: "#a89f8d",
              500: "#857d72",
              600: "#675f55",
              700: "#4b443c",
              800: "#322d27",
              900: "#231e1a",
              foreground: "#231e1a",
              DEFAULT: "#857d72",
            },
            primary: {
              50: "#fbeee2",
              100: "#f3d4ba",
              200: "#e6b189",
              300: "#d68d59",
              400: "#c3702f",
              500: "#b4561e",
              600: "#9a4719",
              700: "#7e3814",
              800: "#5f2a0e",
              900: "#421d09",
              foreground: "#fdfcf8",
              DEFAULT: "#b4561e",
            },
            success: {
              foreground: "#fdfcf8",
              DEFAULT: "#3d7a4a",
            },
            danger: {
              foreground: "#fdfcf8",
              DEFAULT: "#a13d18",
            },
          },
        },
        dark: {
          colors: {
            background: "#1c1814",
            foreground: "#ebe6dd",
            content1: "#252019",
            content2: "#2c2620",
            divider: "#3d362c",
            focus: "#d68152",
            default: {
              50: "#252019",
              100: "#2c2620",
              200: "#3d362c",
              300: "#4f4739",
              400: "#6e6555",
              500: "#9b9286",
              600: "#b8b1a5",
              700: "#d2ccbf",
              800: "#e2dccf",
              900: "#ebe6dd",
              foreground: "#ebe6dd",
              DEFAULT: "#9b9286",
            },
            primary: {
              50: "#3d2618",
              100: "#5a3622",
              200: "#7e4a2d",
              300: "#a05f3a",
              400: "#c07449",
              500: "#d68152",
              600: "#e09870",
              700: "#eab293",
              800: "#f1c8b2",
              900: "#f7dccd",
              foreground: "#1c1814",
              DEFAULT: "#d68152",
            },
            success: {
              foreground: "#1c1814",
              DEFAULT: "#7fb88a",
            },
            danger: {
              foreground: "#fdfcf8",
              DEFAULT: "#d56b3e",
            },
          },
        },
      },
    }),
  ],
};
