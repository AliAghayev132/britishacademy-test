// Müraciətlərin görmə sərhədi — bölmə icazəsi və filial/ölkə əhatəsi.
// Saf funksiyalardır: generic CRUD, müraciət statusu, idarə paneli və toplu
// göndəriş eyni qaydadan keçsin deyə bir yerdə saxlanılır.

// Utils
import { destinationScope, branchScope, canAccessSection } from "#utils";

/**
 * «Xaricdə təhsil» müraciətinin əlaməti.
 *
 * Panel bu dəyəri süzgəc kimi göndərir (ApplyModal onu müraciətə belə yazır),
 * server isə icazə sərhədini onunla çəkir. İkisi eyni sətir olmalıdır —
 * `tests/leadSections.test.js` bunu təsbit edir.
 */
export const ABROAD_INTEREST = "Xaricdə təhsil";

/**
 * Müraciətləri istifadəçinin bölmə icazəsinə görə süz.
 *
 * • hər ikisi           → süzgəc yoxdur
 * • yalnız «leads»      → xaricdə təhsil müraciətləri GİZLƏNİR
 * • yalnız «leads-abroad» → YALNIZ onlar görünür
 *
 * Sərhəd serverdədir: arayüzdə bəndi gizlətmək kifayət deyil, sorğu əl ilə
 * dəyişdirilə bilər.
 */
export function applyLeadAccess(filter, req, resource) {
  if (resource !== "leads") return filter;
  const general = canAccessSection(req.user, "leads");
  const abroad = canAccessSection(req.user, "leads-abroad");
  if (general && abroad) return filter;

  const cond = general
    ? { interest: { $ne: ABROAD_INTEREST } }
    : { interest: ABROAD_INTEREST };
  filter.$and = [...(filter.$and || []), cond];
  return filter;
}

/**
 * Siyahını mövzusuna görə ayır: xaricdə təhsil müraciətləri YALNIZ öz
 * səhifəsində görünür (`?abroad=1`), ümumi siyahıda isə gizlədilir.
 *
 * Əvvəl bu ayırma yalnız icazə ilə işləyirdi: hər iki bölməyə çıxışı olan
 * admin (məs. developer) ümumi siyahıda xaricdə təhsil müraciətlərini də
 * görürdü və iki siyahı qarışırdı.
 */
export function applyLeadTopic(filter, req, resource) {
  if (resource !== "leads") return filter;
  const cond = req.query?.abroad === "1"
    ? { interest: ABROAD_INTEREST }
    : { interest: { $ne: ABROAD_INTEREST } };
  filter.$and = [...(filter.$and || []), cond];
  return filter;
}

/** Bu müraciət istifadəçinin bölmə icazəsinə düşürmü? */
export function canSeeLead(user, lead) {
  const isAbroad = lead?.interest === ABROAD_INTEREST;
  return canAccessSection(user, isAbroad ? "leads-abroad" : "leads");
}

/**
 * Müraciət istifadəçinin bölməsinə VƏ filial/ölkə əhatəsinə düşürmü?
 *
 * Əvvəl bu tam yoxlama yalnız oxumada (getOne) idi. Yeniləmə, silmə, status
 * dəyişmə və idarə panelindəki son müraciətlər yalnız bölməyə baxırdı —
 * filial meneceri başqa filialın müraciətini id ilə dəyişə, silə və cavabda
 * tam şəxsi məlumatı ala bilirdi. İndi hamısı bu funksiyadan keçir.
 */
export function leadInReach(user, lead) {
  if (!lead || !canSeeLead(user, lead)) return false;
  const dScope = destinationScope(user);
  const own = (lead.destinations || []).map((d) => String(d?._id || d));
  if (dScope && own.length && !own.some((d) => dScope.includes(d))) return false;
  const bScope = branchScope(user);
  const b = lead.branch ? String(lead.branch._id || lead.branch) : null;
  if (bScope && b && !bScope.includes(b)) return false;
  return true;
}

/**
 * Yazma nəticəsində müraciət istifadəçinin ÖZ görmə sahəsindən çıxırmı?
 *
 * NƏ ÜÇÜN: sərhəd oxumada qorunurdu, yazmada isə yox. Yalnız «müraciətlər»
 * icazəsi olan adam gördüyü müraciətin maraq növünü «Xaricdə təhsil»ə
 * dəyişəndə sənəd onun siyahısından YOX OLURDU — özü də baxa bilmədiyi
 * bölməyə düşürdü. Səlahiyyət artımı deyil, amma müraciəti cavabsız
 * qoymağın səssiz yoludur; eyni hal ölkə və filial əhatəsində də var.
 *
 * Qayda: istifadəçi müraciəti YALNIZ özünün girişi olan bölməyə/əhatəyə
 * köçürə bilər. Hər ikisinə icazəsi olan (və ya məhdudiyyətsiz) adam
 * sərbəstdir — yəni düzəliş işi bloklanmır, sadəcə məsul şəxsə qalır.
 *
 * @returns {string|null} çıxarılan sahənin adı, yoxsa null
 */
export function movesLeadOutOfReach(user, patch) {
  if (patch.interest !== undefined && !canSeeLead(user, patch)) return "maraq növü";

  const dScope = destinationScope(user);
  if (dScope && patch.destinations !== undefined) {
    const ids = (Array.isArray(patch.destinations) ? patch.destinations : []).map(String);
    // Ölkəsiz müraciət əhatədən kənar sayılmır (bax applyLeadScope) — ona
    // görə yalnız DOLU siyahı yoxlanılır.
    if (ids.length && !ids.some((d) => dScope.includes(d))) return "ölkə";
  }

  const bScope = branchScope(user);
  if (bScope && patch.branch) {
    if (!bScope.includes(String(patch.branch))) return "filial";
  }
  return null;
}

/**
 * İstifadəçinin ölkə əhatəsini sorğuya tətbiq edir.
 *
 * YALNIZ `leads` resursuna aiddir. Məhdudiyyət SERVERDƏ qoyulur — filtri
 * yalnız arayüzdə gizlətmək təhlükəsizlik deyil: istifadəçi sorğunu əl ilə
 * dəyişib başqa ölkənin müraciətlərini görə bilərdi.
 *
 * Şərt iki hala baxır:
 *   • müraciətdə icazə verilən ölkələrdən ən azı biri var, VƏ YA
 *   • müraciət ümumiyyətlə ölkəsizdir (adi kurs müraciəti) — belələri
 *     ölkə məhdudiyyətindən kənardır, əks halda məhdud admin adi
 *     müraciətləri də görməzdi.
 */
export function applyLeadScope(filter, req, resource) {
  if (resource !== "leads") return filter;
  const and = [];

  // Ölkə əhatəsi — xaricdə təhsil müraciətləri.
  const dScope = destinationScope(req.user);
  if (dScope) {
    and.push({
      $or: [
        { destinations: { $in: dScope } },
        { destinations: { $size: 0 } },
        { destinations: { $exists: false } },
      ],
    });
  }

  // Filial əhatəsi — adi müraciətlər. Filialsız müraciətlər (ziyarətçi filial
  // seçməyib) kənarda qalmır: əks halda məhdud admin onları heç görməzdi və
  // müraciət cavabsız qalardı.
  const bScope = branchScope(req.user);
  if (bScope) {
    and.push({
      $or: [{ branch: { $in: bScope } }, { branch: null }, { branch: { $exists: false } }],
    });
  }

  // Mövcud $and-a əlavə edirik ki, axtarışdakı $or ilə toqquşmasın.
  if (and.length) filter.$and = [...(filter.$and || []), ...and];
  return filter;
}
