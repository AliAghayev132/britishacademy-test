import { describe, it, expect, beforeAll, vi } from "vitest";

/**
 * `/assets/…` NEXT-in `public` qovluğundadır, API-də deyil.
 *
 * NASAZLIQ İKİ DƏFƏ ÜZƏ ÇIXDI: QR studiyasında brend logosu və «Haqqımızda»
 * səhifəsindəki foto. Hər ikisində `getImageUrl` yola şəkil hostunu əlavə
 * edirdi, ünvan API portuna (:5000) gedirdi və 404 qaytarırdı — şəkil
 * SƏSSİZCƏ görünmürdü.
 *
 * BU TEST NİYƏ AYRI FAYLDADIR: `imageUrl.test.js` defolt mühitdə işləyir,
 * orada `IMAGE_URL` boşdur və `/assets/x` ilə `/uploads/x` eyni nəticə verir —
 * yəni fərqi görmək mümkün deyil. Burada şəkil hostu DOLU olan mühit qurulur.
 *
 * `resetModules` VACİBDİR: `IMAGE_URL` `variables.js`-də import zamanı bir
 * dəfə hesablanır. Yalnız `getImageUrl`-u təzədən yükləmək kifayət etmir —
 * o, artıq keşlənmiş `variables.js`-i götürür və mühit dəyişəni təsir etmir.
 */

let getImageUrl;
let IMAGE_URL;
const HOST = "https://cdn.example.com";

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_IMAGE_URL", HOST);
  vi.resetModules(); // bütün qraf təzədən qurulsun
  ({ getImageUrl } = await import("@/utils/getImageUrl"));
  ({ IMAGE_URL } = await import("@/lib/variables"));
});

describe("şəkil hostu dolu olanda", () => {
  it("mühit həqiqətən tətbiq olunub", () => {
    // Bu yoxlama olmasa qalan testlər ALDADICI olur: host boş qalsa
    // `/assets/x` onsuz da dəyişmədən qayıdır və fərq görünmür.
    expect(IMAGE_URL).toBe(HOST);
  });

  it("yüklənən fayla host əlavə olunur", () => {
    expect(getImageUrl("/uploads/flags/de.png")).toBe(`${HOST}/uploads/flags/de.png`);
  });

  it("paketlə gələn fayl NİSBİ qalır", () => {
    expect(getImageUrl("/assets/logo.png")).toBe("/assets/logo.png");
    expect(getImageUrl("/assets/shield.png")).toBe("/assets/shield.png");
    expect(getImageUrl("/assets/mascot/hero.png")).toBe("/assets/mascot/hero.png");
  });

  it("tam URL və data URL toxunulmaz qalır", () => {
    expect(getImageUrl("https://x.com/a.png")).toBe("https://x.com/a.png");
    expect(getImageUrl("data:image/png;base64,AAA")).toBe("data:image/png;base64,AAA");
  });

  it("«assets» yolun ORTASINDA olsa host əlavə olunur", () => {
    // Yalnız yolun BAŞI sərhəd sayılır — API-də «assets» adlı qovluq ola bilər.
    expect(getImageUrl("/uploads/assets/a.png")).toBe(`${HOST}/uploads/assets/a.png`);
  });
});
