import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

// Bestimme den base-Pfad basierend auf der Umgebung
const base = process.env.NODE_ENV === "production" && process.env.GITHUB_PAGES 
  ? "/okr-vizz/"  // Nur für GitHub Pages
  : "/";          // Für lokale Entwicklung und Preview

export default defineConfig({
  plugins: [solid()],
  base,
  server: {
    port: 3000,
    host: true,
    strictPort: true,
  },
  build: {
    target: "esnext",
  },
});
