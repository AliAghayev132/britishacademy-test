/**
 * Müraciəti kursla əlaqələndirmək.
 *
 * Saytın müraciət formu uzun müddət kursu yalnız MƏTN kimi göndərirdi
 * (`interest` — kurs adı və ya «İngilis dili» kimi maraq), `course` sahəsi isə
 * boş qalırdı. Nəticədə statistikadakı «Ən çox müraciət gətirən kurslar»
 * həmişə boş idi, admin paneldə kursa görə süzgəc heç nə tapmırdı.
 *
 * Buradakı funksiyalar mətni kursun adı ilə (AZ/EN/RU — kurs səhifəsi hansı
 * dildə açılıbsa o dildə yazılır) uyğunlaşdırır.
 */

/**
 * Müqayisə üçün normallaşdırma: kiçik hərf, artıq boşluqsuz.
 *
 * I/ı/İ/i eyni sayılır: az-lokalında «IELTS» → «ıelts» olur, ingiliscə yazılmış
 * «ielts» isə uyğun gəlmirdi; «İ».toLowerCase() isə «i» + birləşən nöqtədir.
 */
export const normTitle = (v) =>
  String(v ?? "")
    .toLowerCase()
    .replace(/̇/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();

/** Kurs siyahısından «normallaşdırılmış ad → kurs» xəritəsi (3 dil). */
export function courseTitleIndex(courses = []) {
  const index = new Map();
  for (const c of courses) {
    const title = c?.title;
    const variants = title && typeof title === "object" ? [title.az, title.en, title.ru] : [title];
    for (const t of variants) {
      const key = normTitle(t);
      if (key && !index.has(key)) index.set(key, c);
    }
  }
  return index;
}

const azTitle = (t) => (t && typeof t === "object" ? t.az || t.en || t.ru || "" : t || "");

/**
 * Statistika sıralaması: müraciət qrupları → kurslar və maraqlar.
 *
 * @param {{ course?: any, interest?: string, count: number }[]} groups
 *        Lead aggregation nəticəsi ({course, interest} üzrə sayılmış)
 * @param {Array} courses  { _id, title, slug }
 * @returns {{ title: string, slug?: string, count: number, kind: "course"|"interest" }[]}
 */
export function rankLeadInterests(groups = [], courses = [], limit = 10) {
  const byId = new Map(courses.map((c) => [String(c._id), c]));
  const byTitle = courseTitleIndex(courses);
  const totals = new Map();

  const add = (key, row, count) => {
    const cur = totals.get(key);
    if (cur) cur.count += count;
    else totals.set(key, { ...row, count });
  };

  for (const g of groups) {
    const count = Number(g.count) || 0;
    if (!count) continue;
    // Silinmiş/olmayan kursa bağlı müraciət mətninə görə sayılır.
    const course = (g.course && byId.get(String(g.course))) || byTitle.get(normTitle(g.interest));
    if (course) {
      add(`c:${course._id}`, { title: azTitle(course.title), slug: course.slug, kind: "course" }, count);
      continue;
    }
    const text = String(g.interest ?? "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    add(`i:${normTitle(text)}`, { title: text, kind: "interest" }, count);
  }

  return [...totals.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}
