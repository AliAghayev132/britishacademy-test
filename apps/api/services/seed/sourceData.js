// ── Source data (from the static build) ──
// Filial məlumatları ayrıca data faylındadır (import ilə gəlir).
//
// Müəllimlər müştəri siyahısından gəlir (data/teacherAssignments.mjs) —
// əvvəlki mock adlar əvəz olundu. Təyinatlar (filial → dərs) kurslar
// yaradıldıqdan SONRA qurulur, çünki kurs id-ləri lazımdır.

export const CATEGORIES = [
  { key: "xidmetler", name: "Xidmətlər", parent: null, icon: "⚙️", order: 1 },
  { key: "dil-kurslari", name: "Dil Kursları", parent: "xidmetler", icon: "🗣️", order: 1 },
  { key: "danisiq", name: "Danışıq Klubları və Praktika", parent: "xidmetler", icon: "💬", order: 2 },
  { key: "imtahanlar", name: "Beynəlxalq imtahanlara hazırlıq", parent: "xidmetler", icon: "🎓", order: 3 },
  { key: "sertifikat", name: "Peşəkar Sertifikat Proqramları", parent: "xidmetler", icon: "📜", order: 4 },
  { key: "komputer", name: "Kompüter Kursu", parent: "xidmetler", icon: "💻", order: 5 },
  { key: "karyera", name: "Karyera kursları", parent: "xidmetler", icon: "💼", order: 6 },
  { key: "usaq", name: "Uşaq Proqramları", parent: null, icon: "🧒", order: 2 },
];

export const COURSES = [
  { slug: "ingilis-dili-kurslari", title: "İngilis dili kursu", cat: "dil-kurslari", featured: true },
  { slug: "biznes-ingilis-dili-kursu", title: "Biznes İngilis dili kursu", cat: "dil-kurslari", featured: true },
  { slug: "huquqsunaslar-ingilis-dili-kursu", title: "Hüquqşünaslar üçün İngilis dili", cat: "dil-kurslari" },
  { slug: "otel-turizm-ingilis-dili-kursu", title: "Otel və Turizm üçün İngilis dili", cat: "dil-kurslari" },
  { slug: "alman-dili-kursu", title: "Alman dili kursu", cat: "dil-kurslari", onlyMain: true },
  { slug: "beynelxalq-sertifikatli-alman-dili-kursu", title: "Beynəlxalq Sertifikatlı Alman dili", cat: "dil-kurslari" },
  { slug: "rus-dili-kursu", title: "Rus dili kursu", cat: "dil-kurslari", featured: true },
  { slug: "ispan-dili-kursu", title: "İspan dili kursu", cat: "dil-kurslari" },
  { slug: "italyan-dili-kursu", title: "İtalyan dili kursu", cat: "dil-kurslari" },
  { slug: "fransiz-dili-kursu", title: "Fransız dili kursu", cat: "dil-kurslari" },
  { slug: "conversation-club", title: "Conversation Club", cat: "danisiq" },
  { slug: "workshop", title: "Workshop", cat: "danisiq" },
  { slug: "ielts-kurslari", title: "IELTS & Pre-IELTS", cat: "imtahanlar", featured: true },
  { slug: "toefl", title: "TOEFL & Pre-TOEFL", cat: "imtahanlar" },
  { slug: "oet", title: "OET (Tibb işçiləri üçün)", cat: "imtahanlar" },
  { slug: "toeic", title: "TOEIC (Rəsmi imtahan)", cat: "imtahanlar" },
  { slug: "sat-kurslari", title: "SAT & Pre-SAT", cat: "imtahanlar" },
  { slug: "duolingo", title: "Duolingo", cat: "imtahanlar" },
  { slug: "toles", title: "TOLES", cat: "imtahanlar" },
  { slug: "tefl-kurslari", title: "TEFL Kursları", cat: "sertifikat" },
  { slug: "ms-office", title: "MS Office proqramları", cat: "komputer", featured: true },
  { slug: "pesekar-excel-kursu", title: "Peşəkar Excel kursu", cat: "komputer" },
  { slug: "muhasibatliq-1c-kursu", title: "Mühasibatlıq və 1C kursu", cat: "karyera" },
  { slug: "hr-karguzarliq-kursu", title: "HR & Kargüzarlıq kursu", cat: "karyera" },
  { slug: "usaq-ingilis-dili", title: "Uşaqlar üçün İngilis dili", cat: "usaq", featured: true },
  { slug: "usaq-rus-dili", title: "Uşaqlar üçün Rus dili", cat: "usaq" },
  { slug: "usaq-mentiq", title: "Uşaqlar üçün Məntiq", cat: "usaq" },
];

