import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { resolve } from 'path';

// Bestimme den base-Pfad basierend auf der Umgebung
const base = process.env.NODE_ENV === "production" 
  ? "./"  // Für Produktion (inkl. GitHub Pages)
  : "/okr-vizz/";  // Für lokale Entwicklung

export default defineConfig({
  plugins: [solid()],
  base: '/okr-vizz/',
  publicDir: "public",
  server: {
    port: 3000,
    host: true,
    strictPort: true,
  },
  build: {
    target: "esnext",
    outDir: 'dist',
    assetsDir: "assets",
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
