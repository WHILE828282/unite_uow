import defaultTheme from "tailwindcss/defaultTheme";

/* UOWD palette: deep navy foundation with muted crimson accents (after UOW red). `indigo` and `violet` are remapped to the
   navy scale so every existing primary button, link and badge picks up the brand colour. */
const navy = {
  50: "#eef3fb", 100: "#dbe5f5", 200: "#b8cbe9", 300: "#8aa8d6", 400: "#5a80bd", 500: "#3a5f9e",
  600: "#1f4380", 700: "#163466", 800: "#10264d", 900: "#0a192f", 950: "#06101f",
};
const crimson = {
  50: "#fbf1f2", 100: "#f5dde0", 200: "#e9b6bc", 300: "#d98691", 400: "#c45a68", 500: "#a83446",
  600: "#8c1d32", 700: "#741629", 800: "#5e1222", 900: "#4a0e1b", 950: "#2e0811",
};

/** @type {import('tailwindcss').Config} */
export default {
  // hover: styles only apply on devices with a real hover (mouse/trackpad). On phones the first tap would otherwise
  // trigger the hover state and only the second tap would click.
  future: { hoverOnlyWhenSupported: true },
  // Flat repo layout: App.jsx and main.jsx live at the root, not in src/.
  content: ["./index.html", "./*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans] },
      colors: {
        navy, crimson, indigo: navy,
        // No yellow in the brand: warning/pending states use the crimson family too.
        amber: crimson,
        violet: { ...navy, 500: "#2c4f8c", 600: "#183a72", 700: "#112240" },
        slate: { 900: "#0a192f", 950: "#06101f" },
      },
    },
  },
  plugins: [],
};
