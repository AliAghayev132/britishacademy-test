import { describe, it, expect } from "vitest";
import { LEGACY_REDIRECTS, legacyTarget } from "@/lib/legacyRoutes";
import { buildPath, canonicalPath } from "@/lib/i18n/routes";

/**
 * Köhnə saytın ünvanlarının qorunması.
 *
 * Bu yönləndirmələr birbaşa pul dəyəri daşıyır: analitikaya görə həmin
 * səhifələr ayda 8 mindən çox giriş alırdı. Səhv hədəf və ya sınıq qeyd
 * o trafiki 404-ə göndərir, üstəlik axtarış reytinqi də itir — ona görə
 * cədvəl testlə bağlanır.
 */

describe("köhnə ünvan cədvəli", () => {
  it("bütün hədəflər «/» ilə başlayır", () => {
    for (const [from, to] of Object.entries(LEGACY_REDIRECTS)) {
      expect(from.startsWith("/"), `mənbə: ${from}`).toBe(true);
      expect(to.startsWith("/"), `hədəf: ${to}`).toBe(true);
    }
  });

  it("hədəflər KANONİK AZ formadadır (dil prefiksi yoxdur)", () => {
    // Prefiks proxy-də əlavə olunur; cədvəldə olsa ikiqat prefiks yaranardı.
    for (const to of Object.values(LEGACY_REDIRECTS)) {
      expect(to.startsWith("/en/"), to).toBe(false);
      expect(to.startsWith("/ru/"), to).toBe(false);
      expect(canonicalPath(to), `${to} kanonik deyil`).toBe(to);
    }
  });

  it("dövr yaratmır — hədəfin özü yenidən yönləndirilmir", () => {
    // /a → /b → /c zənciri brauzerdə əlavə gediş-gəlişdir, sonsuz dövr isə
    // səhifəni tamam açılmaz edir.
    for (const to of Object.values(LEGACY_REDIRECTS)) {
      expect(legacyTarget(to), `${to} yenidən yönləndirilir`).toBeNull();
    }
  });

  it("sonuncu «/» və böyük hərf nəzərə alınmır", () => {
    expect(legacyTarget("/dil-kurslari/")).toBe("/kurslar/dil-kurslari");
    expect(legacyTarget("/dil-kurslari")).toBe("/kurslar/dil-kurslari");
    expect(legacyTarget("/AZ")).toBe("/");
  });

  it("tanınmayan ünvana toxunmur", () => {
    expect(legacyTarget("/kurslar")).toBeNull();
    expect(legacyTarget("/bloq/hansisa-yazi")).toBeNull();
    expect(legacyTarget("")).toBeNull();
    expect(legacyTarget(null)).toBeNull();
  });

  it("ən çox girilən səhifələrin hamısı cədvəldədir", () => {
    // Analitika hesabatındakı ilk 15 ünvan (/contact dil məntiqi ilə işlənir).
    const TOP = [
      "/english-test", "/dil-kurslari/", "/ingilis-dili-kurslari/",
      "/ingilis-dili-kurslari-qiymetleri", "/expert-instructors",
      "/ielts-kurslari-qiymetleri", "/rus-dili-test", "/az",
      "/ielts-sat-toefl-gmat/", "/sat-kurslari", "/en-yaxsi-ingilis-dili-kurslari",
      "/ielts-kurslari", "/online-ingilis-dili-kurslari", "/reservation",
    ];
    const missing = TOP.filter((u) => !legacyTarget(u));
    expect(missing, `yönləndirməsi yoxdur: ${missing.join(", ")}`).toEqual([]);
  });

  it("dil prefiksi ilə birlikdə düzgün ünvan qurulur", () => {
    // Proxy hədəfi buildPath ilə lokallaşdırır: /en/english-test işləməlidir.
    expect(buildPath(legacyTarget("/expert-instructors"), "en")).toBe("/en/teachers");
    expect(buildPath(legacyTarget("/expert-instructors"), "ru")).toBe("/ru/prepodavateli");
    expect(buildPath(legacyTarget("/az"), "az")).toBe("/");
  });
});
