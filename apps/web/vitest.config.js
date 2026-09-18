import { defineConfig } from "vitest/config";
import path from "node:path";

// Testlər Next-in `@/` aliasını işlədən modulları import edir.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    // 5 s defolt az idi: sitemap testi `@/app/sitemap.js`-i dinamik import
    // edir və onunla bütün komponent ağacı yüklənir. Tək işləyəndə ~2 s,
    // 38 fayl paralel gedəndə (və CI-ın zəif maşınında) limitə çatırdı.
    testTimeout: 20_000,
  },
});
