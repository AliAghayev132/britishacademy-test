// Models
import { Teacher } from "#models";

// Data
import { TEACHERS as TEACHER_ROWS, COURSE_ALIASES, BRANCH_KEYWORDS, triName } from "#data";

// Local
import { SlugService } from "../SlugService.js";
import { TEACHER_COLORS } from "./sourceData.js";

/**
 * Müəllimlər: eyni ad birdən çox filialda ola bilər, ona görə ada görə
 * qruplaşdırılır. Filial və kurs əlaqəsi kurslardan sonra qurulur (linkTeachers).
 */
export function buildTeachers() {
  const teacherRowsByName = new Map();
  for (const row of TEACHER_ROWS) {
    if (!teacherRowsByName.has(row.name)) teacherRowsByName.set(row.name, []);
    teacherRowsByName.get(row.name).push(row);
  }

  const teachers = [...teacherRowsByName.keys()].map(
    (name, i) =>
      new Teacher({
          // Ad tərcümə olunmur; RU üçün kiril yazılışı verilir.
          fullName: triName(name),
        slug: SlugService.slugify(name),
        color: TEACHER_COLORS[i % TEACHER_COLORS.length],
        order: i,
      }),
  );
  return { teachers, teacherRowsByName };
}

/**
 * ── Müəllim ↔ filial və kurs ↔ müəllim əlaqəsi ──
 * Kurslar və filiallar hazır olduqdan sonra qurulur. Saat və həftə günü
 * saxlanılmır: müəllimdə işlədiyi FİLİALLAR, kursda isə onu keçən
 * MÜƏLLİMLƏR yazılır (əlaqə tək yerdədir).
 */
export function linkTeachers({ teachers, teacherRowsByName, courses, branches }) {
  const normKey = (v) =>
    String(v || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ə/g, "e")
      .trim();

  const courseBySlug = new Map(courses.map((c) => [c.slug, c]));
  const findBranch = (key) => {
    const kw = BRANCH_KEYWORDS[key];
    return kw ? branches.find((b) => normKey(b.name).includes(kw)) : null;
  };

  const addTeacher = (course, teacherId) => {
    course.teachers = course.teachers || [];
    if (!course.teachers.some((id) => String(id) === String(teacherId))) {
      course.teachers.push(teacherId);
    }
  };

  for (const t of teachers) {
    const rows = teacherRowsByName.get(t.fullName) || [];
    const branchIds = new Set();

    for (const row of rows) {
      const branch = findBranch(row.branch);
      if (branch) branchIds.add(String(branch._id));

      for (const label of row.courses) {
        const slug = COURSE_ALIASES[label.toLowerCase()];
        // Bazada qarşılığı olmayan adlar (Cambridge English, Aptis) ötürülür.
        if (!slug || slug.startsWith("__UNMAPPED")) continue;
        const c = courseBySlug.get(slug);
        // Pre-IELTS və IELTS eyni kursa düşür — təkrar əlavə olunmur.
        if (c) addTeacher(c, t._id);
      }
    }

    t.branches = [...branchIds];
  }
}
