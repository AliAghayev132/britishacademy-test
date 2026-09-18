import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { STRINGS } from "@/lib/i18n/strings";

/**
 * Dərs qrafiki sistemi (CourseGroup, /api/schedule, həftə günü + saat)
 * SİLİNDİ. Müəllim ↔ kurs əlaqəsi indi kursun özündədir (`Course.teachers`):
 *
 *   • /api/courses/:slug → `course.teachers`  (filial üzrə bölgü YOXDUR)
 *   • /api/teachers/:slug → `{ teacher, courses }`  (`groups` YOXDUR)
 *   • /api/teachers      → `branches` + `courses`  (`assignments` YOXDUR)
 *
 * NİYƏ MƏNBƏ MƏTNİ SKAN EDİLİR: bu səhifələr server komponentləridir və
 * testdə render olunmur. Silinmiş sahəyə müraciət isə səssizcə `undefined`
 * verir — bölmə sadəcə GÖRÜNMÜR, heç bir xəta çıxmır. Məhz belə itmiş bölməni
 * tutmaq üçün sahə adları mətn kimi yoxlanılır.
 */

const read = (p) => fs.readFileSync(p, "utf8");

const teacherPage = read("src/app/(public)/muellimler/[slug]/page.js");
const coursePage = read("src/app/(public)/kurslar/[slug]/page.js");
const priceCards = read("src/components/site/PriceCards.jsx");
const teacherBrowser = read("src/components/site/TeacherBrowser.jsx");
const publicApi = read("src/store/api/publicApi.js");
const storeIndex = read("src/store/index.js");

describe("müəllim səhifəsi — «Keçdiyi kurslar»", () => {
  it("cavabdan `courses` götürülür", () => {
    expect(teacherPage).toMatch(/teacher:\s*t,\s*courses\s*=\s*\[\]/);
  });

  it("kurslar siyahısı /kurslar/<slug> linkləri ilə göstərilir", () => {
    expect(teacherPage).toMatch(/courses\.map/);
    expect(teacherPage).toMatch(/href=\{`\/kurslar\/\$\{c\.slug\}`\}/);
    expect(teacherPage).toMatch(/tr\("teacher\.courses"\)/);
  });

  it("qrafik və təyinat qalıqları yoxdur", () => {
    expect(teacherPage).not.toMatch(/\bgroups\b/);
    expect(teacherPage).not.toMatch(/\bassignments\b/);
    expect(teacherPage).not.toMatch(/teacher\.schedule/);
    // Həftə günü açarları (`wd.1`…`wd.7`) lüğətdən silindi.
    expect(teacherPage).not.toMatch(/wd\.\$\{|"wd\./);
  });
});

describe("kurs səhifəsi — «Müəllimlər» bölməsi", () => {
  it("müəllimlər birbaşa `course.teachers`-dən gəlir", () => {
    expect(coursePage).toMatch(/course\.teachers\s*\|\|\s*\[\]/);
    expect(coursePage).toMatch(/teachers\.length > 0 && <CourseTeachers/);
  });

  it("filial üzrə bölgü qalmadı", () => {
    expect(coursePage).not.toMatch(/teachersByBranch/);
    expect(priceCards).not.toMatch(/teachersByBranch/);
    expect(priceCards).not.toMatch(/price\.teachesHere/);
  });

  it("şəkil `getImageUrl`-dən keçir, yoxsa baş hərf göstərilir", () => {
    // Şəkil yolu bazada nisbi saxlanılır — xam `src` köhnə hostda 404 verirdi.
    expect(coursePage).toMatch(/getImageUrl\(t\.photo\)/);
    expect(coursePage).toMatch(/className="ba-av"/);
  });

  it("qiymət matrisi (qrup/fərdi × gündüz/axşam) yerində qalır", () => {
    for (const key of ["price.groupLabel", "price.individual", "price.day", "price.evening"]) {
      expect(priceCards, key).toContain(key);
    }
  });
});

describe("müəllim siyahısı süzgəci", () => {
  it("filial sətri və axtarış `branches` + `courses` üzərindədir", () => {
    expect(teacherBrowser).toMatch(/t\.branches/);
    expect(teacherBrowser).toMatch(/t\.courses/);
    expect(teacherBrowser).not.toMatch(/assignments/);
  });
});

describe("RTK Query", () => {
  it("/schedule endpoint-i silindi", () => {
    expect(publicApi).not.toMatch(/schedule/i);
    expect(storeIndex).not.toMatch(/useGetScheduleQuery/);
  });
});

describe("UI lüğəti", () => {
  it("«Keçdiyi kurslar» hər üç dildədir", () => {
    for (const l of ["az", "en", "ru"]) {
      expect(STRINGS[l]["teacher.courses"], l).toBeTruthy();
    }
  });

  it("yalnız qrafikə xidmət edən açarlar silindi", () => {
    const dead = ["teacher.schedule", "teacher.branchCourses", "teacher.noCourses", "price.teachesHere",
      ...Array.from({ length: 7 }, (_, i) => `wd.${i + 1}`)];
    for (const l of ["az", "en", "ru"]) {
      const left = dead.filter((k) => k in STRINGS[l]);
      expect(left, `${l} dilində qalıq açar`).toEqual([]);
    }
  });
});

describe("ictimai saytda qalıq axtarışı", () => {
  const walk = (dir, out = []) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, out);
      else if (/\.jsx?$/.test(e.name)) out.push(p);
    }
    return out;
  };
  const files = [...walk("src/app/(public)"), ...walk("src/components/site")];

  it("heç bir ictimai fayl silinmiş sahələrə müraciət etmir", () => {
    const bad = files.filter((f) =>
      /teachersByBranch|\.assignments|useGetScheduleQuery/.test(fs.readFileSync(f, "utf8")),
    );
    expect(bad.map((f) => f.replace(/\\/g, "/"))).toEqual([]);
  });
});
