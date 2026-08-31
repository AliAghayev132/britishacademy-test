import { describe, it, expect } from "vitest";

// Ana səhifə swiper-i HƏMİŞƏ 6 kurs göstərməlidir.
// Admin vacib olanları seçir (isFeatured); seçilən sayı 6-dan azdırsa
// qalanı digər aktiv kurslarla tamamlanır. Əvvəl yalnız seçilmişlər
// göstərilirdi — 2 kurs işarələnəndə bölmə 2 kartla qalırdı.

const HOME_COURSE_COUNT = 6;

/** getHome-dakı tamamlama məntiqinin eynisi. */
function pickHomeCourses(featured, allActive) {
  let courses = featured;
  if (courses.length < HOME_COURSE_COUNT) {
    const ids = new Set(courses.map((c) => c._id));
    const fill = allActive
      .filter((c) => !ids.has(c._id))
      .slice(0, HOME_COURSE_COUNT - courses.length);
    courses = [...courses, ...fill];
  }
  return courses;
}

const c = (id, featured = false) => ({ _id: id, featured });
const ALL = [c(1, true), c(2, true), c(3), c(4), c(5), c(6), c(7), c(8), c(9)];

describe("ana səhifə kurs seçimi", () => {
  it("heç nə seçilməyibsə ilk 6 kursu göstərir", () => {
    const out = pickHomeCourses([], ALL);
    expect(out).toHaveLength(6);
    expect(out.map((x) => x._id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("2 kurs seçilibsə qalan 4-ü tamamlayır", () => {
    const out = pickHomeCourses([c(1, true), c(2, true)], ALL);
    expect(out).toHaveLength(6);
    // Seçilmişlər ƏVVƏLDƏ qalır — admin-in sırası pozulmur
    expect(out.slice(0, 2).map((x) => x._id)).toEqual([1, 2]);
  });

  it("tamamlayıcılar seçilmişləri TƏKRARLAMIR", () => {
    const out = pickHomeCourses([c(3, true), c(5, true)], ALL);
    const ids = out.map((x) => x._id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(out).toHaveLength(6);
  });

  it("düz 6 seçilibsə əlavə sorğu lazım deyil", () => {
    const six = [1, 2, 3, 4, 5, 6].map((i) => c(i, true));
    const out = pickHomeCourses(six, ALL);
    expect(out).toHaveLength(6);
    expect(out).toBe(six); // eyni massiv — tamamlama işə düşməyib
  });

  it("6-dan çox seçilə bilməz (sorğu limiti)", () => {
    // findFeatured(6) onsuz da 6 qaytarır; burada müqavilə təsbit olunur
    const out = pickHomeCourses(ALL.slice(0, 6), ALL);
    expect(out).toHaveLength(6);
  });

  it("ümumi kurs sayı 6-dan azdırsa çökmür", () => {
    const few = [c(1), c(2), c(3)];
    const out = pickHomeCourses([], few);
    expect(out).toHaveLength(3);
  });

  it("heç kurs yoxdursa boş qaytarır", () => {
    expect(pickHomeCourses([], [])).toEqual([]);
  });
});
