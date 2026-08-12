// Display config for the generic admin resource browser.
// `title`/`sub` may be a field name or a function of the item.
export const ADMIN_RESOURCES = {
  courses: { name: "Kurslar", title: "title", sub: "slug" },
  "course-categories": { name: "Kurs kateqoriyaları", title: "name", sub: "slug" },
  teachers: { name: "Müəllimlər", title: "fullName", sub: "title" },
  branches: { name: "Filiallar", title: "name", sub: "address" },
  "course-groups": {
    name: "Dərs qrafiki",
    title: (i) => `${pickAz(i.course?.title) || "Kurs"} — ${pickAz(i.branch?.name) || "Filial"}`,
    sub: (i) =>
      `${pickAz(i.teacher?.fullName) || ""} · ${(i.schedule || [])
        .map((s) => `${["", "B.e", "Ç.a", "Çərş", "C.a", "Cümə", "Şən", "Baz"][s.weekday]} ${s.from}`)
        .join(", ")}`,
  },
  testimonials: { name: "Rəylər", title: "name", sub: "achievement" },
  destinations: { name: "Xaricdə təhsil", title: "country", sub: "tagline" },
  "blog-posts": { name: "Bloq yazıları", title: "title", sub: (i) => i.status },
  "blog-categories": { name: "Bloq kateqoriyaları", title: "name", sub: "slug" },
  "menu-items": { name: "Menyu", title: "label", sub: "href" },
  pages: { name: "Səhifələr", title: "title", sub: "slug" },
  partners: { name: "Tərəfdaşlar", title: "name", sub: "url" },
  advantages: { name: "Üstünlüklər", title: "title", sub: "text" },
  faqs: { name: "FAQ", title: "question", sub: "group" },
  media: { name: "Media", title: "filename", sub: "alt" },
  leads: { name: "Müraciətlər", title: "name", sub: "phone" },
};

// Çoxdilli { az,en,ru } dəyəri admin siyahısında AZ variantı ilə göstər.
export const pickAz = (v) =>
  v && typeof v === "object" && !Array.isArray(v) && ("az" in v || "en" in v || "ru" in v)
    ? v.az || v.en || v.ru || ""
    : v;

export const field = (item, spec) =>
  typeof spec === "function" ? pickAz(spec(item)) : pickAz(item?.[spec] ?? "");

// Per-resource filter dropdowns for the list view. Each filter maps to a query
// param the server understands (adminController generic filters). Bool filters
// use string "true"/"false".
const ACTIVE = { key: "isActive", label: "Status", options: [{ value: "true", label: "Aktiv" }, { value: "false", label: "Deaktiv" }] };
const FEATURED = { key: "isFeatured", label: "Seçilmiş", options: [{ value: "true", label: "Bəli" }, { value: "false", label: "Xeyr" }] };

export const RESOURCE_FILTERS = {
  courses: [ACTIVE, FEATURED],
  teachers: [ACTIVE, FEATURED],
  branches: [ACTIVE],
  "course-categories": [ACTIVE],
  "course-groups": [
    { key: "status", label: "Status", options: [
      { value: "open", label: "Açıq" }, { value: "full", label: "Dolu" },
      { value: "ongoing", label: "Davam edir" }, { value: "finished", label: "Bitib" },
      { value: "cancelled", label: "Ləğv edilib" },
    ] },
    { key: "format", label: "Format", options: [{ value: "group", label: "Qrup" }, { value: "individual", label: "Fərdi" }] },
    // Dinamik seçimlər — options /admin/lookups-dan gəlir (bax: [resource]/page.js).
    { key: "branch", label: "Filial", dynamic: "branches" },
    { key: "teacher", label: "Müəllim", dynamic: "teachers" },
  ],
  testimonials: [ACTIVE, { key: "type", label: "Tip", options: [{ value: "video", label: "Video" }, { value: "text", label: "Mətn" }] }],
  destinations: [ACTIVE, { key: "isScholarship", label: "Təqaüd", options: [{ value: "true", label: "Bəli" }, { value: "false", label: "Xeyr" }] }],
  "blog-posts": [{ key: "status", label: "Status", options: [
    { value: "draft", label: "Qaralama" }, { value: "published", label: "Dərc olunub" }, { value: "archived", label: "Arxiv" },
  ] }],
  "blog-categories": [ACTIVE],
  partners: [ACTIVE],
  advantages: [ACTIVE],
  faqs: [ACTIVE],
  pages: [ACTIVE],
};
