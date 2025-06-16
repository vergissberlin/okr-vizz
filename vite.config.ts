import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

// Bestimme den base-Pfad basierend auf der Umgebung
const base = process.env.NODE_ENV === "production" 
  ? "./"  // Für Produktion (inkl. GitHub Pages)
  : "/";  // Für lokale Entwicklung

export default defineConfig({
  plugins: [solid()],
  base,
  publicDir: "public",
  server: {
    port: 3000,
    host: true,
    strictPort: true,
  },
  build: {
    target: "esnext",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
});
