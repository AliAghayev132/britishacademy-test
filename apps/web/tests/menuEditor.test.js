import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { buildPath, ROUTE_SLUGS } from "../src/lib/i18n/routes.js";

/**
 * MENYU REDAKTORU.
 *
 * Əvvəl menyu ümumi resurs cədvəlində düz siyahı idi: hansı bəndin hansının
 * altında olduğu görünmürdü, sıra hər bəndə rəqəm yazmaqla dəyişirdi, üst
 * bənd seçicisində alt bəndlər də çıxırdı (üçüncü səviyyə saytda göstərilmir —
 * bənd səssizcə yox olurdu).
 */

const PAGE = "src/app/(protected)/dashboard/resurslar/menu-items/page.js";
const FORM = "src/app/(protected)/dashboard/_forms/MenuItemForm.jsx";
const page = fs.readFileSync(PAGE, "utf8");
const form = fs.readFileSync(FORM, "utf8");

describe("ağac görünüşü", () => {
  it("menyunun öz səhifəsi var (ümumi [resource] cədvəlini əvəz edir)", () => {
    expect(fs.existsSync(PAGE)).toBe(true);
    expect(page).toContain("export default function MenuItemsPage");
  });

  it("sıra yalnız QONŞULAR arasında dəyişir", () => {
    // Üst səviyyədə — üst bəndlər, açılan menyuda — həmin bəndin uşaqları.
    expect(page).toContain("move(tree, i, -1)");
    expect(page).toContain("move(p.children, j, -1)");
  });

  it("üst bənd silinəndə alt bəndləri də silinir (yetim qalmasın)", () => {
    expect(page).toMatch(/const kids = items\.filter\(\(i\) => idOf\(i\.parent\) === item\._id\);/);
  });

  it("avtomatik menyulara (kurslar, ölkələr) əl ilə alt bənd əlavə olunmur", () => {
    expect(page).toContain("onAddChild={auto ? null : () => addChild(p)}");
  });
});

describe("forma", () => {
  it("üst bənd yalnız eyni yerdəki ÜST SƏVİYYƏ bənd ola bilər", () => {
    expect(form).toContain("!m.parent && m._id !== item?._id && m.location === location");
  });

  it("öz alt bəndləri olan bənd başqasının altına keçə bilməz", () => {
    expect(form).toContain("const hasChildren = isEdit && all.some((m) => toId(m.parent) === item._id);");
    expect(form).toContain("disabled={hasChildren}");
  });

  it("saytın hər sabit səhifəsi link siyahısındadır", () => {
    expect(form).toContain("...Object.keys(ROUTE_SLUGS).map(");
    for (const k of Object.keys(ROUTE_SLUGS)) expect(form, k).toMatch(new RegExp(`["\\s]${k}"?:`));
  });
});

describe("linklərin tərcüməsi", () => {
  it("menyu linkinin birinci hissəsi hər dildə öz slug-ına çevrilir", () => {
    expect(buildPath("/bloq", "en")).toBe("/en/blog");
    expect(buildPath("/bloq", "ru")).toBe("/ru/blog");
    expect(buildPath("/haqqimizda", "ru")).toBe("/ru/o-nas");
  });

  it("bazadan gələn hissə (kurs/kateqoriya slug-ı) dəyişmir — redaktor bunu göstərir", () => {
    expect(buildPath("/kurslar/dil-kurslari", "en")).toBe("/en/courses/dil-kurslari");
    expect(form).toContain("saytın tanınan səhifələrindən deyil");
  });
});
