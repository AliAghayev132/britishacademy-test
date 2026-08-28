import { test, expect } from "@playwright/test";

/**
 * Konsol/səhifə xətalarını toplayan köməkçi.
 *
 * React #418 (hidratasiya) və #31 (obyekt render) məhz burada görünür —
 * ikisi də istehsalatda baş vermişdi və heç bir funksiya testi tutmurdu.
 */
function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    // Şəbəkə xətaları ayrıca yoxlanılır; API lokalda qalxmaya bilər.
    if (/Failed to load resource|net::ERR_|ERR_CONNECTION/.test(t)) return;
    errors.push(`console: ${t}`);
  });
  return errors;
}

test("ana səhifə çökmür və AZ dilində açılır", async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "az");
  await expect(page.locator("header").first()).toBeVisible();
  await expect(page.locator("footer").first()).toBeVisible();

  // Hidratasiyanın bitməsini gözlə — #418 məhz bu anda çıxır.
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("dil prefiksləri düzgün işləyir", async ({ page }) => {
  for (const [path, lang] of [["/en", "en"], ["/ru", "ru"], ["/", "az"]]) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
  }
});

test("cookie RU olsa da prefikssiz ünvan AZ qalır", async ({ page, context }) => {
  // İstifadəçinin bildirdiyi baq: bir dəfə RU seçəndən sonra sayt həmişə
  // rus dilində açılırdı və AZ-a qayıtmaq mümkün deyildi.
  await context.addCookies([
    { name: "lang", value: "ru", url: "http://127.0.0.1:3599" },
  ]);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "az");
});

test("lokallaşdırılmış route-lar və yönləndirmələr", async ({ page }) => {
  // Hər dilin öz slug-ı olmalıdır
  await page.goto("/en/contact");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(page.url()).toContain("/en/contact");

  // Səhv slug kanonik formaya yönləndirilməlidir (dublikat məzmun olmasın)
  await page.goto("/en/elaqe");
  expect(page.url()).toContain("/en/contact");

  await page.goto("/ru/contact");
  expect(page.url()).toContain("/ru/kontakty");
});

test("heç bir şəkil localhost-a işarə etmir", async ({ page }) => {
  // REGRESSİYA QORUMASI: IMAGE_URL defoltu səhv olanda bütün yüklənmiş
  // şəkillər ziyarətçinin ÖZ kompüterinə (localhost:5000) gedirdi və
  // səssizcə boş qalırdı — heç bir xəta çıxmırdı.
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const bad = await page.$$eval("img", (imgs) =>
    imgs
      .map((i) => i.getAttribute("src") || "")
      .filter((s) => /localhost|127\.0\.0\.1:5000/.test(s)),
  );
  expect(bad).toEqual([]);
});

test("naviqasiya lokallaşdırılmış ünvanları saxlayır", async ({ page }) => {
  // Bu gün 4 fayl xam next/link işlədirdi və klikləyəndə dil itirdi.
  await page.goto("/en");
  const link = page.locator('a[href^="/en/"]').first();
  await expect(link).toBeVisible();

  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/en\//);

  await link.click();
  await page.waitForLoadState("domcontentloaded");
  expect(new URL(page.url()).pathname).toMatch(/^\/en(\/|$)/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("admin sahəsi girişsiz qorunur", async ({ page }) => {
  await page.goto("/dashboard");
  // Middleware token olmadan /login-ə yönləndirməlidir.
  expect(new URL(page.url()).pathname).toBe("/login");
  await expect(page.locator("form, input[type=email], input[type=password]").first()).toBeVisible();
});