export const DESTINATIONS = [
  { country: "Almaniya", region: "Avropa", color: "#DD0000", tagline: "Ödənişsiz universitetlər" },
  { country: "Türkiyə", region: "Avropa", color: "#E30A17", tagline: "Bakalavr & master" },
  { country: "İngiltərə", region: "Avropa", color: "#C8102E", tagline: "Dünya səviyyəli təhsil" },
  { country: "Kanada", region: "Şimali Amerika", color: "#D80621", tagline: "Bakalavr, master, dil" },
  { country: "Polşa", region: "Avropa", color: "#DC143C", tagline: "Sərfəli təhsil" },
  { country: "Latviya", region: "Avropa", color: "#9E3039", tagline: "Avropa diplomu" },
  { country: "Macarıstan", region: "Avropa", color: "#477050", tagline: "Stipendium Hungaricum" },
  { country: "Litva", region: "Avropa", color: "#006A44", tagline: "Sərfəli Avropa təhsili" },
  { country: "Rusiya", region: "Region", color: "#0039A6", tagline: "Aparıcı universitetlər" },
  { country: "Gürcüstan", region: "Region", color: "#E8112D", tagline: "Tibb & universitet" },
  { country: "Estoniya", region: "Avropa", color: "#0072CE", tagline: "Rəqəmsal ölkə" },
  { country: "Təqaüd Proqramları", region: "Proqram", color: "#7C4DFF", tagline: "Tam & qismən təqaüd", isScholarship: true },
];

export const TESTIMONIALS = [
  { name: "Aysel Məmmədova", type: "video", achievement: "IELTS Hazırlıq · 7.5 bal", video: { durationSeconds: 25 }, isFeatured: true },
  { name: "Rəşad Quliyev", type: "video", achievement: "Biznes İngilis dili", video: { durationSeconds: 58 }, isFeatured: true },
  { name: "Nigar Əhmədzadə", type: "video", achievement: "İngilis dili · C1", video: { durationSeconds: 53 }, isFeatured: true },
  { name: "Bülbül İsmayılova", type: "video", achievement: "Xaricdə təhsil · Almaniya", video: { durationSeconds: 47 }, isFeatured: true },
  { name: "Leyla Hüseynova", type: "text", achievement: "İngilis dili · B2", rating: 5, color: "#2E6BE6", quote: "Sıfırdan başladım, dörd ayda B2 səviyyəsinə çatdım. Ən çox xoşuma gələn danışıq klublarıdır — dərsdə öyrəndiyini elə həmin həftə real söhbətdə işlədirsən." },
  { name: "Elvin Səfərov", type: "text", achievement: "IELTS · 7.0 bal", rating: 5, color: "#7C4DFF", quote: "İkinci cəhdimdə 7.0 aldım. Müəllim hər həftə yazı tapşırıqlarımı ayrıca yoxlayır, səhvlərimi bir-bir izah edirdi." },
  { name: "Günel Rzayeva", type: "text", achievement: "Uşaqlar üçün İngilis", rating: 5, color: "#FF3D8B", quote: "Oğlum 8 yaşındadır, dərsə həvəslə gedir. Oyunlarla keçdikləri üçün onun üçün bu, dərs yox, əyləncədir." },
  { name: "Tural Abbasov", type: "text", achievement: "Biznes İngilis dili", rating: 5, color: "#F5A524", quote: "Xarici tərəfdaşlarla görüşlərdə özümü rahat hiss edirəm. Təqdimat hazırlamağı və işgüzar yazışmanı ayrıca öyrətdilər." },
  { name: "Aynur Kərimli", type: "text", achievement: "Alman dili · A2", rating: 5, color: "#12B5A5", quote: "Almaniyada təhsil üçün hazırlaşıram. Qrup kiçik olduğuna görə müəllim hər kəsə ayrıca vaxt ayıra bilir." },
  { name: "Səbinə Nəbiyeva", type: "text", achievement: "Rus dili kursu", rating: 5, color: "#E0533D", quote: "Uzun illər dili anlayırdım, amma danışa bilmirdim. Buradakı danışıq blokları məni bu kompleksdən qurtardı." },
];

