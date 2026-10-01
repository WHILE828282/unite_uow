import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  // Flat repo layout: App.jsx and main.jsx live at the root, not in src/.
  content: ["./index.html", "./*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans] },
    },
  },
  plugins: [],
};
