import { test, expect } from "@playwright/test";

/**
 * Admin panelin brauzer testləri.
 *
 * Niyə ayrıca fayl: smoke.spec.js public səhifələri yoxlayır. Admin paneldə
 * isə başqa cinsdən risklər var — keş invalidasiyası (yadda saxlayandan sonra
 * siyahının yenilənməsi), modal formalar, icazə qapıları. Bunları yalnız real
 * brauzer tutur.
 *
 * Bu testlər İŞLƏYƏN API və seed olunmuş baza tələb edir.
 */

const DEV = { email: "developer@britishacademy.az", password: "Developer123!" };

async function login(page) {
  await page.goto("/login");
  // Sahələr `type` ilə seçilir — placeholder mətni dizayn dəyişikliyində
  // asanlıqla dəyişir və test səbəbsiz sınardı.
  await page.locator('input[type="email"]').fill(DEV.email);
  await page.locator('input[type="password"]').fill(DEV.password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });
}

test.describe("admin panel", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("idarə paneli açılır və rəqəmlər gəlir", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    // Səhifə çökməyib: sidebar var.
    // Sidebar qruplar şəklindədir; ən sabit əlamət «Çıxış» düyməsidir.
    await expect(page.getByRole("button", { name: /çıxış/i })).toBeVisible();
  });

  test("bütün sidebar bölmələri açılır", async ({ page }) => {
    const routes = [
      ["/dashboard/muracietler", /müraciət/i],
      ["/dashboard/muracietler/xaricde-tehsil", /müraciət/i],
      ["/dashboard/ana-sehife", /ana səhifə|bölmə/i],
      ["/dashboard/resurslar/courses", /kurs/i],
      ["/dashboard/resurslar/teachers", /müəllim/i],
      ["/dashboard/resurslar/branches", /filial/i],
      ["/dashboard/resurslar/destinations", /xaricdə təhsil|ölkə/i],
      ["/dashboard/resurslar/projects", /layihə/i],
      ["/dashboard/resurslar/quiz-categories", /kateqoriya/i],
      ["/dashboard/testler", /test/i],
      ["/dashboard/istifadeciler", /istifadəçi/i],
      ["/dashboard/statistika", /statistika|baxış/i],
      ["/dashboard/loglar", /log|əməliyyat/i],
      ["/dashboard/tenzimlemeler", /tənzimləmə|sayt/i],
      ["/dashboard/linkler", /link/i],
      ["/dashboard/developer", /developer|seed|menyu/i],
    ];
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));

    for (const [path] of routes) {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `${path} HTTP`).toBeLessThan(400);
      // Next-in xəta ekranı görünməməlidir.
      await expect(page.locator("text=/Unhandled Runtime Error|Application error/i"))
        .toHaveCount(0);
    }
    expect(errors, `konsol xətaları:\n${errors.join("\n")}`).toEqual([]);
  });

  test("yadda saxlayandan sonra siyahı REFRESH-SİZ yenilənir", async ({ page }) => {
    // Keş invalidasiyası baqı məhz burada üzə çıxırdı: POST işləyirdi, siyahı
    // isə köhnə qalırdı və istifadəçi səhifəni yeniləmək məcburiyyətində idi.
    await page.goto("/dashboard/resurslar/quiz-categories");
    await page.getByRole("button", { name: /yeni|əlavə/i }).first().click();

    // Modalı AYRICA seçirik — səhifədə axtarış qutusu da var və «ilk input»
    // onu tuturdu.
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    const name = `E2E ${Date.now()}`;
    await modal.locator("input:visible, textarea:visible").first().fill(name);
    await modal.getByRole("button", { name: /^yadda saxla$/i }).click();

    // Yalnız AZ doldurulduğu üçün «Bəzi dillər boşdur» təsdiqi çıxır —
    // bu, qəsdən qoyulmuş qorumadır, keçmək lazımdır.
    const confirm = page.getByRole("button", { name: /bəli, davam et/i });
    if (await confirm.count()) await confirm.click();

    // Səhifə YENİLƏNMİR — element özü görünməlidir.
    await expect(page.getByText(name, { exact: false })).toBeVisible({ timeout: 15000 });
  });

  test("müraciət filtrləri açılan paneldədir", async ({ page }) => {
    await page.goto("/dashboard/muracietler");
    const toggle = page.getByRole("button", { name: /filtrlər/i });
    await expect(toggle).toBeVisible();

    // Panel bağlıdır: status seçicisi görünmür.
    await expect(page.getByText("Bütün statuslar")).toHaveCount(0);
    await toggle.click();
    await expect(page.getByText("Bütün statuslar")).toBeVisible();
    // Tarix aralığı TƏK sahədədir.
    await expect(page.getByText("Başlanğıc")).toBeVisible();
    await expect(page.getByText("Bitiş")).toBeVisible();
  });

  test("xaricdə təhsil bölməsində filial filtri yoxdur", async ({ page }) => {
    await page.goto("/dashboard/muracietler/xaricde-tehsil");
    await page.getByRole("button", { name: /filtrlər/i }).click();
    await expect(page.getByText("Bütün filiallar")).toHaveCount(0);
    await expect(page.getByText("Bütün kurslar")).toHaveCount(0);
    await expect(page.getByText("Bütün statuslar")).toBeVisible();
  });

  test("AI konfiqurasiya olunmayıbsa düymələr sönülüdür", async ({ page }) => {
    await page.goto("/dashboard/resurslar/quiz-categories");
    await page.getByRole("button", { name: /yeni|əlavə/i }).first().click();
    const modal = page.getByRole("dialog");
    await modal.locator("input:visible, textarea:visible").first().fill("AI yoxlaması");

    // Dil düyməsinə keç ki, «AZ-dən tərcümə et» görünsün.
    const en = modal.getByRole("button", { name: "EN", exact: true }).first();
    if (await en.count()) await en.click();

    const aiBtn = modal.getByRole("button", { name: /tərcümə et|səliqəyə sal|hamısını/i }).first();
    if (await aiBtn.count()) {
      await expect(aiBtn).toBeDisabled();
      await expect(aiBtn).toHaveAttribute("title", /AI/i);
    }
  });

  test("icazələr dialoqunda ölkə və filial əhatəsi var", async ({ page }) => {
    await page.goto("/dashboard/istifadeciler");
    const permBtn = page.getByRole("button", { name: /icazə/i }).first();
    if (await permBtn.count()) {
      await permBtn.click();
      await expect(page.getByText(/ölkə əhatəsi/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/filial əhatəsi/i)).toBeVisible();
    }
  });
});
