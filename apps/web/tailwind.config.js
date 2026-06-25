/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0e14",
        panel: "#11161f",
        edge: "#1e2632",
      },
    },
  },
  plugins: [],
};
