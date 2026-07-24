/**
 * Seed — migrate the existing static-site content into MongoDB.
 *
 * Source of truth for the long course copy is the legacy generator's data file
 * (tools/content.mjs at the repo root); branches, teachers, testimonials, menu and
 * homepage blocks are declared inline here (small, and already known from the
 * static build).
 *
 * Usage:
 *   node scripts/seed.js          # wipe BA collections and reseed
 *   node scripts/seed.js --dry    # build + validate every doc, no DB needed
 */
import { mongoDBService } from "#services";
import {
  SiteSetting,
  Branch,
  Teacher,
  CourseCategory,
  Course,
  CourseGroup,
  Testimonial,
  Destination,
  MenuItem,
  Partner,
  Advantage,
  Page,
} from "#models";
import { SlugService } from "#services/SlugService.js";

// Legacy content data (safe: only exports COURSE_CONTENT).
import { COURSE_CONTENT } from "../../../tools/content.mjs";

const DRY = process.argv.includes("--dry");

/* ============================================================
   Inline source data (from the static build)
   ============================================================ */
const BRANCHES = [
  { name: "Mərkəz — Caspian Plaza", address: "C.Cabbarlı 44, Caspian Plaza", district: "Nəsimi", metro: "Nizami m.", phone: "(+994) 55 212 41 51", whatsapp: "994552124151", isMain: true, workingHours: [{ days: "B.e–Şənbə", from: "09:00", to: "21:00" }] },
  { name: "Nərimanov filialı", address: "Nərimanov r., Atatürk pr. 25", district: "Nərimanov", metro: "Nərimanov m.", phone: "(+994) 55 212 41 52", whatsapp: "994552124152", workingHours: [{ days: "B.e–Şənbə", from: "09:00", to: "21:00" }] },
  { name: "Əhmədli filialı", address: "Əhmədli, Babək pr. 88", district: "Xətai", metro: "Həzi Aslanov m.", phone: "(+994) 55 212 41 53", whatsapp: "994552124153", workingHours: [{ days: "B.e–Şənbə", from: "09:00", to: "20:00" }] },
  { name: "Elmlər Akademiyası filialı", address: "Elmlər Akademiyası, H.Cavid pr. 31", district: "Yasamal", metro: "Elmlər Akademiyası m.", phone: "(+994) 55 212 41 54", whatsapp: "994552124154", workingHours: [{ days: "B.e–Şənbə", from: "10:00", to: "20:00" }] },
];

const TEACHERS = [
  { fullName: "Aygün Əliyeva", title: "IELTS 8.5 · İngilis dili", color: "#2E6BE6", isFeatured: true, stats: [{ label: "Təcrübə", value: "9 il" }, { label: "IELTS", value: "8.5" }] },
  { fullName: "Günel Sadıqova", title: "İngilis dili · Uşaq proqramları", color: "#12B5A5" },
  { fullName: "Rəşad Məmmədov", title: "Biznes İngilis · Danışıq", color: "#7C4DFF" },
  { fullName: "Kamran İsmayılov", title: "IELTS · TOEFL hazırlıq", color: "#E0533D" },
  { fullName: "Nigar Hüseynova", title: "Rus dili · Danışıq klubu", color: "#F5A524" },
  { fullName: "Elvin Quliyev", title: "Kompüter · Ofis proqramları", color: "#0EA5E9" },
  { fullName: "Leyla Rəhimova", title: "Alman dili · Sertifikat", color: "#FF3D8B" },
  { fullName: "Tural Əhmədov", title: "SAT · İmtahan hazırlığı", color: "#22B07D" },
];

// category key -> { name, base price (AZN/month group day) or special }
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

