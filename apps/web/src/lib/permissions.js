/**
 * Admin panel bölmələri və icazə yoxlaması (client tərəf).
 *
 * Bu, serverdəki `adminSections` və `requireSection` ilə CÜTDÜR — sidebar-da
 * gizlədilən bölmə API-dən də bağlıdır. Burada yalnız görünüş idarə olunur;
 * təhlükəsizlik serverdədir, çünki client kodu dəyişdirilə bilər.
 */

/** Bütün bölmələri görən rollar — onlara `permissions` yazılmır. */
export const SEES_EVERYTHING = ["superadmin", "developer"];

/** Rol gücü — «özündən yüksək rol vermə» yoxlaması üçün. */
export const ROLE_RANK = { user: 0, editor: 1, admin: 2, superadmin: 3, developer: 4 };

export const ROLE_LABELS = {
  user: "İstifadəçi",
  editor: "Redaktor",
  admin: "Admin",
  superadmin: "Super admin",
  developer: "Developer",
};

/** Sidebar sırasına uyğun bölmə tərifləri. */
export const SECTIONS = [
  { key: "dashboard", label: "İdarə paneli" },
  { key: "leads", label: "Müraciətlər" },
  // Xaricdə təhsil müraciətləri AYRI bölmədir: onları başqa komanda aparır,
  // ona görə adi müraciətlərə icazə vermək bunları açmamalıdır.
  { key: "leads-abroad", label: "Xaricdə təhsil müraciətləri" },
  { key: "home", label: "Ana səhifə" },
  { key: "courses", label: "Kurslar" },
  { key: "teachers", label: "Müəllimlər" },
  { key: "branches", label: "Filiallar" },
  { key: "course-groups", label: "Dərs qrafiki" },
  { key: "testimonials", label: "Rəylər" },
  { key: "destinations", label: "Xaricdə təhsil" },
  // Sidebar-da «Layihələr» bəndi bu açarı işlədirdi, amma siyahıda yox idi —
  // yəni icazəsi məhdud admin ona heç vaxt giriş ala bilmirdi.
  { key: "projects", label: "Layihələr" },
  { key: "blog", label: "Bloq" },
  { key: "resources", label: "Digər resurslar" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "users", label: "İstifadəçilər" },
  { key: "stats", label: "Statistika" },
  { key: "links", label: "İzlənilən linklər" },
  { key: "quizzes", label: "Testlər" },
  { key: "logs", label: "Loglar" },
  { key: "settings", label: "Tənzimləmələr" },
  { key: "developer", label: "Developer" },
];

/** İstifadəçi həmin bölməni görürmü? */
export const canSee = (user, section) => {
  if (!user) return false;
  // Developer alətləri YALNIZ developer rolundadır — superadmin də görmür,
  // çünki oradakı əməliyyatlar məzmunu kütləvi dəyişir.
  if (section === "developer") return user.role === "developer";
  if (SEES_EVERYTHING.includes(user.role)) return true;

  // GERİYƏ UYĞUNLUQ: bu sistemdən əvvəl yaradılmış adminlərin permissions-u
  // boşdur. «Boş = heç nə» olsaydı, onlar sidebar-da yalnız «Profil» görər
  // və paneldən kilidlənərdi. Serverdəki canAccessSection ilə eyni qayda.
  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  if (perms.length === 0) return true;

  return perms.includes(section);
};

/** Aktor hədəf rolu təyin edə bilərmi? (özündən aşağı olmalıdır) */
export const canAssignRole = (actorRole, targetRole) =>
  (ROLE_RANK[actorRole] ?? -1) > (ROLE_RANK[targetRole] ?? 99);

/**
 * URL → bölmə açarı.
 *
 * Sidebar-da gizlətmək kifayət deyil: linki bilən istifadəçi ünvanı birbaşa
 * yaza bilər. Bu xəritə route mühafizəsi üçündür. Serverdəki requireSection
 * onsuz da API-ni bağlayır, bu isə istifadəçinin boş səhifə görməməsi
 * («icazəniz yoxdur» mesajı) üçündür.
 *
 * Ən UZUN uyğunluq qazanır — /dashboard/resurslar/courses həm «resources»,
 * həm «courses» ilə üst-üstə düşür, kurs bölməsi daha dəqiqdir.
 */
const ROUTE_SECTIONS = [
  ["/dashboard/resurslar/courses", "courses"],
  ["/dashboard/resurslar/teachers", "teachers"],
  ["/dashboard/resurslar/branches", "branches"],
  ["/dashboard/resurslar/course-groups", "course-groups"],
  ["/dashboard/resurslar/testimonials", "testimonials"],
  ["/dashboard/resurslar/destinations", "destinations"],
  ["/dashboard/resurslar/blog-posts", "blog"],
  ["/dashboard/resurslar/blog-categories", "blog"],
  ["/dashboard/resurslar/projects", "projects"],
  ["/dashboard/resurslar/quiz-categories", "quizzes"],
  ["/dashboard/resurslar", "resources"],
  ["/dashboard/muracietler/xaricde-tehsil", "leads-abroad"],
  ["/dashboard/muracietler", "leads"],
  ["/dashboard/ana-sehife", "home"],
  ["/dashboard/whatsapp", "whatsapp"],
  ["/dashboard/istifadeciler", "users"],
  ["/dashboard/statistika", "stats"],
  ["/dashboard/linkler", "links"],
  ["/dashboard/testler", "quizzes"],
  ["/dashboard/loglar", "logs"],
  ["/dashboard/tenzimlemeler", "settings"],
  ["/dashboard/developer", "developer"],
  ["/dashboard/profile", null], // profil hər kəsə açıqdır
  ["/dashboard", "dashboard"],
];

/** Verilmiş path hansı bölməyə aiddir? (null = icazə tələb olunmur) */
export const sectionForPath = (pathname) => {
  const p = pathname || "";
  for (const [prefix, section] of ROUTE_SECTIONS) {
    if (p === prefix || p.startsWith(prefix + "/")) return section;
  }
  return null;
};
