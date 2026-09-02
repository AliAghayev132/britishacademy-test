// ── Seed service ──
// Rebuilds the whole British Academy content graph from the known static-site
// data and (re)loads it into MongoDB. Used by the CLI (scripts/seed.js) AND by
// the admin "Developer" panel (POST /api/admin/dev/seed).
//
// Self-contained: the long course copy lives at data/courseContent.mjs (copied
// from the legacy generator) so this works inside the standalone server repo.
//
// ⚠️ seedDatabase() WIPES the BA content collections before inserting.
import { TEACHERS as TEACHER_ROWS, COURSE_ALIASES, BRANCH_KEYWORDS } from "../data/teacherAssignments.mjs";
import { triName } from "../data/teacherNames.mjs";
import { BRANCHES } from "../data/branchData.mjs";
import { tri, FAQS } from "../data/translations.mjs";
import { QUIZZES } from "../data/quizData.mjs";

// Models
import {
  SiteSetting, Branch, Teacher, CourseCategory, Course, CourseGroup,
  Testimonial, Destination, MenuItem, Partner, Advantage, Page, Faq, Quiz,
} from "#models";

// Local
import { SlugService } from "./SlugService.js";
import { COURSE_CONTENT } from "../data/courseContent.mjs";

// ── Source data (from the static build) ──
// Filial məlumatları ayrıca data faylındadır (import ilə gəlir).


// Müəllimlər müştəri siyahısından gəlir (data/teacherAssignments.mjs) —
// əvvəlki mock adlar əvəz olundu. Təyinatlar (filial → dərs) kurslar
// yaradıldıqdan SONRA qurulur, çünki kurs id-ləri lazımdır.

const CATEGORIES = [
  { key: "xidmetler", name: "Xidmətlər", parent: null, icon: "⚙️", order: 1 },
  { key: "dil-kurslari", name: "Dil Kursları", parent: "xidmetler", icon: "🗣️", order: 1 },
  { key: "danisiq", name: "Danışıq Klubları və Praktika", parent: "xidmetler", icon: "💬", order: 2 },
  { key: "imtahanlar", name: "Beynəlxalq imtahanlara hazırlıq", parent: "xidmetler", icon: "🎓", order: 3 },
  { key: "sertifikat", name: "Peşəkar Sertifikat Proqramları", parent: "xidmetler", icon: "📜", order: 4 },
  { key: "komputer", name: "Kompüter Kursu", parent: "xidmetler", icon: "💻", order: 5 },
  { key: "karyera", name: "Karyera kursları", parent: "xidmetler", icon: "💼", order: 6 },
  { key: "usaq", name: "Uşaq Proqramları", parent: null, icon: "🧒", order: 2 },
];

