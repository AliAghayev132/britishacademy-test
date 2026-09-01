// ── Köhnə statik saytın URL-ləri ──
//
// Sayt Next.js-ə keçəndə ünvan strukturu dəyişdi: kurslar artıq kökdə deyil,
// `/kurslar/<slug>` altındadır. Köhnə ünvanlar isə hələ də canlıdır —
// axtarış nəticələrində, sosial şəbəkə paylaşımlarında, köhnə reklamlarda.
//
// Analitikaya görə bu səhifələr ayda 8 mindən çox giriş alırdı. Yönləndirmə
// olmasa hamısı 404-ə düşür və həm trafik, həm də illər ərzində toplanmış
// axtarış reytinqi itir.
//
// 301 (permanent) İŞLƏNİR: axtarış motorları köhnə ünvanın çəkisini yeni
// ünvana keçirir. 302 (müvəqqəti) bunu etmir.
//
// Sağ tərəf KANONİK AZ path-dır — dil məntiqi (proxy.js) ondan sonra işləyir,
// ona görə /en, /ru prefiksi burada YAZILMIR.

/**
 * Köhnə ünvan → yeni kanonik path.
 *
 * Şərh sətirlərindəki rəqəmlər köhnə saytın son analitika hesabatındakı
 * aylıq giriş sayıdır — hansı yönləndirmənin nə qədər dəyərli olduğu görünsün.
 */
export const LEGACY_REDIRECTS = {
  // ── Test səhifələri (köhnə saytın ƏN ÇOX girilən səhifələri) ──
  "/english-test": "/testler/english-test", //  1548
  "/rus-dili-test": "/testler/rus-dili-test", //   468

  // ── Kateqoriya səhifələri ──
  "/dil-kurslari": "/kurslar/dil-kurslari", //  1015
  "/ielts-sat-toefl-gmat": "/kurslar/imtahanlar", //   385

  // ── Kurs səhifələri ──
  // Sluglar köhnə ünvanlarla eyniləşdirildi (SeedService), ona görə
  // yönləndirmə yalnız kök → /kurslar prefiksi əlavə edir.
  "/ingilis-dili-kurslari": "/kurslar/ingilis-dili-kurslari", //   680
  "/sat-kurslari": "/kurslar/sat-kurslari", //   364
  "/ielts-kurslari": "/kurslar/ielts-kurslari", //   321

  // ── Qiymət səhifələri ──
  // Ayrıca qiymət səhifəsi yoxdur; qiymətlər kursun öz səhifəsindədir.
  "/ingilis-dili-kurslari-qiymetleri": "/kurslar/ingilis-dili-kurslari", //   575
  "/ielts-kurslari-qiymetleri": "/kurslar/ielts-kurslari", //   537

  // ── SEO açılış səhifələri ──
  // Köhnə saytda ayrıca səhifə idi, məzmunu kurs səhifəsi ilə eyni.
  "/en-yaxsi-ingilis-dili-kurslari": "/kurslar/ingilis-dili-kurslari", //   328
  "/online-ingilis-dili-kurslari": "/kurslar/ingilis-dili-kurslari", //   319

  // ── Digər ──
  "/expert-instructors": "/muellimler", //   553
  "/reservation": "/elaqe", //   306
  // Köhnə saytın defolt dili ingiliscə idi, AZ isə /az altında. İndi əksinədir.
  "/az": "/", //   396

  // ── Bizim öz köhnə sluglarımız ──
  // Aşağıdakı üç kurs yenidən adlandırıldı (köhnə saytın ünvanları daha çox
  // axtarılan formadır: «kursları» ≠ «kursu»). Keçid dövründə köhnə slug ilə
  // paylaşılmış linklər sınmasın.
  "/kurslar/ingilis-dili-kursu": "/kurslar/ingilis-dili-kurslari",
  "/kurslar/ielts": "/kurslar/ielts-kurslari",
  "/kurslar/sat": "/kurslar/sat-kurslari",
};

/**
 * Path üçün yönləndirmə hədəfi (yoxdursa null).
 *
 * Sonuncu «/» nəzərə alınmır: köhnə saytda ünvanlar həm `/dil-kurslari`,
 * həm də `/dil-kurslari/` şəklində indekslənib.
 */
export function legacyTarget(pathname) {
  if (typeof pathname !== "string") return null;
  const key = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return LEGACY_REDIRECTS[key.toLowerCase()] || null;
}
