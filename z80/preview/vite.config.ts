/**
 * Single-file preview build of the Z80 app (for sharing as one HTML page).
 * Uses the real components; Next.js router/link/fonts are swapped for small
 * client-side stand-ins in src/shims. API calls fall back to the local mocks.
 *   npx vite build --config preview/vite.config.ts
 */
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const root = path.resolve(__dirname);
const app = path.resolve(__dirname, "..");

export default defineConfig({
  root,
  plugins: [react(), tailwind(), viteSingleFile()],
  resolve: {
    alias: [
      { find: "next/link", replacement: path.join(root, "src/shims/next-link.tsx") },
      { find: "next/navigation", replacement: path.join(root, "src/shims/next-navigation.ts") },
      { find: "geist/font/sans", replacement: path.join(root, "src/shims/geist.ts") },
      { find: "geist/font/mono", replacement: path.join(root, "src/shims/geist.ts") },
      { find: "server-only", replacement: path.join(root, "src/shims/server-only.ts") },
      { find: /^@\//, replacement: `${app}/` },
    ],
    dedupe: ["react", "react-dom", "motion", "three"],
  },
  define: {
    "process.env.NEXT_PUBLIC_SITE_URL": JSON.stringify("https://z80.si"),
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: { outDir: path.join(root, "dist"), emptyOutDir: true, chunkSizeWarningLimit: 5000, assetsInlineLimit: 100_000_000 },
});
