// client/vite.config.js
import { defineConfig } from "vite";
import react            from "@vitejs/plugin-react";
import path             from "path";

export default defineConfig({
  plugins: [react()],

  /*  🔑 Alias, damit "@/…" auf src/ zeigt  */
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  /*  Baue nach client/dist  */
  build: {
    outDir: "dist",
  },
});
