/**
 * Tərcümə əhatəsi hesabatı — bazaya QOŞULMADAN işləyir.
 *
 * Seed qrafikini qurub `LOCALIZED_FIELDS` registrindəki hər sahəni yoxlayır:
 *   • adi sətir            → yalnız AZ (i18nPlugin onu {az, en:"", ru:""} edir)
 *   • { az, en, ru } + boş en → tərcüməsiz
 *   • en dolu və az-dan fərqli → tərcümə olunub
 *
 * NİYƏ REGİSTRDƏN OXUYUR: ilk yazdığım audit yalnız artıq { az, en, ru }
 * formasında olan sahələri sayırdı və 33% göstərirdi. Halbuki h1, lead,
 * content, faq, info seed qrafikində ADİ SƏTİRDİR — çevrilmə yalnız bazaya
 * yazılanda baş verir. Registr üzərindən gedəndə əsl rəqəm 19% çıxdı.
 *
 * İstifadə:
 *   node scripts/i18nAudit.js              — model üzrə xülasə
 *   node scripts/i18nAudit.js --missing    — tərcüməsiz sahələr, say üzrə
 *   node scripts/i18nAudit.js --course <slug>  — bir kursun tərcüməsiz mətnləri
 */

const MODEL_OF = {
  courses: "Course",
  categories: "CourseCategory",
  destinations: "Destination",
  branches: "Branch",
  advantages: "Advantage",
  faqs: "Faq",
  menu: "MenuItem",
  quizzes: "Quiz",
  teachers: "Teacher",
  testimonials: "Testimonial",
  pages: "Page",
};

/**
 * TƏRCÜMƏ OLUNMAMALI sahələr — hesabatdan tamamilə çıxarılır.
 *
 * Test sualları və variantları imtahanın ÖZ MATERİALIDIR. «___ name is Ali»
 * sualının «My / I / Me / Mine» variantlarını azərbaycancaya çevirmək testi
 * mənasız edər — məqsəd elə düzgün ingilis sözünü seçməkdir. Rus dili testi
 * də eyni səbəbdən rus dilindədir.
 *
 * Bunları metrikada saxlamaq həmişəlik "63%" kimi yalan mənzərə yaradırdı.
 * `explanation` isə istisnadır: onu istifadəçi öz dilində oxuyur, ona görə
 * siyahıda deyil və tərcümə oluna bilər.
 */
const NEVER_TRANSLATE = new Set([
  "Quiz:questions.$.text",
  "Quiz:questions.$.options.$.text",
]);

/** "content.$.heading" yolunu sənəddə gəzib bütün dəyərləri toplayır. */
function collect(doc, parts) {
  let cur = [doc];
  for (const p of parts) {
    const next = [];
    for (const node of cur) {
      if (node == null) continue;
      if (p === "$") {
        if (Array.isArray(node)) next.push(...node);
      } else next.push(node[p]);
    }
    cur = next;
  }
  return cur.filter((v) => v != null);
}

/**
 * Sahə "həll olunub" sayılırmı?
 *
 * Sadəcə `en !== az` yoxlaması YANLIŞ nəticə verir: «Conversation Club»,
 * «IELTS & Pre-SAT», «10 AZN», «Caspian Plaza» hər üç dildə EYNİ olmalıdır və
 * onları tərcüməsiz saymaq hesabatı gerçəkdən pis göstərir.
 *
 * Ona görə üç meyar var:
 *   1) lüğətdə açıq qeyd var  → qərar verilib (eyni qalması da qərardır)
 *   2) en az-dan fərqlidir    → tərcümə olunub
 *   3) ru az-dan fərqlidir    → tərcümə olunub (məs. Yasamal → Ясамал)
 */
function isHandled(az, en, ru, dict) {
  if (dict && Object.prototype.hasOwnProperty.call(dict, az)) return true;
  if (String(en || "").trim() && en !== az) return true;
  if (String(ru || "").trim() && ru !== az) return true;
  // Siyahı sahəsi (content.$.items) — hər dil üçün sətir-sətir mətndir.
  // Bütövlükdə lüğətdə olmur, amma hər sətri ayrıca tərcümə olunur.
  if (az.includes("\n")) {
    const lines = az.split("\n").map((s) => s.trim()).filter(Boolean);
    if (lines.length > 1 && lines.every((s) => dict && Object.prototype.hasOwnProperty.call(dict, s))) {
      return true;
    }
  }
  return false;
}

