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
  { key: "courses", label: "Kurslar" },
  { key: "teachers", label: "Müəllimlər" },
  { key: "branches", label: "Filiallar" },
  { key: "course-groups", label: "Dərs qrafiki" },
  { key: "testimonials", label: "Rəylər" },
  { key: "destinations", label: "Xaricdə təhsil" },
  { key: "blog", label: "Bloq" },
  { key: "resources", label: "Digər resurslar" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "users", label: "İstifadəçilər" },
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
