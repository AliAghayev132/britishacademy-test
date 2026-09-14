"use client";

// Lib
import { useT } from "@/lib";

// Local
import { LocaleLink as Link } from "../LocaleLink";

/**
 * Kurs kartlarının vurğu rəngi.
 *
 * TARİXÇƏ: əvvəl səkkiz rəngli palitra vardı və kart rəngini SIRA NÖMRƏSİ
 * seçirdi. İki problemi vardı — kartlar tam rəngli olduğuna görə bölmə
 * rəngarəng görünüb brend rəngini itirirdi, həm də karusel fırlananda sıra
 * dəyişdiyi üçün EYNİ kurs hər dövrədə başqa rəngə düşürdü.
 *
 * İNDİ: kartın FONU da rənglidir — solğun, pastel çalar. Rəng eyni zamanda
 * üst zolaqda, kateqoriya yazısında, haşiyədə və «Kursa bax» linkindədir.
 *
 * ÇALAR 14%-dir və bu rəqəm təsadüfi deyil: mətnlərin kontrastı hesablanıb.
 * 20%-də kartlar daha rəngli olur, amma kateqoriya yazısı öz fonunda AA-nı
 * (4.5:1) keçmir. 14%-də hamısı ≥4.9 ilə keçir.
 */
const CARD_COLORS = [
  "#00157A", // brend mavisi
  "#0F6E64", // firuzəyi
  "#B3352F", // qırmızı
  "#6D3BAF", // bənövşəyi
  // Narıncı `#A85B00` idi — öz pastel fonunda kateqoriya yazısı 4.18 verirdi
  // (AA-dan aşağı). Tündləşdirildi, indi 5.22.
  "#8F4E00", // narıncı-qəhvəyi
  "#0B63A8", // göy
];

/**
 * Rəngi ağ ilə qarışdırıb PASTEL çalar qaytarır.
 *
 * Nəticə QEYRİ-ŞƏFFAF hex-dir. Alfa ilə etmək olmazdı: kart mavi lentin
 * üstündədir, şəffaf fon lentin mavisini içəri buraxardı və çalar rəngindən
 * asılı olmayaraq göyə çalardı.
 */
function tint(hex, amount) {
  const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `#${ch.map((v) => Math.round(v * amount + 255 * (1 - amount)).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Kartın vurğu rəngi.
 *
 * `index` VERİLİBSƏ sıraya görə paylanır — yan-yana duran kartların rəngi
 * TƏMİNATLI şəkildə fərqli olur. Bu vacibdir: rəng heç bir məlumat daşımır
 * (kateqoriya ilə bağlı deyil), məqsəd sadəcə görüntüdür, ona görə ekranda
 * müxtəliflik sabitlikdən üstündür.
 *
 * `index` yoxdursa slug-dan törədilir. Xam qarışdırma ilə paylanma sınandı:
 * bütün 27 kursda altı rəngin hamısı işlənir, amma ana səhifədəki altı
 * SEÇİLMİŞ kurs təsadüfən üç soyuq tona düşürdü — məhz buna görə siyahılarda
 * sıra üstünlük təşkil edir.
 */
function accentFor(key, index) {
  if (Number.isInteger(index)) return CARD_COLORS[index % CARD_COLORS.length];
  const s = String(key || "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return CARD_COLORS[h % CARD_COLORS.length];
}

/** Course card — used on the homepage and category hubs. */
export default function CourseCard({ course, index }) {
  const t = useT();
  const from = course.priceFrom;
  const accent = accentFor(course.slug || course._id, index);
  return (
    <Link
      href={`/kurslar/${course.slug}`}
      className="ba-course"
      style={{
        display: "flex", flexDirection: "column", borderRadius: 20, padding: 26,
        // Pastel rəngli fon. Yuxarıdan aşağı bir az açılır — kart yastı
        // görünməsin. ƏN TÜND nöqtə (14%) yuxarıdadır, kateqoriya yazısı da
        // orada oturur, yəni kontrast hesabı məhz o nöqtəyə görə aparılıb.
        background: `linear-gradient(180deg, ${tint(accent, 0.14)}, ${tint(accent, 0.07)})`,
        border: `1px solid ${accent}3D`,
        "--accent": accent,
        "--accent-soft": `${accent}14`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", letterSpacing: ".05em", textTransform: "uppercase" }}>{course.category?.name || t("card.course")}</span>
        {course.isFeatured && <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--accent)", background: "var(--accent-soft)", padding: "4px 9px", borderRadius: 99 }}>{t("card.popular")}</span>}
      </div>
      <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 22, lineHeight: 1.25, margin: "14px 0 0", letterSpacing: "-.01em", color: "#17171F", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "2.5em" }}>{course.title}</h3>
      <p style={{ fontSize: 14.5, color: "#55555F", margin: "10px 0 0", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", height: "4.65em" }}>{course.lead}</p>
      <div style={{ borderTop: `1px solid ${accent}24`, marginTop: "auto", paddingTop: 18, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        {from ? (
          <div><span style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: 26, color: "#14141C" }}>{from}</span><span style={{ fontSize: 13, color: "#63636E", marginLeft: 4 }}>{t("card.perMonth")}</span></div>
        ) : <span style={{ fontSize: 14, color: "#54545F", fontWeight: 700 }}>{t("card.more")}</span>}
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", whiteSpace: "nowrap" }}>{t("card.view")}</span>
      </div>
    </Link>
  );
}
