import defaultTheme from "tailwindcss/defaultTheme";

/* UOWD palette: deep navy foundation with gold accents. `indigo` and `violet` are remapped to the
   navy scale so every existing primary button, link and badge picks up the brand colour. */
const navy = {
  50: "#eef3fb", 100: "#dbe5f5", 200: "#b8cbe9", 300: "#8aa8d6", 400: "#5a80bd", 500: "#3a5f9e",
  600: "#1f4380", 700: "#163466", 800: "#10264d", 900: "#0a192f", 950: "#06101f",
};
const gold = {
  50: "#fff8e6", 100: "#feefc3", 200: "#fde08a", 300: "#fbcd4f", 400: "#f7b928", 500: "#e8a317",
  600: "#c7840f", 700: "#9e6410", 800: "#7f4f14", 900: "#6a4115",
};

/** @type {import('tailwindcss').Config} */
export default {
  // Flat repo layout: App.jsx and main.jsx live at the root, not in src/.
  content: ["./index.html", "./*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans] },
      colors: {
        navy, gold, indigo: navy,
        violet: { ...navy, 500: "#2c4f8c", 600: "#183a72", 700: "#112240" },
        slate: { 900: "#0a192f", 950: "#06101f" },
      },
    },
  },
  plugins: [],
};
