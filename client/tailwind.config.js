/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  plugins: [require("daisyui")],
  // optional: Standard-Theme auswählen
  daisyui: { theme: "light" }, // "dark", "cupcake", "lofi", …
};