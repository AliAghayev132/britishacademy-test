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
