import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Course, Teacher } from "#models";

/**
 * Müəllim ↔ kurs ↔ filial əlaqəsi.
 *
 * Əvvəl «dərs qrafiki» (CourseGroup: kurs + filial + müəllim + saat) və
 * müəllimin `assignments` cədvəli PARALEL saxlanılırdı: eyni məlumat iki
 * yerdə idi, biri yenilənəndə digəri köhnəlirdi (kurs sihirbazından yazılan
 * kurs müəllimin növbəti saxlanışında itirdi). İndi əlaqə tək yerdədir:
 *
 *   • kursda  → onu keçən müəllimlər (Course.teachers)
 *   • müəllimdə → işlədiyi filiallar (Teacher.branches)
 */

const oid = () => new mongoose.Types.ObjectId();

describe("kurs → müəllimlər", () => {
  it("kursda müəllim siyahısı var", () => {
    const path = Course.schema.path("teachers");
    expect(path).toBeDefined();
    expect(path.options.type[0].ref).toBe("Teacher");
  });

  it("müəllim id-ləri yoxlanılır — mətn qəbul olunmur", async () => {
    const c = new Course({ title: { az: "IELTS" }, category: oid(), teachers: ["bu-id-deyil"] });
    const err = await c.validate().then(() => null, (e) => e);
    expect(err?.errors?.["teachers.0"]).toBeDefined();
  });

  it("müəllimsiz kurs etibarlıdır", async () => {
    const c = new Course({ title: { az: "IELTS" }, category: oid() });
    const err = await c.validate().then(() => null, (e) => e);
    expect(err?.errors?.teachers).toBeUndefined();
    expect(c.teachers).toEqual([]);
  });
});

describe("müəllim → filiallar", () => {
  it("dərs saatı və kurs siyahısı saxlanılmır", () => {
    // Qrafik sistemi çıxarıldı: burada saat, həftə günü və kurs olmamalıdır.
    for (const gone of ["assignments", "courses", "schedule", "timeSlot"]) {
      expect(Teacher.schema.path(gone), gone).toBeUndefined();
    }
    expect(Teacher.schema.path("branches")).toBeDefined();
  });

  it("filialsız müəllim etibarlıdır, filial id-si yoxlanılır", async () => {
    const empty = new Teacher({ fullName: { az: "Aynur" } });
    expect(await empty.validate().then(() => null, (e) => e)).toBeNull();

    const bad = new Teacher({ fullName: { az: "Aynur" }, branches: ["filial"] });
    const err = await bad.validate().then(() => null, (e) => e);
    expect(err?.errors?.["branches.0"]).toBeDefined();
  });
});
