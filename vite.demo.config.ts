// Builds a self-contained, single-file clickable preview with sample data (no server needed).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  root: "client",
  define: { "import.meta.env.VITE_DEMO": JSON.stringify("1") },
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: "strip-pwa-links",
      transformIndexHtml: (html) =>
        html
          .replace(/\s*<link rel="(manifest|apple-touch-icon|icon)"[^>]*>/g, "")
          .replace("<title>Black Widow Studios</title>", "<title>Black Widow Client App</title>"),
    },
  ],
  publicDir: false,
  build: { outDir: "../demo-dist", emptyOutDir: true },
});
