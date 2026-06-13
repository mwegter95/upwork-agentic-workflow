/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.jsx", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        mustard: "#e8b820",
        cyan: "#12b4c8",
        "hot-pink": "#f0186e",
        "parrot-red": "#e83828",
        "parrot-green": "#6ed46a",
        "sky-blue": "#3a8fcc",
        root: "#121118",
        surface: "#191720",
        card: "#1e1c26",
        "card-hover": "#24222e",
        "border-subtle": "#201e2a",
        "border-default": "#2c2a38",
        "border-active": "#3a3848",
        primary: "#f2ede4",
        secondary: "#8a8898",
        muted: "#4a4858",
      },
    },
  },
  plugins: [],
};
