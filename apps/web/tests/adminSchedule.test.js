import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { ADMIN_RESOURCES, ORDERABLE, RESOURCE_FILTERS, resourceLabel } from "@/lib/adminResources";
import { SECTIONS, sectionForPath } from "@/lib/permissions";
import { NAV_TOP, NAV_GROUPS, NAV_BOTTOM } from "@/lib/adminNav";

/**
 * «DƏRS QRAFİKİ» PANELDƏN SİLİNDİ.
 *
 * Qrafik (CourseGroup) sistemi serverdə ləğv olundu: saat/gün cədvəli heç
 * yerdə saxlanmır. Əlaqələr sadələşdi:
 *   • kurs  → `course.teachers` (kursu keçən müəllimlər — kurs formasında)
 *   • müəllim → `teacher.branches` (yalnız işlədiyi filiallar)
 *
 * Bu test qalıqları tutur: silinmiş bölmə sidebar-da/icazələrdə qalsa,
 * istifadəçi mövcud olmayan resursa aparan link görərdi.
 */

const read = (f) => fs.readFileSync(f, "utf8");
const DIR = "src/app/(protected)/dashboard/_forms";
const NAV = [...NAV_TOP, ...NAV_GROUPS.flatMap((g) => g.items), ...NAV_BOTTOM];

describe("panel qrafikdən təmizlənib", () => {
  it("resurs, süzgəc və icazə siyahılarında yoxdur", () => {
    expect(ADMIN_RESOURCES["course-groups"]).toBeUndefined();
    expect(RESOURCE_FILTERS["course-groups"]).toBeUndefined();
    expect(ORDERABLE.has("course-groups")).toBe(false);
    expect(SECTIONS.map((s) => s.key)).not.toContain("course-groups");
    // Xəritədən çıxdığı üçün ünvan ümumi «resources» prefiksinə düşür.
    expect(sectionForPath("/dashboard/resurslar/course-groups")).not.toBe("course-groups");
    // Tanınmayan açar öz adı ilə qalır — jurnalda köhnə qeydlər üçün.
    expect(resourceLabel("course-groups")).toBe("course-groups");
  });

  it("naviqasiyada və sürətli keçidlərdə bənd qalmayıb", () => {
    expect(NAV.map((i) => i.href)).not.toContain("/dashboard/resurslar/course-groups");
    expect(read("src/app/(protected)/dashboard/page.js")).not.toMatch(/course-groups/);
  });

  it("forma reyestrində qrafik forması yoxdur", () => {
    expect(fs.existsSync(`${DIR}/CourseGroupForm.jsx`)).toBe(false);
    expect(read(`${DIR}/index.js`)).not.toMatch(/CourseGroupForm/);
  });

  it("siyahı sətrində «Dərs qrafiki» əməliyyatı yoxdur", () => {
    const row = "src/app/(protected)/dashboard/resurslar/[resource]/_components/ResourceRow.jsx";
    expect(read(row)).not.toMatch(/actions\.schedule/);
    expect(read("src/app/(protected)/dashboard/resurslar/[resource]/page.js")).not.toMatch(/schedule:/);
  });

  it("keş etiketləri silinmiş resursu ləğv etmir", () => {
    expect(read("src/store/api/adminApi.js")).not.toMatch(/id: "course-groups"/);
  });
});

describe("yeni əlaqələr formalarda", () => {
  const wizard = read(`${DIR}/CourseWizard.jsx`);
  const teacher = read(`${DIR}/TeacherForm.jsx`);

  it("kurs formasında müəllim seçimi var və payload `teachers` göndərir", () => {
    expect(wizard).toMatch(/label="Müəllimlər"/);
    expect(wizard).toMatch(/options=\{teacherOpts\}/);
    expect(wizard).toMatch(/teachers: course\.teachers/);
    // Prefill həm id, həm populate obyekt gəldiyi üçün toId-dən keçir.
    expect(wizard).toMatch(/teachers: \(c\.teachers \|\| \[\]\)\.map\(toId\)/);
  });

  it("kurs formasında qrup/saat qalığı yoxdur", () => {
    for (const pat of [/\bgroups\b/, /\bweekday\b/, /WEEKDAYS/, /capacity/]) {
      expect(wizard, String(pat)).not.toMatch(pat);
    }
    // Qiymət matrisi (qrup/fərdi × gündüz/axşam) isə YERİNDƏ qalır.
    expect(wizard).toMatch(/Qrup · gündüz/);
    expect(wizard).toMatch(/Fərdi · axşam/);
  });

  it("müəllim forması yalnız filial göndərir", () => {
    expect(teacher).toMatch(/branches: branches\.filter\(Boolean\)/);
    expect(teacher).not.toMatch(/assignments/);
    expect(teacher).not.toMatch(/courseOptions/);
  });
});
