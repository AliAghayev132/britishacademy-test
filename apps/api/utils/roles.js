// Constants
import { ROLE_RANK } from "#constants";

/**
 * Rol iyerarxiyası yoxlaması.
 *
 * Əvvəl kodun hər yerində `req.user?.role !== "admin"` yazılırdı. Rol siyahısı
 * genişlənəndə (superadmin, developer) həmin yoxlamalar ONLARI DA bloklayırdı —
 * daha səlahiyyətli rol daha az işi görə bilirdi. Bu funksiya səviyyəyə görə
 * müqayisə edir, bərabərliyə görə yox.
 *
 * @param {object} user  req.user
 * @param {string} min   tələb olunan minimum rol
 */
export const hasRole = (user, min) =>
  (ROLE_RANK[user?.role] ?? -1) >= (ROLE_RANK[min] ?? 99);

/** Admin panelinin bütün bölmələrini görən rollar. */
export const seesEverything = (user) =>
  user?.role === "superadmin" || user?.role === "developer";

/**
 * İstifadəçi həmin bölməni görə bilirmi?
 * superadmin/developer üçün `permissions` doldurulmur — hamısı açıqdır.
 */
/**
 * İstifadəçinin görə biləcəyi ölkələr (ObjectId sətirləri).
 *
 * `null` = məhdudiyyət yoxdur (hamısını görür). Massiv qaytarılırsa sorğu
 * məhz o ölkələrlə məhdudlaşdırılmalıdır.
 *
 * seesEverything (developer/superadmin) həmişə `null` alır — sahibin öz
 * hesabını təsadüfən kilidləməsinin qarşısını alır.
 */
const scopeOf = (user, field) => {
  if (!user || seesEverything(user)) return null;
  const list = Array.isArray(user[field]) ? user[field] : [];
  return list.length ? list.map(String) : null;
};

/** Xaricdə təhsil müraciətlərində icazəli ölkələr. */
export const destinationScope = (user) => scopeOf(user, "allowedDestinations");

/**
 * Adi müraciətlərdə icazəli filiallar.
 *
 * Filial menecerinin yalnız öz filialının müraciətlərini görməsi üçün.
 * Ölkə əhatəsi ilə eyni qaydalar: boş = məhdudiyyət yoxdur,
 * developer/superadmin həmişə hamısını görür.
 */
export const branchScope = (user) => scopeOf(user, "allowedBranches");

/**
 * Yeni yaradılan istifadəçinin bölmə icazələri.
 *
 * Boş siyahı «bütün bölmələr» deməkdir — bu, KÖHNƏ hesablar üçün geriyə
 * uyğunluqdur (bax canAccessSection). Yeni hesab isə boş yaranırdı və yeni
 * redaktor müraciətləri, logları, WhatsApp-ı görürdü. İndi superadmin/
 * developer olmayan yeni hesab yalnız «İdarə paneli» ilə yaranır; qalan
 * bölmələri superadmin «İcazələr» pəncərəsindən açır.
 */
export const initialPermissions = (role, perms = []) => {
  if (role === "superadmin" || role === "developer") return perms;
  return perms.length ? perms : ["dashboard"];
};

export const canAccessSection = (user, section) => {
  if (!user) return false;
  if (seesEverything(user)) return true;

  // GERİYƏ UYĞUNLUQ: bu sistemdən ƏVVƏL yaradılmış adminlərin `permissions`
  // massivi boşdur. «Boş = heç nə» qəbul etsəydik, deploy-dan sonra bütün
  // mövcud adminlər paneldən kilidlənərdi.
  //
  // Ona görə BOŞ = «məhdudiyyət yoxdur». Superadmin kimisə məhdudlaşdırmaq
  // istəyəndə ən azı bir bölmə seçir; tam bağlamaq üçün hesab deaktiv edilir.
  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  if (perms.length === 0) return true;

  return perms.includes(section);
};
