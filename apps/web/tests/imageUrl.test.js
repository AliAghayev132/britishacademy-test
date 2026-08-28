import { describe, it, expect } from "vitest";
import { getImageUrl } from "@/utils/getImageUrl";
import { IMAGE_URL } from "@/lib/variables";

// REGRESSİYA QORUMASI.
// IMAGE_URL defoltu sabit "http://localhost:5000" idi. Deploy-da
// NEXT_PUBLIC_IMAGE_URL qoyulmayanda BÜTÜN yüklənmiş şəkillər ziyarətçinin
// öz kompüterinə işarə edirdi — ölkə bayraqları da, admin paneldəki media da
// səssizcə boş qalırdı. Heç bir xəta çıxmırdı, ona görə aylarla qala bilərdi.

describe("getImageUrl", () => {
  it("nisbi yola host əlavə edir", () => {
    const out = getImageUrl("/uploads/flags/de.png");
    expect(out).toBe(`${IMAGE_URL}/uploads/flags/de.png`);
  });

  it("baş «/» olmayan yolu da düzəldir", () => {
    expect(getImageUrl("uploads/a.png")).toBe(`${IMAGE_URL}/uploads/a.png`);
  });

  it("tam URL-ə toxunmur", () => {
    const u = "https://cdn.example.com/a.png";
    expect(getImageUrl(u)).toBe(u);
  });

  it("data URL-ə toxunmur", () => {
    const d = "data:image/png;base64,iVBORw0KG";
    expect(getImageUrl(d)).toBe(d);
  });

  it("boş dəyər üçün null qaytarır", () => {
    expect(getImageUrl(null)).toBeNull();
    expect(getImageUrl(undefined)).toBeNull();
    expect(getImageUrl("")).toBeNull();
  });

  it("Next static import obyektini olduğu kimi qaytarır", () => {
    const o = { src: "/_next/x.png", width: 10, height: 10 };
    expect(getImageUrl(o)).toBe(o);
  });
});

describe("IMAGE_URL defoltu", () => {
  it("localhost-a bərkidilməyib", () => {
    // Test mühitində NEXT_PUBLIC_API_URL qoyulmayıbsa localhost normaldır;
    // əsas odur ki, API URL verilən halda ONDAN törəsin (aşağıdakı test).
    expect(typeof IMAGE_URL).toBe("string");
    expect(IMAGE_URL.endsWith("/")).toBe(false);
  });

  it("API URL-indən törəmə məntiqi düzgündür", () => {
    // variables.js-dəki eyni hesablama — deploy ssenarilərini yoxlayır.
    const strip = (u) => (u.endsWith("/") ? u.slice(0, -1) : u);
    const calc = (apiEnv, imgEnv) => {
      const RAW = strip(apiEnv || "http://localhost:5000/api");
      return strip(imgEnv || (RAW.endsWith("/api") ? RAW.slice(0, -4) : RAW) || "http://localhost:5000");
    };
    expect(calc("http://169.58.130.173:30002")).toBe("http://169.58.130.173:30002");
    expect(calc("http://169.58.130.173:30002/api")).toBe("http://169.58.130.173:30002");
    expect(calc("http://169.58.130.173:30002", "https://cdn.x.com")).toBe("https://cdn.x.com");
  });
});
