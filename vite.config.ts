import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

export default defineConfig({
  plugins: [
    {
      name: 'pennywings-offline-worker',
      apply: 'build',
      generateBundle() {
        const worker = readFileSync(path.resolve(__dirname, 'src/pwa/sw.js'), 'utf8');
        const fallback = readFileSync(path.resolve(__dirname, 'public/offline.html'), 'utf8');
        const version = createHash('sha256').update(worker + fallback).digest('hex').slice(0, 16);
        this.emitFile({ type: 'asset', fileName: 'sw.js', source: worker.replace('__OFFLINE_VERSION__', version) });
      },
    },
    react(),
    // React Compiler memoizes components and hooks at build time, so props and
    // handlers keep their identity between renders without hand-written memo.
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ["stepanie-truceless-absentmindedly.ngrok-free.dev"],
  },
});
