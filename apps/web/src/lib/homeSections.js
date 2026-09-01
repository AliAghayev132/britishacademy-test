/**
 * Ana səhifə bölmələri — tək mənbə.
 *
 * Həm public səhifə (nəyi render etmək), həm admin paneli (nəyi idarə etmək)
 * bu siyahıdan istifadə edir. Əvvəl bölmələr kodda sabit ardıcıllıqla idi və
 * birini gizlətmək üçün deploy lazım gəlirdi.
 *
 * `manage` — həmin bölmənin məzmununun idarə olunduğu admin səhifəsi.
 * Boş olanda məzmun Tənzimləmələrdən gəlir (hero, marquee, stats).
 *
 * `limit` — ana səhifədə göstərilən maksimum element (getHome-dakı ilə eyni).
 */
export const HOME_SECTIONS = [
  {
    key: "hero",
    label: "Hero",
    hint: "Başlıq, fırlanan sözlər, üzən həblər və statistika",
    manage: "/dashboard/tenzimlemeler",
    locked: true, // Hero həmişə görünür — onsuz səhifə başlıqsız qalır
  },
  {
    key: "marquee",
    label: "Hərəkət edən lent",
    hint: "Hero-nun altındakı sürüşən sözlər",
    manage: "/dashboard/tenzimlemeler",
  },
  {
    key: "courses",
    label: "Kurslarımız",
    hint: "Seçilmiş kurslar; 6-dan az seçiləndə qalanı avtomatik tamamlanır",
    manage: "/dashboard/resurslar/courses",
    limit: 6,
  },
  {
    key: "advantages",
    label: "Üstünlüklər",
    hint: "«Niyə British Academy» kartları",
    manage: "/dashboard/resurslar/advantages",
  },
  {
    key: "destinations",
    label: "Xaricdə təhsil",
    hint: "Seçilmiş ölkələr",
    manage: "/dashboard/resurslar/destinations",
    limit: 8,
  },
  {
    key: "videos",
    label: "Məzunlar danışır",
    hint: "Video rəylər (swiper)",
    manage: "/dashboard/resurslar/testimonials",
    limit: 8,
  },
  {
    key: "testimonials",
    label: "Yazılı rəylər",
    hint: "Mətn rəyləri divarı",
    manage: "/dashboard/resurslar/testimonials",
    limit: 6,
  },
  {
    key: "blog",
    label: "Bloq",
    hint: "Ən son yazılar",
    manage: "/dashboard/resurslar/blog-posts",
  },
  {
    key: "faq",
    label: "Tez-tez verilən suallar",
    hint: "Admin paneldəki FAQ siyahısı (boşdursa hazır mətnlər)",
    manage: "/dashboard/resurslar/faqs",
  },
  {
    key: "partners",
    label: "Tərəfdaşlar",
    hint: "Logo karuseli",
    manage: "/dashboard/resurslar/partners",
  },
  {
    key: "cta",
    label: "Çağırış bloku",
    hint: "«Ödənişsiz sınaq dərsinə yazıl» banneri",
    manage: "",
  },
];

/** Bölmə açarlarının defolt sırası. */
export const DEFAULT_ORDER = HOME_SECTIONS.map((s) => s.key);

/**
 * Saxlanmış konfiqi tam siyahıya çevir.
 *
 * BOŞ konfiq = «hamısı göstərilir» — köhnə qurulumlar heç nə itirmir.
 * Konfiqdə olmayan yeni bölmə (kod yeniləndikdə) defolt olaraq AÇIQ gəlir,
 * əks halda yeni bölmə səssizcə gizli qalardı.
 */
export function resolveSections(saved) {
  const list = Array.isArray(saved) ? saved : [];
  if (!list.length) return HOME_SECTIONS.map((s) => ({ ...s, enabled: true }));

  const byKey = new Map(list.map((x) => [x.key, x]));
  const known = new Set(HOME_SECTIONS.map((s) => s.key));

  // Saxlanmış sıra əsasdır; siyahıda olmayanlar sona əlavə olunur.
  const ordered = [
    ...list.filter((x) => known.has(x.key)).map((x) => x.key),
    ...HOME_SECTIONS.filter((s) => !byKey.has(s.key)).map((s) => s.key),
  ];

  return ordered.map((key) => {
    const def = HOME_SECTIONS.find((s) => s.key === key);
    const cfg = byKey.get(key);
    return { ...def, enabled: def.locked ? true : cfg?.enabled !== false };
  });
}

/** Bölmə açıqdırmı? (public səhifə üçün sürətli yoxlama) */
export function sectionEnabled(saved, key) {
  const def = HOME_SECTIONS.find((s) => s.key === key);
  if (def?.locked) return true;
  const list = Array.isArray(saved) ? saved : [];
  if (!list.length) return true;
  const hit = list.find((x) => x.key === key);
  // Konfiqdə yoxdursa yeni bölmədir — göstərilir.
  return hit ? hit.enabled !== false : true;
}
