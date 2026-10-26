// ── Şəkil spesifikasiyaları ──
// Admin panelində hər şəkil sahəsinin YANINDA göstərilir: harada görünür,
// hansı ölçüdə və necə yerləşdirilir. Kəsmə (crop) dialoqu da bu spesifikasiyanı
// oxuyur — nisbət kilidlənir, çıxış tam həmin piksel ölçüsündə olur.
//
// Dəyərlər uydurma deyil — saytdakı faktiki render-dən götürülüb:
//   ba-news-img → aspectRatio 16/10, object-fit: cover
//   ba-av       → dairə, object-fit: cover (kartda 46px, profildə 110px)
//   ba-partner  → 92px hündür zolaq, maxHeight 56, object-fit: contain
//   VideoCard   → aspectRatio 3/4, object-fit: cover
//   PageBanner  → şəffaf PNG ~800×800, <500 KB
//
// fit: "cover"   → çərçivəni doldurur, artıq hissə kəsilir (fotolar üçün)
// fit: "contain" → şəkil tam sığır, boşluq fonla doldurulur (loqo, maskot)

/**
 * @typedef {object} ImageSpec
 * @property {string}  label   Sahənin adı
 * @property {string}  where   Saytda harada görünür
 * @property {number}  w       Tövsiyə olunan en (px)
 * @property {number}  h       Tövsiyə olunan hündürlük (px)
 * @property {"cover"|"contain"} fit
 * @property {boolean} [transparent] Şəffaflıq vacibdirsə (PNG saxlanılır)
 * @property {string}  [note]  Əlavə qeyd
 */

/** @type {Record<string, ImageSpec>} */
export const IMAGE_SPECS = {
  // ── Kurslar ──
  courseImage: {
    label: "Kurs şəkli",
    where: "Kurs kartı (ana səhifə, kurslar siyahısı) və kurs səhifəsinin başlığı",
    w: 1200, h: 750, fit: "cover",
    note: "Mətn üstündə oxunmalıdır — çox məşğul şəkil seçməyin.",
  },
  courseGallery: {
    label: "Qalereya şəkli",
    where: "Kurs səhifəsindəki qalereya",
    w: 1200, h: 750, fit: "cover",
  },
  categoryImage: {
    label: "Kateqoriya şəkli",
    where: "Kateqoriya hub səhifəsi",
    w: 1200, h: 750, fit: "cover",
  },

  // ── Səhifələr ──
  pageCover: {
    label: "Səhifə şəkli",
    where: "«Haqqımızda» səhifəsindəki mətnin yanındakı foto",
    w: 1200, h: 900, fit: "cover",
    note: "4:3 nisbətdə kəsilir — əsas obyekt mərkəzdə olsun.",
  },

  // ── İnsanlar ──
  teacherPhoto: {
    label: "Müəllim şəkli",
    where: "Müəllim kartı (46px dairə) və profil səhifəsi (110px dairə)",
    w: 600, h: 600, fit: "cover",
    note: "Dairə şəklində kəsilir — üz mərkəzdə olsun.",
  },
  certificate: {
    label: "Sertifikat",
    where: "Müəllim profilində sertifikat siyahısı",
    w: 1000, h: 700, fit: "contain",
    note: "Sənəd tam görünməlidir — kəsilmir.",
  },
  testimonialAvatar: {
    label: "Rəy sahibinin şəkli",
    where: "Rəy kartı (40px dairə)",
    w: 400, h: 400, fit: "cover",
    note: "Boş qalsa ad hərfi göstərilir.",
  },

  // ── Video ──
  videoPoster: {
    label: "Video posteri",
    where: "Video kartı — 3:4 dik format (Tələbələrimiz və ana səhifə swiper-i)",
    w: 900, h: 1200, fit: "cover",
    note: "Video oynamadan əvvəl görünən kadr.",
  },

  // ── Filial / ölkə ──
  branchImage: {
    label: "Filial şəkli",
    where: "Filial səhifəsi qalereyası",
    w: 1200, h: 750, fit: "cover",
  },
  destinationImage: {
    label: "Ölkə şəkli / bayraq",
    where: "Ölkə kartının sağ tərəfində solğun fon (ana səhifə + Xaricdə təhsil)",
    w: 800, h: 1000, fit: "cover",
    note: "Bayraq və ya ölkə fotosu. Kartda 60% enlə, ~17% şəffaflıqla və yumşaq keçidlə göstərilir — detallı şəkil lazım deyil.",
  },

  // ── Bloq ──
  blogCover: {
    label: "Örtük şəkli",
    where: "Bloq kartı (16:10) və yazı səhifəsinin başlığı",
    w: 1200, h: 750, fit: "cover",
  },

  // ── Tərəfdaş ──
  partnerLogo: {
    label: "Tərəfdaş loqosu",
    where: "«Tərəfdaşlarımız» lenti — 92px hündür ağ kart, loqo 56px-ə sığdırılır",
    w: 400, h: 200, fit: "contain", transparent: true,
    note: "Şəffaf fonlu PNG/SVG ən yaxşı nəticəni verir.",
  },

  // ── Maskotlar ──
  mascot: {
    label: "Maskot",
    where: "Səhifə başlığının sağında (mobil ≤680px-də gizlənir)",
    w: 800, h: 800, fit: "contain", transparent: true,
    note: "Şəffaf PNG, 500 KB-dan kiçik.",
  },

  // ── SEO / paylaşım ──
  ogImage: {
    label: "OG şəkil",
    where: "Facebook, WhatsApp, Telegram və Twitter paylaşımlarında",
    w: 1200, h: 630, fit: "cover",
    note: "Standart sosial paylaşım ölçüsü (1.91:1).",
  },

  // ── Brend ──
  brandLogo: {
    label: "Loqo (üfüqi)",
    where: "Header — tünd fon üzərində",
    w: 400, h: 120, fit: "contain", transparent: true,
  },
  brandShield: {
    label: "Qalxan nişanı",
    where: "Footer loqosu, müraciət modalı və favicon mənbəyi",
    w: 512, h: 512, fit: "contain", transparent: true,
  },
  brandBadge: {
    label: "Yubiley nişanı",
    where: "«11 il sizinlə» emblemi",
    w: 400, h: 400, fit: "contain", transparent: true,
  },
  favicon: {
    label: "Favicon",
    where: "Brauzer tabı",
    w: 512, h: 512, fit: "contain", transparent: true,
    note: "Kvadrat, sadə forma — 16px-də də tanınmalıdır.",
  },

  // ── Ümumi ──
  mediaLibrary: {
    label: "Media faylı",
    where: "Media kitabxanası — istənilən yerdə istifadə üçün",
    w: 1600, h: 1000, fit: "cover",
    note: "Sərbəst ölçü: kəsmə pəncərəsində nisbəti «Sərbəst» seçə bilərsiniz.",
  },
};

/** Spesifikasiyanı oxunaqlı bir sətirdə ver: "1200×750 · 16:10 · doldurur" */
export function specSummary(spec) {
  if (!spec) return "";
  const g = gcd(spec.w, spec.h);
  const ratio = `${spec.w / g}:${spec.h / g}`;
  const fit = spec.fit === "cover" ? "doldurur (kəsilir)" : "tam sığır";
  return `${spec.w}×${spec.h} px · ${ratio} · ${fit}`;
}

function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}
