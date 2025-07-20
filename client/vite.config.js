// client/vite.config.js
import { defineConfig } from "vite";
import react            from "@vitejs/plugin-react";
import path             from "path";

export default defineConfig({
  plugins: [react()],

  /* 🔑 Alias zwingt alle Imports auf dieselbe Kopie */
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react:      path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },

  /* Rollup/Vite darf React NIE doppelt packen */
  optimizeDeps: {
    include: ["react", "react-dom"],
    dedupe:  ["react", "react-dom"],
  },

  build: {
    outDir: "dist",
    sourcemap: true,        // bleibt an, damit du notfalls wieder debuggen kannst
  },
});
