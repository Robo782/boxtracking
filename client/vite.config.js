import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path  from "path";

export default defineConfig({
  plugins: [react()],

  /* Jeder Import muss genau auf diese Pfade zeigen */
  resolve: {
    alias: {
      "@":           path.resolve(__dirname, "./src"),
      react:         path.resolve(__dirname, "node_modules/react"),
      "react-dom":   path.resolve(__dirname, "node_modules/react-dom"),
      scheduler:     path.resolve(__dirname, "node_modules/scheduler")   //  ← NEU
    },
  },

  /* Rollup/Vite darf die Libraries nie duplizieren */
  optimizeDeps: {
    include: ["react", "react-dom", "scheduler"],
    dedupe:  ["react", "react-dom", "scheduler"],
  },

  build: {
    outDir: "dist",
    sourcemap: true,   // damit du weiter debuggen kannst
  },
});
