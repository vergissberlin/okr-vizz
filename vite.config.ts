import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

// Bestimme den base-Pfad basierend auf der Umgebung
const base = process.env.NODE_ENV === "production" ? "/okr-vizz/" : "./";

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
