// Packages
import { defineConfig } from "vitest/config";

/**
 * İnteqrasiya testləri — real MongoDB ilə HTTP səviyyəsində (audit #49).
 *
 * Adi `pnpm test` bunları işlətmir (fayllar *.int.js-dir): baza lazımdır.
 *   MONGODB_URI_TEST=mongodb://localhost:27017/ba_integration_test pnpm test:int
 *
 * Fayllar ardıcıl işləyir — hamısı eyni test bazasını təmizləyib doldurur.
 */
export default defineConfig({
  test: {
    include: ["integration/**/*.int.js"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
