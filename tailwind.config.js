export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { ink: "#0f0e0c", ore: "#e8322a", gold: "#d9a441", sand: "#f3f1ec" },
      fontFamily: { display: ["'Playfair Display'", "serif"], sans: ["'Plus Jakarta Sans'", "sans-serif"] },
      keyframes: { spin: { to: { transform: "rotate(360deg)" } }, marquee: { to: { transform: "translateX(-50%)" } } },
      animation: { "spin-slow": "spin 18s linear infinite", marquee: "marquee 40s linear infinite" },
    },
  },
  plugins: [],
};