const COURSES = [
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

const DESTINATIONS = [
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

const TESTIMONIALS = [
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

const ADVANTAGES = [
  { title: "Müəllimlər", text: "IELTS 8.0–8.5 sertifikatlı, xaricdə təhsil almış, beynəlxalq təcrübəli müəllimlər.", color: "#7C4DFF" },
  { title: "Kiçik qruplar", text: "3–6 tələbədən ibarət qruplar və ya tam fərdi dərs formatı.", color: "#0EA5E9" },
  { title: "Xüsusi metodika", text: "Böyük Britaniyada hazırlanmış kitablarla 4 dəfə sürətli öyrənmə.", color: "#FF5A3C" },
  { title: "Kampaniyalar", text: "Sərfəli qiymətlər, mövsüm və bayram endirimləri.", color: "#F5A524" },
  { title: "Müasir siniflər", text: "Bütün lazımi avadanlıqla təchiz olunmuş rahat sinif otaqları.", color: "#12B5A5" },
  { title: "Ödənişsiz vəsaitlər", text: "Dərs kitabları və hər gün təşkil olunan danışıq klubları ödənişsiz.", color: "#22B07D" },
];

const PARTNERS = ["Rabitəbank", "AzerGold", "Veysəloğlu", "ARB 24", "Araz Market", "PMD Group", "Alfa Telekom", "Petrochem", "A+CO", "Green Plast", "Caspian Pipe", "Enefcon"].map((name, i) => ({ name, order: i }));

// Menyu ağacı. `children` olan bənd başlıqda dropdown kimi göstərilir
// (bax apps/web (public)/layout.js — variant: "links").
//
// Müəllimlər və Tələbələrimiz əvvəl ayrıca üst səviyyə bəndləri idi; menyu
// yeddi bənddən ibarət olub dar ekranlarda sıxılırdı. İndi hər ikisi
// «Haqqımızda» altındadır — məzmunca da ora aiddirlər.
const HEADER_MENU = [
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

// ── Converters ──
//
// Qiymət generatoru SİLİNDİ. Əvvəl hər kurs üçün `base` dəyəri götürülüb
// filiala görə ±10 AZN sürüşdürülür, fərdi dərs isə qrupun 2.2 mislinə
// yuvarlaqlaşdırılırdı — yəni bütün qiymətlər DÜSTURLA uydurulmuşdu və
// həqiqi qiymətlərlə əlaqəsi yox idi. Belə rəqəmlər saytda göstərilməkdənsə
// heç olmaması yaxşıdır: admin paneldən doldurulur.

/**
 * Siyahı tipli sahə ({ az, en, ru } — hər dil üçün sətir-sətir mətn).
 *
 * `content.$.items` LIST_LOCALIZED_FIELDS-dədir: massiv yox, hər dil üçün
 * sətir keçidi ilə ayrılmış MƏTN saxlanılır (boş massiv truthy olduğuna görə
 * AZ fallback-i sındırardı).
 */
const triList = (arr) => {
  const parts = (arr || []).map(tri);
  return {
    az: parts.map((x) => x.az).join("\n"),
    en: parts.map((x) => x.en).join("\n"),
    ru: parts.map((x) => x.ru).join("\n"),
  };
};

/** Boş dəyəri toxunulmaz burax — tri(undefined) {az:undefined} qaytarardı. */
const triOpt = (v) => (v ? tri(v) : undefined);

function toContentBlocks(C) {
  const blocks = [];
  (C.intro || []).forEach((body) => blocks.push({ type: "paragraph", body: tri(body) }));
  (C.sections || []).forEach((s) => {
    const base = { heading: triOpt(s.t), headingLevel: s.h === 3 ? 3 : 2 };
    if (s.p && s.p.length) blocks.push({ ...base, type: "paragraph", body: tri(s.p.join("\n\n")) });
    else blocks.push({ ...base, type: "paragraph", body: tri("") });
    if (s.ul) blocks.push({ type: "list", items: triList(s.ul) });
    if (s.dl) blocks.push({ type: "definitions", definitions: s.dl.map(([term, description]) => ({ term: tri(term), description: tri(description) })) });
    if (s.highlight) blocks.push({ type: "highlight", body: tri(s.highlight) });
    if (s.note) blocks.push({ type: "note", body: tri(s.note) });
  });
  return blocks;
}

const toInfo = (C) => (C.info || []).map(([label, value]) => ({ label: tri(label), value: tri(value) }));
const toFaq = (C) => (C.faq || []).map(([question, answer]) => ({ question: tri(question), answer: tri(answer) }));

/** Fotosu olmayan müəllim üçün avatar rəngi. */
const TEACHER_COLORS = ["#2E6BE6", "#12B5A5", "#7C4DFF", "#E0533D", "#F5A524", "#0EA5E9", "#FF3D8B", "#22B07D"];

// ── Build the full document graph (pure — no DB) ──
export function buildGraph() {
  const site = new SiteSetting({
    key: "site",
    brand: {
      name: "British Academy", logo: "/assets/logo.png", logoStack: "/assets/logo-stack.png",
      shield: "/assets/shield.png", badge: "/assets/badge11.png", favicon: "/assets/favicon.png",
      ogImage: "/assets/og-cover.png", themeColor: "#00157A",
    },
    contact: {
      phone: "(+994) 55 212 41 51", phone2: "(+994 12) 497 62 97", email: "office@britishacademy.az",
      address: "C.Cabbarlı 44, Caspian Plaza", hours: "Həftə içi 09:00–21:00 · Şənbə 10:00–16:00",
    },
    socials: {
      instagram: "https://instagram.com/britishacademy.az", facebook: "https://facebook.com/britishacademy.az",
      youtube: "https://youtube.com/@britishacademy", whatsapp: "https://wa.me/994552124151",
    },
    hero: {
      titlePrefix: tri("British Academy ilə"),
      // «xaricdə oxu» prefikslə birləşəndə «British Academy ilə xaricdə oxu»
      // oxunurdu; müştəri vurğunu universitet qəbuluna keçirdi.
      words: triList(["ingiliscə danış", "IELTS 8.5 al", "rus dili öyrən", "almanca danış", "top universitetlərə qəbul ol", "Duolingo-ya hazırlaş"]),
      colors: ["#001478", "#0B2A9C", "#C8102E", "#00105E", "#1438B8"],
      subtitle: tri("British Academy ilə top universitetlərə qəbul ol."),
    },
    stats: [
      { label: tri("məzun tələbə"), value: tri("20 000+") },
      { label: tri("korporativ tərəfdaş"), value: tri("30+") },
      { label: tri("filial · Bakı"), value: tri("4") },
    ],
    marquee: triList(["İNGİLİS DİLİ", "IELTS 8.5", "DUOLINGO", "DANIŞIQ KLUBU", "XARİCDƏ TƏHSİL", "RUS DİLİ", "ALMAN DİLİ", "BİZNES İNGİLİS"]),
    seo: {
      titleTemplate: "%s — British Academy",
      defaultDescription: tri("British Academy — English UK akkreditasiyalı dil mərkəzi. İngilis, rus, alman dili kursları, IELTS · TOEFL hazırlığı və xaricdə təhsil."),
      defaultOgImage: "/assets/og-cover.png",
    },
    robotsTxt: "User-agent: *\nAllow: /\n\nSitemap: https://britishacademy.az/sitemap.xml\n",
  });

  // Filial adı üçdillidir ({az,en,ru}); slugify obyekti «object-object»-ə
  // çevirirdi və dörd filialın hamısı eyni slug alıb unikal indeksi pozurdu
  // (seed 409 Conflict ilə dayanırdı). Slug AZ mətndən qurulur.
  const branches = BRANCHES.map((b, i) => new Branch({ ...b, slug: SlugService.slugify(b.name?.az || b.name), order: i }));

  const catByKey = {};
  const categories = CATEGORIES.map((c) => {
    const doc = new CourseCategory({ name: tri(c.name), slug: c.key, icon: c.icon, order: c.order });
    catByKey[c.key] = doc;
    return doc;
  });
  CATEGORIES.forEach((c, i) => { if (c.parent) categories[i].parent = catByKey[c.parent]._id; });

  // Müəllimlər: eyni ad birdən çox filialda ola bilər, ona görə ada görə
  // qruplaşdırılır. Təyinatlar aşağıda (kurslardan sonra) doldurulur.
  const teacherRowsByName = new Map();
  for (const row of TEACHER_ROWS) {
    if (!teacherRowsByName.has(row.name)) teacherRowsByName.set(row.name, []);
    teacherRowsByName.get(row.name).push(row);
  }

  const teachers = [...teacherRowsByName.keys()].map(
    (name, i) =>
      new Teacher({
          // Ad tərcümə olunmur; RU üçün kiril yazılışı verilir.
          fullName: triName(name),
        slug: SlugService.slugify(name),
        color: TEACHER_COLORS[i % TEACHER_COLORS.length],
        order: i,
      }),
  );

  const courses = COURSES.map((c, i) => {
    const C = COURSE_CONTENT[`${c.slug}.html`] || {};
    return new Course({
      title: tri(c.title), slug: c.slug, category: catByKey[c.cat]._id,
      h1: triOpt(C.h1), lead: triOpt(C.lead), excerpt: triOpt(C.lead),
      content: toContentBlocks(C), faq: toFaq(C), info: toInfo(C),
      levels: ["A1", "A2", "B1", "B2", "C1", "C2"],
      // Qiymətlər BOŞ gəlir — admin paneldən filial üzrə doldurulur.
      pricingMode: "branch",
      pricing: [],
      customPricing: [],
      pricingNote: triOpt(C.pricing && C.pricing.note),
      isFeatured: Boolean(c.featured),
      order: i,
    });
  });

  // Assign 1 teacher per course-branch as a scheduled group (the timetable).
  const groups = [];
  courses.forEach((course, ci) => {
    const branchList = COURSES[ci].onlyMain ? [branches[0]] : branches;
    branchList.forEach((branch, bi) => {
      const teacher = teachers[(ci + bi) % teachers.length];
      groups.push(
        new CourseGroup({
          course: course._id, branch: branch._id, teacher: teacher._id,
          level: "B1", format: "group",
          schedule: [
            { weekday: 1, from: "19:00", to: "20:30" },
            { weekday: 3, from: "19:00", to: "20:30" },
          ],
          capacity: 6, enrolled: 3, status: "open",
        }),
      );
    });
  });

  // ── Müəllim təyinatları: filial → dərs ──
  // Kurslar və filiallar hazır olduqdan sonra qurulur. Dərs SAATI yazılmır —
  // müəllim səhifəsi vaxt cədvəli saxlamır; qrafik CourseGroup-dadır.
  {
    const normKey = (v) =>
      String(v || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/ı/g, "i")
        .replace(/ə/g, "e")
        .trim();

    const courseBySlug = new Map(courses.map((c) => [c.slug, c]));
    const findBranch = (key) => {
      const kw = BRANCH_KEYWORDS[key];
      return kw ? branches.find((b) => normKey(b.name).includes(kw)) : null;
    };

    for (const t of teachers) {
      const rows = teacherRowsByName.get(t.fullName) || [];
      const assignments = [];

      for (const row of rows) {
        const branch = findBranch(row.branch);
        if (!branch) continue;

        const courseIds = [];
        for (const label of row.courses) {
          const slug = COURSE_ALIASES[label.toLowerCase()];
          // Bazada qarşılığı olmayan adlar (Cambridge English, Aptis) ötürülür.
          if (!slug || slug.startsWith("__UNMAPPED")) continue;
          const c = courseBySlug.get(slug);
          // Pre-IELTS və IELTS eyni kursa düşür — təkrar əlavə etmirik.
          if (c && !courseIds.some((id) => String(id) === String(c._id))) courseIds.push(c._id);
        }
        assignments.push({ branch: branch._id, courses: courseIds });
      }

      t.assignments = assignments;
      t.branches = [...new Set(assignments.map((a) => String(a.branch)))];
      t.courses = [...new Set(assignments.flatMap((a) => a.courses.map(String)))];
    }
  }

  const destinations = DESTINATIONS.map((d, i) =>
    new Destination({
      ...d,
      country: tri(d.country),
      region: tri(d.region),
      tagline: tri(d.tagline),
      slug: SlugService.slugify(d.country),
      order: i,
      isFeatured: i < 8,
    }),
  );
  const testimonials = TESTIMONIALS.map((t, i) =>
    // Ad tərcümə olunmur (şəxs adıdır); rəy mətni və nailiyyət olunur.
    new Testimonial({ ...t, quote: triOpt(t.quote), achievement: triOpt(t.achievement), order: i }),
  );
  const advantages = ADVANTAGES.map((a, i) =>
    new Advantage({ ...a, title: tri(a.title), text: tri(a.text), order: i }),
  );
  const partners = PARTNERS.map((p) => new Partner(p));
  // Valideyn və uşaq bəndləri BİR massivdə qaytarılır — `parent` sahəsi
  // əlaqəni qurur. `new MenuItem()` _id-ni dərhal verir, ona görə iki
  // mərhələli yazmaq lazım gəlmir.
  const menu = [];
  HEADER_MENU.forEach((m, i) => {
    const { children, ...rest } = m;
    const parent = new MenuItem({ ...rest, label: tri(m.label), location: "header", order: i });
    menu.push(parent);
    (children || []).forEach((c, ci) => {
      menu.push(
        new MenuItem({ ...c, label: tri(c.label), location: "header", parent: parent._id, order: ci }),
      );
    });
  });

  // Sayt üzrə FAQ — ana səhifədəki bölmə. Əvvəl seed-də ümumiyyətlə yox idi,
  // ona görə /api/faqs boş qayıdırdı və bölmə sabit mətnlərə düşürdü.
  const faqs = FAQS.map((f, i) => new Faq({ ...f, order: i }));

  // Səviyyə testləri — köhnə saytın ən çox girilən iki səhifəsi
  // (/english-test, /rus-dili-test) bunlara yönləndirilir.
  const quizzes = QUIZZES.map(
    (z) =>
      new Quiz({
        ...z,
        questions: z.questions.map((qq, qi) => ({ ...qq, order: qi, isActive: true })),
      }),
  );

  const pages = [
    new Page({ title: tri("Haqqımızda"), slug: "haqqimizda", isSystem: true, h1: tri("2014-cü ildən dünya dillərini Azərbaycana öyrədirik"), lead: tri("British Academy — “English UK” akkreditasiyasından keçmiş yeganə Azərbaycan şirkəti və rəsmi TOEFL beynəlxalq imtahan mərkəzidir."), order: 0 }),
    new Page({ title: tri("Əlaqə"), slug: "elaqe", isSystem: true, h1: tri("Əlaqə"), lead: tri("Sualların var? Bizimlə əlaqə saxla — komandamız kömək etməyə hazırdır."), order: 1 }),
  ];

  return { site, branches, categories, teachers, courses, groups, destinations, testimonials, advantages, partners, menu, pages, faqs, quizzes };
}

// ── Validation ──
/** Runs validateSync on every doc; returns { ok, errors: [{key, name, path, message}] }. */
export function validateGraph(graph) {
  const errors = [];
  let total = 0;
  for (const [key, value] of Object.entries(graph)) {
    const docs = Array.isArray(value) ? value : [value];
    for (const doc of docs) {
      total += 1;
      const err = doc.validateSync();
      if (err) {
        const name = doc.name || doc.title || doc.fullName || doc.label || doc.country || doc.key;
        for (const e of Object.values(err.errors)) errors.push({ key, name, path: e.path, message: e.message });
      }
    }
  }

  // ── Unikal sahələrin təkrarı ──
  //
  // validateSync YALNIZ bir sənədə baxır — sənədlər arası təkrarı görmür.
  // Təkrar yalnız MongoDB insertMany zamanı üzə çıxırdı və istifadəçi
  // mənasız «409 Conflict» alırdı: hansı model, hansı sahə, hansı dəyər —
  // heç biri məlum olmurdu. İndi seed heç nə silmədən əvvəl dayanır.
  for (const [key, value] of Object.entries(graph)) {
    if (!Array.isArray(value) || !value.length) continue;
    const schema = value[0].schema;
    if (!schema) continue;
    const uniques = Object.entries(schema.paths)
      .filter(([, path]) => path.options?.unique)
      .map(([name]) => name);
    for (const field of uniques) {
      const seen = new Map();
      for (const doc of value) {
        const v = doc[field];
        if (v == null) continue;
        const id = typeof v === "object" ? JSON.stringify(v) : String(v);
        seen.set(id, (seen.get(id) || 0) + 1);
      }
      for (const [v, n] of seen) {
        if (n > 1) {
          errors.push({ key, name: v, path: field, message: `«${field}» dəyəri ${n} sənəddə təkrarlanır: ${v}` });
        }
      }
    }
  }

  return { ok: errors.length === 0, total, errors };
}

// ── Wipe + insert ──
async function insert(graph) {
  await SiteSetting.deleteMany({});
  await Promise.all([
    Branch.deleteMany({}), Teacher.deleteMany({}), CourseCategory.deleteMany({}),
    Course.deleteMany({}), CourseGroup.deleteMany({}), Testimonial.deleteMany({}),
    Destination.deleteMany({}), MenuItem.deleteMany({}), Partner.deleteMany({}),
    Advantage.deleteMany({}), Page.deleteMany({}), Faq.deleteMany({}), Quiz.deleteMany({}),
  ]);
  await graph.site.save();
  await Branch.insertMany(graph.branches);
  await CourseCategory.insertMany(graph.categories);
  await Teacher.insertMany(graph.teachers);
  await Course.insertMany(graph.courses);
  await CourseGroup.insertMany(graph.groups);
  await Destination.insertMany(graph.destinations);
  await Testimonial.insertMany(graph.testimonials);
  await Advantage.insertMany(graph.advantages);
  await Partner.insertMany(graph.partners);
  await MenuItem.insertMany(graph.menu);
  await Page.insertMany(graph.pages);
  await Faq.insertMany(graph.faqs);
  await Quiz.insertMany(graph.quizzes);

  return {
    Branch: graph.branches.length, Category: graph.categories.length, Teacher: graph.teachers.length,
    Course: graph.courses.length, CourseGroup: graph.groups.length, Destination: graph.destinations.length,
    Testimonial: graph.testimonials.length, Advantage: graph.advantages.length, Partner: graph.partners.length,
    Menu: graph.menu.length, Page: graph.pages.length, Faq: graph.faqs.length, Quiz: graph.quizzes.length,
  };
}

/**
 * Build → validate → wipe → insert. Assumes an active Mongo connection.
 * Throws if validation fails (nothing is deleted in that case).
 * @returns {Promise<{counts: object}>}
 */
export async function seedDatabase() {
  const graph = buildGraph();
  const { ok, errors } = validateGraph(graph);
  if (!ok) {
    const err = new Error("Seed validasiyası uğursuz oldu");
    err.details = errors;
    throw err;
  }
  const counts = await insert(graph);
  return { counts };
}
