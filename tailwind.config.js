export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F7F4EE",
        charcoal: "#181A18",
        forest: "#142B22",
        gold: "#B38A42",
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'DM Sans'", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
