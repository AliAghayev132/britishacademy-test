// Models
import { Teacher, Branch, Course } from "#models";
// Data
import { TEACHERS, COURSE_ALIASES, BRANCH_KEYWORDS } from "../data/teacherAssignments.mjs";

/**
 * Müəllim → filial → dərs təyinatlarının importu.
 *
 * Müştəri siyahısını əl ilə köçürmək 39 müəllim üçün həm uzun, həm səhvə
 * açıqdır. Bu servis siyahını bazaya yazır: mövcud müəllimi ADA görə tapır,
 * yoxdursa yaradır, sonra filial üzrə dərslərini təyin edir.
 *
 * İDEMPOTENTDİR — təkrar işlədilə bilər, dublikat yaratmır.
 *
 * Dərs saatı YAZILMIR: müəllim səhifəsi vaxt cədvəli saxlamır.
 */

/** Azərbaycan hərflərinə davamlı normallaşdırma (İ/ı/ə fərqlərini götürür). */
const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ə/g, "e")
    .replace(/\s+/g, " ")
    .trim();

/** Lokallaşdırılmış dəyərdən mətn götür. */
const az = (v) => (v && typeof v === "object" ? v.az || v.en || v.ru || "" : v || "");

/**
 * @param {object} opts
 * @param {boolean} [opts.dryRun]  yalnız hesabat, baza dəyişmir
 * @param {boolean} [opts.replace] mövcud təyinatları əvəz et (yoxsa birləşdir)
 */
export async function importTeacherAssignments({ dryRun = false, replace = true } = {}) {
  const [branches, courses, existing] = await Promise.all([
    Branch.find({ isDeleted: false }).select("name slug"),
    Course.find({ isDeleted: false }).select("title slug"),
    Teacher.find({ isDeleted: false }).select("fullName assignments"),
  ]);

  // Filialı NORMALLAŞDIRILMIŞ ADDA açar sözə görə tapırıq — slug seed ilə
  // canlı baza arasında fərqlənə bilər.
  const findBranch = (key) => {
    const kw = BRANCH_KEYWORDS[key];
    if (!kw) return null;
    return branches.find((b) => norm(az(b.name)).includes(kw)) || null;
  };
  const courseBySlug = new Map(courses.map((c) => [c.slug, c]));
  const teacherByName = new Map(existing.map((t) => [norm(az(t.fullName)), t]));

  const report = [];
  const warnings = [];
  let created = 0;
  let updated = 0;

  // Eyni müəllim birdən çox filialda ola bilər — təyinatları toplayırıq.
  const grouped = new Map();
  for (const row of TEACHERS) {
    const key = norm(row.name);
    if (!grouped.has(key)) grouped.set(key, { name: row.name, rows: [] });
    grouped.get(key).rows.push(row);
  }

  for (const [key, { name, rows }] of grouped) {
    const assignments = [];
    const resolvedNames = [];

    for (const row of rows) {
      const branch = findBranch(row.branch);
      if (!branch) {
        warnings.push(`${name}: «${row.branch}» filialı tapılmadı`);
        continue;
      }

      const courseIds = [];
      for (const label of row.courses) {
        const slug = COURSE_ALIASES[label.toLowerCase()];
        if (!slug || slug.startsWith("__UNMAPPED")) {
          warnings.push(`${name}: «${label}» kursu bazada yoxdur — ötürüldü`);
          continue;
        }
        const course = courseBySlug.get(slug);
        if (!course) {
          warnings.push(`${name}: «${label}» → ${slug} tapılmadı`);
          continue;
        }
        // Pre-IELTS və IELTS eyni kursa düşür — təkrar əlavə etmirik.
        if (!courseIds.some((id) => String(id) === String(course._id))) {
          courseIds.push(course._id);
          resolvedNames.push(az(course.title));
        }
      }

      assignments.push({ branch: branch._id, courses: courseIds });
      if (row.incomplete) {
        warnings.push(`${name}: mənbə siyahısı kəsilib — kurs siyahısı yarımçıq ola bilər`);
      }
    }

    if (!assignments.length) continue;

    const found = teacherByName.get(key);
    const status = found ? "yeniləndi" : "yaradıldı";

    if (!dryRun) {
      if (found) {
        found.assignments = replace
          ? assignments
          : [...(found.assignments || []), ...assignments];
        await found.save();
        updated += 1;
      } else {
        await Teacher.create({ fullName: name, assignments, isActive: true });
        created += 1;
      }
    } else if (found) updated += 1;
    else created += 1;

    report.push({
      name,
      status: dryRun ? `${status} (quru rejim)` : status,
      branches: assignments.length,
      courses: [...new Set(resolvedNames)].join(", ") || "—",
    });
  }

  return {
    dryRun,
    created,
    updated,
    total: grouped.size,
    report,
    warnings: [...new Set(warnings)],
  };
}