export const ADVANTAGES = [
  { title: "Müəllimlər", text: "IELTS 8.0–8.5 sertifikatlı, xaricdə təhsil almış, beynəlxalq təcrübəli müəllimlər.", color: "#7C4DFF" },
  { title: "Kiçik qruplar", text: "3–6 tələbədən ibarət qruplar və ya tam fərdi dərs formatı.", color: "#0EA5E9" },
  { title: "Xüsusi metodika", text: "Böyük Britaniyada hazırlanmış kitablarla 4 dəfə sürətli öyrənmə.", color: "#FF5A3C" },
  { title: "Kampaniyalar", text: "Sərfəli qiymətlər, mövsüm və bayram endirimləri.", color: "#F5A524" },
  { title: "Müasir siniflər", text: "Bütün lazımi avadanlıqla təchiz olunmuş rahat sinif otaqları.", color: "#12B5A5" },
  { title: "Ödənişsiz vəsaitlər", text: "Dərs kitabları və hər gün təşkil olunan danışıq klubları ödənişsiz.", color: "#22B07D" },
];

export const PARTNERS = ["Rabitəbank", "AzerGold", "Veysəloğlu", "ARB 24", "Araz Market", "PMD Group", "Alfa Telekom", "Petrochem", "A+CO", "Green Plast", "Caspian Pipe", "Enefcon"].map((name, i) => ({ name, order: i }));

// Menyu ağacı. `children` olan bənd başlıqda dropdown kimi göstərilir
// (bax apps/web (public)/layout.js — variant: "links").
//
// Müəllimlər və Tələbələrimiz əvvəl ayrıca üst səviyyə bəndləri idi; menyu
// yeddi bənddən ibarət olub dar ekranlarda sıxılırdı. İndi hər ikisi
// «Haqqımızda» altındadır — məzmunca da ora aiddirlər.
export const HEADER_MENU = [
  {
    label: "Haqqımızda",
    href: "/haqqimizda",
    type: "link",
    children: [
      { label: "Haqqımızda", href: "/haqqimizda", type: "link" },
      { label: "Müəllimlər", href: "/muellimler", type: "link" },
      { label: "Tələbələrimiz", href: "/telebelerimiz", type: "link" },
    ],
  },
  { label: "Xidmətlər", href: "/kurslar/xidmetler", type: "mega" },
  { label: "Xaricdə təhsil", href: "/xaricde-tehsil", type: "dropdown" },
  { label: "Filiallar", href: "/filiallar", type: "link" },
  { label: "Əlaqə", href: "/elaqe", type: "link" },
];

/** Fotosu olmayan müəllim üçün avatar rəngi. */
export const TEACHER_COLORS = ["#2E6BE6", "#12B5A5", "#7C4DFF", "#E0533D", "#F5A524", "#0EA5E9", "#FF3D8B", "#22B07D"];
