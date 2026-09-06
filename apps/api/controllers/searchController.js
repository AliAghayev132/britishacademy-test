// ── Sayt üzrə ümumi axtarış ──
//
// ƏVVƏL NECƏ İDİ: axtarış pəncərəsi YALNIZ kursları tapırdı və onu da
// client tərəfdə edirdi — bütün kurs siyahısı yüklənib brauzerdə süzülürdü.
// Ziyarətçi «IELTS nəticələri» bloq yazısını, «Yay düşərgəsi» layihəsini və
// ya «English test» testini axtaranda «tapılmadı» alırdı.
//
// İNDİ: bir sorğu ilə səkkiz kolleksiya axtarılır və nəticələr növə görə
// qruplaşdırılmış şəkildə qaytarılır.
//
// NİYƏ SERVERDƏ: hər kolleksiyanı brauzerə yükləmək (kurslar + bloq +
// müəllimlər + testlər…) meqabaytlarla trafik deməkdir və mobil bağlantıda
// axtarış pəncərəsi saniyələrlə boş qalardı.

// Models
import {
  Course, BlogPost, Project, Quiz, Destination, Teacher, Branch, Page,
} from "#models";

// Utils
import { asyncHandler, fuzzyRegex } from "#utils";

/**
 * Axtarılan mənbələr.
 *
 * `fields` — həm KÖHNƏ sətir, həm YENİ { az,en,ru } formasında axtarılır
 * (i18n miqrasiyası keçidi; adminController-dəki `list` ilə eyni yanaşma).
 *
 * `href` — nəticənin ünvanı. Kanonik (AZ) yoldur; panel `LocaleLink` ilə
 * onu cari dilin slug-ına çevirir.
 *
 * `base` — həmin modelin PUBLIC süzgəci. Sabit `isActive: true` yazmaq OLMAZ:
 * BlogPost-da belə sahə yoxdur (dərc vəziyyəti `status` ilə idarə olunur), yəni
 * bütün bloq yazıları səssizcə kənarda qalardı.
 */
const SOURCES = [
  {
    key: "courses",
    base: { isActive: true, isDeleted: false },
    label: { az: "Kurslar", en: "Courses", ru: "Курсы" },
    model: Course,
    fields: ["title", "excerpt", "lead"],
    select: "title slug excerpt category",
    populate: { path: "category", select: "name" },
    href: (d) => `/kurslar/${d.slug}`,
    sub: (d) => d.category?.name || d.excerpt,
  },
  {
    key: "blog",
    base: { status: "published", isDeleted: false },
    label: { az: "Bloq", en: "Blog", ru: "Блог" },
    model: BlogPost,
    fields: ["title", "excerpt", "tags"],
    select: "title slug excerpt publishedAt",
    href: (d) => `/bloq/${d.slug}`,
    sub: (d) => d.excerpt,
  },
  {
    key: "projects",
    base: { isActive: true, isDeleted: false },
    label: { az: "Layihələr", en: "Projects", ru: "Проекты" },
    model: Project,
    fields: ["title", "tagline", "lead"],
    select: "title slug tagline lead",
    href: (d) => `/layiheler/${d.slug}`,
    sub: (d) => d.tagline || d.lead,
  },
  {
    key: "quizzes",
    base: { isActive: true, isDeleted: false },
    label: { az: "Testlər", en: "Tests", ru: "Тесты" },
    model: Quiz,
    fields: ["title", "lead", "description"],
    select: "title slug lead",
    href: (d) => `/testler/${d.slug}`,
    sub: (d) => d.lead,
  },
  {
    key: "destinations",
    base: { isActive: true, isDeleted: false },
    label: { az: "Xaricdə təhsil", en: "Study abroad", ru: "Обучение за рубежом" },
    model: Destination,
    fields: ["country", "region", "lead", "tagline"],
    select: "country slug tagline lead region",
    href: (d) => `/xaricde-tehsil/${d.slug}`,
    sub: (d) => d.tagline || d.region,
  },
  {
    key: "teachers",
    base: { isActive: true, isDeleted: false },
    label: { az: "Müəllimlər", en: "Teachers", ru: "Преподаватели" },
    model: Teacher,
    fields: ["fullName", "title", "bio"],
    select: "fullName slug title photo",
    href: (d) => `/muellimler/${d.slug}`,
    sub: (d) => d.title,
  },
  {
    key: "branches",
    base: { isActive: true, isDeleted: false },
    label: { az: "Filiallar", en: "Branches", ru: "Филиалы" },
    model: Branch,
    fields: ["name", "address", "district", "metro"],
    select: "name slug address metro",
    href: (d) => `/filiallar/${d.slug}`,
    sub: (d) => d.address,
  },
  {
    key: "pages",
    base: { isActive: true, isDeleted: false },
    label: { az: "Səhifələr", en: "Pages", ru: "Страницы" },
    model: Page,
    fields: ["title", "lead"],
    select: "title slug lead",
    href: (d) => `/${d.slug}`,
    sub: (d) => d.lead,
  },
];

/** Hər mənbədən götürüləcək maksimum nəticə. */
const PER_SOURCE = 6;

/**
 * GET /api/search?q=...&limit=...
 *
 * Cavab: { query, total, groups: [{ key, label, items: [{ title, sub, href }] }] }
 * `localizeResponse` PublicRouter-də qoşulub, ona görə çoxdilli sahələr
 * cavabda artıq cari dilə çevrilmiş gəlir.
 */
const search = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim();
  // İki hərfdən qısa sorğu demək olar hər şeyi tapır — mənasız yükdür.
  if (q.length < 2) {
    return res.json({ success: true, data: { query: q, total: 0, groups: [] } });
  }

  const perSource = Math.min(20, Math.max(1, Number(req.query.limit) || PER_SOURCE));
  const rx = fuzzyRegex(q); // AZ-a həssas olmayan (İ/ı/ə/ş/ç/ğ/ö/ü)

  const groups = await Promise.all(
    SOURCES.map(async (s) => {
      // Sahələr həm sətir, həm dil obyekti kimi yoxlanılır.
      const or = s.fields.flatMap((f) => [
        { [f]: rx }, { [`${f}.az`]: rx }, { [`${f}.en`]: rx }, { [`${f}.ru`]: rx },
      ]);
      const filter = { ...s.base, $or: or };

      let query = s.model.find(filter).limit(perSource).select(s.select);
      if (s.populate) query = query.populate(s.populate);
      // Bir mənbənin çökməsi bütün axtarışı dağıtmamalıdır (məs. sahə yoxdursa).
      const docs = await query.lean().catch(() => []);

      return {
        key: s.key,
        label: s.label,
        items: docs.map((d) => ({
          _id: d._id,
          title: d.title || d.fullName || d.name || d.country || "",
          sub: s.sub(d) || "",
          href: s.href(d),
        })),
      };
    }),
  );

  const filled = groups.filter((g) => g.items.length);
  res.json({
    success: true,
    data: {
      query: q,
      total: filled.reduce((n, g) => n + g.items.length, 0),
      groups: filled,
    },
  });
});

export { search, SOURCES };
