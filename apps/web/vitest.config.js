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
  },
});