async function main() {
  const { buildGraph } = await import("../services/SeedService.js");
  const { LOCALIZED_FIELDS } = await import("../utils/i18n.js");
  const { T } = await import("../data/translations.mjs");

  const argv = process.argv.slice(2);

  // Bir kursun tərcüməsiz mətnlərini çap et — lüğətə əlavə etmək üçün.
  if (argv[0] === "--course") {
    const slug = argv[1];
    const { COURSE_CONTENT } = await import("../data/courseContent.mjs");
    const { T } = await import("../data/translations.mjs");
    const C = COURSE_CONTENT[`${slug}.html`];
    if (!C) {
      console.log(`Kurs məzmunu tapılmadı: ${slug}`);
      process.exit(1);
    }
    const out = [];
    const add = (s) => {
      if (s && typeof s === "string" && s.trim() && !T[s]) out.push(s);
    };
    add(C.h1);
    add(C.lead);
    (C.info || []).forEach(([a, b]) => (add(a), add(b)));
    (C.intro || []).forEach(add);
    (C.sections || []).forEach((s) => {
      add(s.t);
      if (s.p?.length) add(s.p.join("\n\n"));
      (s.ul || []).forEach(add);
      (s.dl || []).forEach(([a, b]) => (add(a), add(b)));
      add(s.highlight);
      add(s.note);
    });
    (C.faq || []).forEach(([a, b]) => (add(a), add(b)));
    add(C.pricing?.note);
    console.log(`${slug}: ${out.length} tərcüməsiz mətn\n`);
    out.forEach((s, i) => console.log(`[${i + 1}] ${s}\n`));
    return;
  }

  const g = buildGraph();
  const rows = [];
  let total = 0;
  let done = 0;
  const missing = [];

  for (const [key, val] of Object.entries(g)) {
    const fields = LOCALIZED_FIELDS[MODEL_OF[key]];
    if (!fields) continue;
    const docs = (Array.isArray(val) ? val : [val]).map((d) =>
      d?.toObject ? d.toObject() : d,
    );
    let az = 0;
    let tr = 0;
    const worst = new Map();
    for (const d of docs) {
      for (const f of fields) {
        if (NEVER_TRANSLATE.has(`${MODEL_OF[key]}:${f}`)) continue;
        for (const v of collect(d, f.split("."))) {
          if (typeof v === "string") {
            // Adi sətir — i18nPlugin onu { az, en:"", ru:"" } edəcək, yəni
            // yalnız lüğətdə qeyd varsa tərcümə olunacaq.
            if (!v.trim()) continue;
            if (isHandled(v, "", "", T)) tr++;
            else {
              az++;
              worst.set(f, (worst.get(f) || 0) + 1);
            }
          } else if (v && typeof v === "object" && "az" in v) {
            const a = String(v.az || "").trim();
            if (!a) continue;
            if (isHandled(a, v.en, v.ru, T)) tr++;
            else {
              az++;
              worst.set(f, (worst.get(f) || 0) + 1);
            }
          }
        }
      }
    }
    if (az + tr === 0) continue;
    rows.push([key, az + tr, tr]);
    total += az + tr;
    done += tr;
    for (const [f, n] of worst) missing.push([`${key} · ${f}`, n]);
  }

  rows.sort((a, b) => b[1] - b[2] - (a[1] - a[2]));
  console.log("MODEL".padEnd(15) + "SAHƏ".padStart(6) + "TƏRC.".padStart(7) + "ƏHATƏ".padStart(8));
  for (const [k, tot, tr] of rows) {
    console.log(
      k.padEnd(15) +
        String(tot).padStart(6) +
        String(tr).padStart(7) +
        `${Math.round((tr / tot) * 100)}%`.padStart(8),
    );
  }
  console.log("-".repeat(36));
  console.log(
    "CƏMİ".padEnd(15) +
      String(total).padStart(6) +
      String(done).padStart(7) +
      `${Math.round((done / total) * 100)}%`.padStart(8),
  );

  if (argv.includes("--missing")) {
    console.log("\nTƏRCÜMƏSİZ SAHƏLƏR:");
    missing
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .forEach(([k, n]) => console.log(`  ${String(n).padStart(4)}  ${k}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
