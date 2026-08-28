import { describe, it, expect } from "vitest";
import {
  ROUTE_SLUGS,
  buildPath,
  canonicalPath,
  localizePath,
  splitLocale,
  localeOfPath,
} from "../src/lib/i18n/routes.js";

// Route slug xəritəsi proxy, link qurma və sitemap tərəfindən işlədilir.
// Burada bir səhv bütün saytın naviqasiyasını sındırır.

describe("buildPath", () => {
  it("AZ üçün prefiks qoymur", () => {
    expect(buildPath("/elaqe", "az")).toBe("/elaqe");
    expect(buildPath("/", "az")).toBe("/");
  });

  it("EN/RU üçün prefiks + tərcümə edir", () => {
    expect(buildPath("/elaqe", "en")).toBe("/en/contact");
    expect(buildPath("/elaqe", "ru")).toBe("/ru/kontakty");
    expect(buildPath("/", "en")).toBe("/en");
  });

  it("alt-slug-ları toxunmadan saxlayır", () => {
    expect(buildPath("/kurslar/ielts-hazirligi", "en")).toBe("/en/courses/ielts-hazirligi");
    expect(buildPath("/xaricde-tehsil/almaniya", "ru")).toBe("/ru/obuchenie-za-rubezhom/almaniya");
  });
});

describe("canonicalPath", () => {
  it("istənilən dilin slug-ını AZ-a çevirir", () => {
    expect(canonicalPath("/contact")).toBe("/elaqe");
    expect(canonicalPath("/kontakty")).toBe("/elaqe");
    expect(canonicalPath("/courses/ielts")).toBe("/kurslar/ielts");
  });

  it("naməlum seqmentə toxunmur", () => {
    expect(canonicalPath("/nonexistent")).toBe("/nonexistent");
    expect(canonicalPath("/")).toBe("/");
  });
});

describe("round-trip", () => {
  it("bütün route × dil kombinasiyası geri qayıdır", () => {
    for (const canon of Object.keys(ROUTE_SLUGS)) {
      for (const l of ["az", "en", "ru"]) {
        const pub = buildPath("/" + canon, l);
        expect(canonicalPath(splitLocale(pub).path)).toBe("/" + canon);
      }
    }
  });
});

describe("slug toqquşması", () => {
  it("iki fərqli səhifə eyni slug-ı paylaşmır", () => {
    const owner = {};
    for (const [canon, byLang] of Object.entries(ROUTE_SLUGS)) {
      for (const slug of Object.values(byLang)) {
        if (owner[slug]) expect(owner[slug]).toBe(canon);
        owner[slug] = canon;
      }
    }
  });
});

describe("splitLocale", () => {
  it("prefiksi ayırır", () => {
    expect(splitLocale("/en/contact")).toMatchObject({ locale: "en", path: "/contact", prefixed: true });
    expect(splitLocale("/elaqe")).toMatchObject({ locale: "az", path: "/elaqe", prefixed: false });
  });
});

describe("localeOfPath", () => {
  it("əcnəbi slug-ın dilini tapır", () => {
    expect(localeOfPath("/contact")).toBe("en");
    expect(localeOfPath("/kontakty")).toBe("ru");
  });

  it("AZ slug üçün null qaytarır — yönləndirmə lazım deyil", () => {
    expect(localeOfPath("/elaqe")).toBeNull();
    expect(localeOfPath("/nonexistent")).toBeNull();
  });
});

describe("localizePath", () => {
  it("prefiks ƏLAVƏ ETMİR", () => {
    expect(localizePath("/elaqe", "en")).toBe("/contact");
  });
});
