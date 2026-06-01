import type { Config } from "tailwindcss";

// Design tokens locked per SRS §23.3 (Material 3 Expressive-inspired)
// Replaceable layer: change tokens here without touching business logic.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1a73e8",
          soft: "#d2e3fc",
        },
        success: "#1e8e3e",
        warning: "#f29900",
        danger: "#d93025",
        neutral: {
          0: "#ffffff",
          50: "#f8f9fa",
          200: "#e8eaed",
          700: "#5f6368",
          900: "#202124",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      fontSize: {
        display: ["32px", { lineHeight: "40px", fontWeight: "700" }],
        h1: ["24px", { lineHeight: "32px", fontWeight: "600" }],
        h2: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        body: ["16px", { lineHeight: "24px", fontWeight: "400" }],
        caption: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        label: ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        pill: "999px",
      },
      minHeight: {
        touch: "44px",
        "touch-lg": "56px",
      },
      minWidth: {
        touch: "44px",
        "touch-lg": "56px",
      },
    },
  },
  plugins: [],
};

export default config;
