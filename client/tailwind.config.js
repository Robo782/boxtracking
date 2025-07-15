/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",   // alle React-Dateien
  ],
  theme: { extend: {} },
  plugins: [require("daisyui")],
  daisyui: { themes: ["light"] },
};
