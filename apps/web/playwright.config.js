import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke testlər — brauzerdə həqiqətən açılan səhifələr.
 *
 * Niyə lazımdır: vitest testləri funksiyaları TƏCRİD OLUNMUŞ şəkildə yoxlayır.
 * Bu layihədə istehsalata çıxan baqların çoxu isə başqa cinsdən idi —
 * funksiya düzgün işləyirdi, sadəcə səhifədə çağırılmamışdı və ya SSR ilə
 * klient render-i uyğun gəlmirdi (React #31, #418). Onları yalnız real
 * brauzer tutur.
 *
 * Qəsdən AZ SAYDA test var. Çox test yazsaq hər dizayn dəyişikliyində
 * yarısı sınacaq və nəticədə hamısı söndürüləcək — o zaman faydası qalmaz.
 * Burada yalnız «səhifə çökmür və əsas müqavilələr qorunur» yoxlanılır.
 */

const PORT = 3599;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  // Testlərdən əvvəl istehsalat build-i qaldırılır (dev server yox — dev-də
  // React əlavə xəbərdarlıqlar verir və hidratasiya davranışı fərqlidir).
  webServer: {
    command: "pnpm run build && pnpm start",
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      PORT: String(PORT),
      // API əlçatmaz olsa da testlər keçməlidir — struktur yoxlanılır, data yox.
      NEXT_PUBLIC_API_URL: process.env.E2E_API_URL || "http://127.0.0.1:5000",
      NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${PORT}`,
    },
  },
});
