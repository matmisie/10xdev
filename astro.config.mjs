// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 8080, host: true },
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: ["**/.idea/**", "**/tests/**", "**/.git/**"],
      },
    },
    resolve: {
      alias: process.env.DEPLOY_TO_CF === "true" &&
        import.meta.env.PROD && { "react-dom/server": "react-dom/server.edge" },
    },
  },
  adapter: process.env.DEPLOY_TO_CF === "true" ? cloudflare() : node({ mode: "standalone" }),
});