// slug is explicit to preserve legacy URLs and match COURSE_CONTENT keys.
const COURSES = [
  { slug: "ingilis-dili-kursu", title: "İngilis dili kursu", cat: "dil-kurslari", base: 100, featured: true },
  { slug: "biznes-ingilis-dili-kursu", title: "Biznes İngilis dili kursu", cat: "dil-kurslari", base: 170, featured: true },
  { slug: "huquqsunaslar-ingilis-dili-kursu", title: "Hüquqşünaslar üçün İngilis dili", cat: "dil-kurslari", base: 180 },
  { slug: "otel-turizm-ingilis-dili-kursu", title: "Otel və Turizm üçün İngilis dili", cat: "dil-kurslari", base: 150 },
  { slug: "alman-dili-kursu", title: "Alman dili kursu", cat: "dil-kurslari", base: 110, onlyMain: true },
  { slug: "beynelxalq-sertifikatli-alman-dili-kursu", title: "Beynəlxalq Sertifikatlı Alman dili", cat: "dil-kurslari", base: 160 },
  { slug: "rus-dili-kursu", title: "Rus dili kursu", cat: "dil-kurslari", base: 80, featured: true },
  { slug: "ispan-dili-kursu", title: "İspan dili kursu", cat: "dil-kurslari", base: 110 },
  { slug: "italyan-dili-kursu", title: "İtalyan dili kursu", cat: "dil-kurslari", base: 110 },
  { slug: "fransiz-dili-kursu", title: "Fransız dili kursu", cat: "dil-kurslari", base: 110 },
  { slug: "conversation-club", title: "Conversation Club", cat: "danisiq", custom: [["Bir dəfə iştirak", "10 AZN"], ["Aylıq iştirak", "80 AZN"], ["British Academy tələbələri", "Ödənişsiz"]] },
  { slug: "workshop", title: "Workshop", cat: "danisiq", base: 70 },
  { slug: "ielts", title: "IELTS & Pre-IELTS", cat: "imtahanlar", base: 180, featured: true },
  { slug: "toefl", title: "TOEFL & Pre-TOEFL", cat: "imtahanlar", base: 180 },
  { slug: "oet", title: "OET (Tibb işçiləri üçün)", cat: "imtahanlar", base: 200 },
  { slug: "toeic", title: "TOEIC (Rəsmi imtahan)", cat: "imtahanlar", base: 170 },
  { slug: "sat", title: "SAT & Pre-SAT", cat: "imtahanlar", base: 190 },
  { slug: "duolingo", title: "Duolingo", cat: "imtahanlar", base: 150 },
  { slug: "toles", title: "TOLES", cat: "imtahanlar", base: 200 },
  { slug: "tefl-kurslari", title: "TEFL Kursları", cat: "sertifikat", base: 220 },
  { slug: "ms-office", title: "MS Office proqramları", cat: "komputer", base: 80, featured: true },
  { slug: "pesekar-excel-kursu", title: "Peşəkar Excel kursu", cat: "komputer", base: 90 },
  { slug: "muhasibatliq-1c-kursu", title: "Mühasibatlıq və 1C kursu", cat: "karyera", base: 150 },
  { slug: "hr-karguzarliq-kursu", title: "HR & Kargüzarlıq kursu", cat: "karyera", base: 140 },
  { slug: "usaq-ingilis-dili", title: "Uşaqlar üçün İngilis dili", cat: "usaq", base: 90, featured: true },
  { slug: "usaq-rus-dili", title: "Uşaqlar üçün Rus dili", cat: "usaq", base: 90 },
  { slug: "usaq-mentiq", title: "Uşaqlar üçün Məntiq", cat: "usaq", base: 85 },
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
  { country: "Taqaüd Proqramları", region: "Proqram", color: "#7C4DFF", tagline: "Tam & qismən təqaüd", isScholarship: true },
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

const HEADER_MENU = [
  { label: "Haqqımızda", href: "/haqqimizda", type: "link" },
  { label: "Xidmətlər", href: "/kurslar/xidmetler", type: "mega" },
  { label: "Xaricdə təhsil", href: "/xaricde-tehsil", type: "dropdown" },
  { label: "Filiallar", href: "/filiallar", type: "link" },
  { label: "Müəllimlər", href: "/muellimler", type: "link" },
  { label: "Tələbələrimiz", href: "/telebelerimiz", type: "link" },
  { label: "Əlaqə", href: "/elaqe", type: "link" },
];

/* ============================================================
   Converters
   ============================================================ */
const BRANCH_DELTA = [0, 10, -5, 5];

// Build the group/individual × day/evening matrix for a course at a branch.
function priceRow(base, branchIndex, branchId) {
  const groupDay = base + (BRANCH_DELTA[branchIndex] || 0);
  const soloDay = Math.round((groupDay * 2.2) / 5) * 5;
  return {
    branch: branchId,
    group: { day: groupDay, evening: groupDay + 10 },
    individual: { day: soloDay, evening: soloDay + 20 },
  };
}

// COURSE_CONTENT[slug].sections -> Course.content blocks
function toContentBlocks(C) {
  const blocks = [];
  (C.intro || []).forEach((body) => blocks.push({ type: "paragraph", body }));
  (C.sections || []).forEach((s) => {
    const base = { heading: s.t, headingLevel: s.h === 3 ? 3 : 2 };
    if (s.p && s.p.length) blocks.push({ ...base, type: "paragraph", body: s.p.join("\n\n") });
    else blocks.push({ ...base, type: "paragraph", body: "" });
    if (s.ul) blocks.push({ type: "list", items: s.ul });
    if (s.dl) blocks.push({ type: "definitions", definitions: s.dl.map(([term, description]) => ({ term, description })) });
    if (s.highlight) blocks.push({ type: "highlight", body: s.highlight });
    if (s.note) blocks.push({ type: "note", body: s.note });
  });
  return blocks;
}

function toInfo(C) {
  return (C.info || []).map(([label, value]) => ({ label, value }));
}
function toFaq(C) {
  return (C.faq || []).map(([question, answer]) => ({ question, answer }));
}

/* ============================================================
   Build the full document graph (pure — no DB)
   ============================================================ */
function buildGraph() {
  const site = new SiteSetting({
    key: "site",
    brand: {
      name: "British Academy",
      logo: "/assets/logo.png",
      logoStack: "/assets/logo-stack.png",
      shield: "/assets/shield.png",
      badge: "/assets/badge11.png",
      favicon: "/assets/favicon.png",
      ogImage: "/assets/og-cover.png",
      themeColor: "#00157A",
    },
    contact: {
      phone: "(+994) 55 212 41 51",
      phone2: "(+994 12) 497 62 97",
      email: "office@britishacademy.az",
      address: "C.Cabbarlı 44, Caspian Plaza",
      hours: "Həftə içi 09:00–21:00 · Şənbə 10:00–16:00",
    },
    socials: {
      instagram: "https://instagram.com/britishacademy.az",
      facebook: "https://facebook.com/britishacademy.az",
      youtube: "https://youtube.com/@britishacademy",
      whatsapp: "https://wa.me/994552124151",
    },
    hero: {
      titlePrefix: "British Academy ilə",
      words: ["ingiliscə danış", "IELTS 7+ al", "rus dili öyrən", "almanca danış", "xaricdə oxu"],
      colors: ["#001478", "#0B2A9C", "#C8102E", "#00105E", "#1438B8"],
      subtitle: "Böyük Britaniyada hazırlanmış xüsusi metodika ilə dilləri 4 dəfə sürətli öyrən.",
    },
    stats: [
      { label: "məzun tələbə", value: "20 000+" },
      { label: "korporativ tərəfdaş", value: "30+" },
      { label: "filial · Bakı", value: "4" },
    ],
    marquee: ["İNGİLİS DİLİ", "IELTS 7+", "DANIŞIQ KLUBU", "XARİCDƏ TƏHSİL", "RUS DİLİ", "ALMAN DİLİ", "BİZNES İNGİLİS"],
    seo: {
      titleTemplate: "%s — British Academy",
      defaultDescription: "British Academy — English UK akkreditasiyalı dil mərkəzi. İngilis, rus, alman dili kursları, IELTS · TOEFL hazırlığı və xaricdə təhsil.",
      defaultOgImage: "/assets/og-cover.png",
    },
    robotsTxt: "User-agent: *\nAllow: /\n\nSitemap: https://britishacademy.az/sitemap.xml\n",
  });

  const branches = BRANCHES.map((b, i) => new Branch({ ...b, slug: SlugService.slugify(b.name), order: i }));

  const catByKey = {};
  const categories = CATEGORIES.map((c) => {
    const doc = new CourseCategory({ name: c.name, slug: c.key, icon: c.icon, order: c.order });
    catByKey[c.key] = doc;
    return doc;
  });
  // resolve parent refs
  CATEGORIES.forEach((c, i) => { if (c.parent) categories[i].parent = catByKey[c.parent]._id; });

  const teachers = TEACHERS.map((t, i) =>
    new Teacher({
      ...t,
      slug: SlugService.slugify(t.fullName),
      branches: [branches[i % branches.length]._id, branches[(i + 1) % branches.length]._id],
      order: i,
    }),
  );

  const courseBySlug = {};
  const courses = COURSES.map((c, i) => {
    const C = COURSE_CONTENT[`${c.slug}.html`] || {};
    const branchList = c.onlyMain ? [branches[0]] : branches;
    const doc = new Course({
      title: c.title,
      slug: c.slug,
      category: catByKey[c.cat]._id,
      h1: C.h1,
      lead: C.lead,
      excerpt: C.lead,
      content: toContentBlocks(C),
      faq: toFaq(C),
      info: toInfo(C),
      levels: ["A1", "A2", "B1", "B2", "C1", "C2"],
      pricingMode: c.custom ? "custom" : "branch",
      pricing: c.custom ? [] : branchList.map((b, bi) => priceRow(c.base, c.onlyMain ? 0 : bi, b._id)),
      customPricing: (c.custom || []).map(([label, value]) => ({ label, value })),
      pricingNote: (C.pricing && C.pricing.note) || undefined,
      isFeatured: Boolean(c.featured),
      order: i,
    });
    courseBySlug[c.slug] = doc;
    return doc;
  });

  // Assign 2 teachers per course-branch as scheduled groups (the timetable).
  const groups = [];
  courses.forEach((course, ci) => {
    const branchList = COURSES[ci].onlyMain ? [branches[0]] : branches;
    branchList.forEach((branch, bi) => {
      const teacher = teachers[(ci + bi) % teachers.length];
      groups.push(
        new CourseGroup({
          course: course._id,
          branch: branch._id,
          teacher: teacher._id,
          level: "B1",
          format: "group",
          schedule: [
            { weekday: 1, from: "19:00", to: "20:30" },
            { weekday: 3, from: "19:00", to: "20:30" },
          ],
          capacity: 6,
          enrolled: 3,
          status: "open",
        }),
      );
    });
  });

  const destinations = DESTINATIONS.map((d, i) => new Destination({ ...d, slug: SlugService.slugify(d.country), order: i, isFeatured: i < 8 }));
  const testimonials = TESTIMONIALS.map((t, i) => new Testimonial({ ...t, order: i }));
  const advantages = ADVANTAGES.map((a, i) => new Advantage({ ...a, order: i }));
  const partners = PARTNERS.map((p) => new Partner(p));
  const menu = HEADER_MENU.map((m, i) => new MenuItem({ ...m, location: "header", order: i }));

  const pages = [
    new Page({ title: "Haqqımızda", slug: "haqqimizda", isSystem: true, h1: "2014-cü ildən dünya dillərini Azərbaycana öyrədirik", lead: "British Academy — “English UK” akkreditasiyasından keçmiş yeganə Azərbaycan şirkəti və rəsmi TOEFL beynəlxalq imtahan mərkəzidir.", order: 0 }),
    new Page({ title: "Əlaqə", slug: "elaqe", isSystem: true, h1: "Əlaqə", lead: "Sualların var? Bizimlə əlaqə saxla — komandamız kömək etməyə hazırdır.", order: 1 }),
  ];

  return { site, branches, categories, teachers, courses, groups, destinations, testimonials, advantages, partners, menu, pages };
}

/* ============================================================
   Dry validation vs. real insert
   ============================================================ */
function validate(graph) {
  let errors = 0;
  let total = 0;
  for (const [key, value] of Object.entries(graph)) {
    const docs = Array.isArray(value) ? value : [value];
    for (const doc of docs) {
      total += 1;
      const err = doc.validateSync();
      if (err) {
        errors += 1;
        console.error(`✗ ${key} "${doc.name || doc.title || doc.fullName || doc.label || doc.country || doc.key}":`);
        for (const e of Object.values(err.errors)) console.error(`    - ${e.path}: ${e.message}`);
      }
    }
  }
  console.log(`\n${errors ? "✗" : "✓"} ${total - errors}/${total} sənəd validasiyadan keçdi`);
  return errors === 0;
}

async function insert(graph) {
  await SiteSetting.deleteMany({});
  await Promise.all([
    Branch.deleteMany({}), Teacher.deleteMany({}), CourseCategory.deleteMany({}),
    Course.deleteMany({}), CourseGroup.deleteMany({}), Testimonial.deleteMany({}),
    Destination.deleteMany({}), MenuItem.deleteMany({}), Partner.deleteMany({}),
    Advantage.deleteMany({}), Page.deleteMany({}),
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

  const counts = {
    Branch: graph.branches.length, Category: graph.categories.length, Teacher: graph.teachers.length,
    Course: graph.courses.length, CourseGroup: graph.groups.length, Destination: graph.destinations.length,
    Testimonial: graph.testimonials.length, Advantage: graph.advantages.length, Partner: graph.partners.length,
    Menu: graph.menu.length, Page: graph.pages.length,
  };
  console.log("\n✓ Seed tamamlandı:");
  for (const [k, v] of Object.entries(counts)) console.log(`   ${k.padEnd(12)} ${v}`);
}

async function run() {
  console.log(DRY ? "🧪 Dry seed (yalnız validasiya)\n" : "🌱 Seed başladı\n");
  const graph = buildGraph();

  if (DRY) {
    const okAll = validate(graph);
    process.exit(okAll ? 0 : 1);
  }

  await mongoDBService.connect();
  console.log("✅ MongoDB-yə qoşuldu");
  if (!validate(graph)) { console.error("Validasiya uğursuz — seed dayandırıldı."); process.exit(1); }
  await insert(graph);
  await mongoDBService.disconnect?.();
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed xətası:", err);
  process.exit(1);
});
