// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import istanbul from "vite-plugin-istanbul";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [
      tailwindcss(),
      process.env.MODE === "test"
        ? istanbul({
            include: "src/*",
            exclude: ["node_modules", "src/test/"],
            extension: [".js", ".ts", ".tsx", ".astro"],
            requireEnv: true,
            nycrcPath: "./.nycrc.json",
          })
        : null,
    ],
    resolve: {
      alias: import.meta.env.PROD
        ? {
            "react-dom/server": "react-dom/server.edge",
          }
        : {},
    },
    server: {
      watch: {
        ignored: ["**/.idea/**", "**/tests/**", "**/.git/**"],
      },
    },
  },
  adapter: cloudflare(),
  experimental: { session: true },
});
