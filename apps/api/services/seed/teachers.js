// Models
import { Teacher } from "#models";

// Data
import { TEACHERS as TEACHER_ROWS, COURSE_ALIASES, BRANCH_KEYWORDS, triName } from "#data";

// Local
import { SlugService } from "../SlugService.js";
import { TEACHER_COLORS } from "./sourceData.js";

/**
 * Müəllimlər: eyni ad birdən çox filialda ola bilər, ona görə ada görə
 * qruplaşdırılır. Təyinatlar kurslardan sonra doldurulur (assignTeachers).
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
 * ── Müəllim təyinatları: filial → dərs ──
 * Kurslar və filiallar hazır olduqdan sonra qurulur. Dərs SAATI yazılmır —
 * müəllim səhifəsi vaxt cədvəli saxlamır; qrafik CourseGroup-dadır.
 */
export function assignTeachers({ teachers, teacherRowsByName, courses, branches }) {
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

  for (const t of teachers) {
    const rows = teacherRowsByName.get(t.fullName) || [];
    const assignments = [];

    for (const row of rows) {
      const branch = findBranch(row.branch);
      if (!branch) continue;

      const courseIds = [];
      for (const label of row.courses) {
        const slug = COURSE_ALIASES[label.toLowerCase()];
        // Bazada qarşılığı olmayan adlar (Cambridge English, Aptis) ötürülür.
        if (!slug || slug.startsWith("__UNMAPPED")) continue;
        const c = courseBySlug.get(slug);
        // Pre-IELTS və IELTS eyni kursa düşür — təkrar əlavə etmirik.
        if (c && !courseIds.some((id) => String(id) === String(c._id))) courseIds.push(c._id);
      }
      assignments.push({ branch: branch._id, courses: courseIds });
    }

    t.assignments = assignments;
    t.branches = [...new Set(assignments.map((a) => String(a.branch)))];
    t.courses = [...new Set(assignments.flatMap((a) => a.courses.map(String)))];
  }
}
