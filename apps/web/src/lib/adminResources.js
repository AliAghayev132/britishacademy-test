// Display config for the generic admin resource browser.
// `title`/`sub` may be a field name or a function of the item.
export const ADMIN_RESOURCES = {
  courses: { name: "Kurslar", title: "title", sub: "slug" },
  "course-categories": { name: "Kurs kateqoriyaları", title: "name", sub: "slug" },
  teachers: { name: "Müəllimlər", title: "fullName", sub: "title" },
  branches: { name: "Filiallar", title: "name", sub: "address" },
  "course-groups": {
    name: "Dərs qrafiki",
    title: (i) => `${i.course?.title || "Kurs"} — ${i.branch?.name || "Filial"}`,
    sub: (i) =>
      `${i.teacher?.fullName || ""} · ${(i.schedule || [])
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

export const field = (item, spec) =>
  typeof spec === "function" ? spec(item) : item?.[spec] ?? "";
