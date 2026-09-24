// Components
import { LocaleLink as Link, FaqAccordion, CtaBand } from "@/components";
import { PageBanner } from "@/components/server";

// Lib
import { ldJson } from "@/lib";
import { apiGet, buildMetadata, getT, getLocale, absUrl } from "@/lib/server";

/**
 * /kurslar/qiymetler — bütün kursların qiymət cədvəli.
 *
 * ── NİYƏ AYRICA SƏHİFƏ ──
 * Köhnə saytda `/ingilis-dili-kurslari-qiymetleri` (ayda 575 giriş) və
 * `/ielts-kurslari-qiymetleri` (537) ayrıca səhifələr idi. Yeni saytda
 * ikisi də kurs səhifəsinə yönləndirilirdi — «qiymət» niyyəti ilə gələn
 * ziyarətçi uzun kurs mətninin ortasında qiymət axtarmalı olurdu. Bu bazarda
 * qiymət müqayisəsi qərarın mərkəzindədir; ayrıca səhifə həmin sorğunu
 * birbaşa cavablandırır.
 *
 * ── MƏLUMAT ──
 * Qiymətlər ƏL İLƏ YAZILMIR — `/courses` cavabındakı filial matrisindən
 * (`pricing[].group|individual.day|evening`) hesablanır. Admin paneldə qiymət
 * dəyişəndə bu səhifə də avtomatik yenilənir. Filiallar arasında fərq varsa
 * aralıq göstərilir (məs. «109–119 AZN»).
 *
 * `/kurslar/[slug]` dinamik marşrutundan əvvəl gəlir: statik seqment Next-də
 * üstünlük təşkil edir, yəni «qiymetler» kurs slug-ı kimi axtarılmır.
 */

// ── Mətnlər ──
// Səhifəyə məxsus mətnlər burada saxlanılır: ümumi `strings.js`-ə onlarla
// açar əlavə etmək əvəzinə bir yerdə, üç dil yan-yana — tərcümə yoxlanışı asan
// olsun. Faktlar kurs səhifələrindəki mövcud mətnlərdən götürülüb.
const COPY = {
  az: {
    title: "Kurs qiymətləri",
    sub: "Bütün kursların aylıq qiymətləri — qrup və fərdi, gündüz və axşam.",
    metaTitle: "Kurs qiymətləri 2026 — ingilis dili, IELTS və digər kurslar",
    metaDesc:
      "İngilis dili, IELTS, TOEFL, rus, alman və kompüter kurslarının aylıq qiymətləri — qrup və fərdi dərslər, gündüz və axşam. Filiallar üzrə aktual qiymətlər.",
    course: "Kurs",
    group: "Qrup",
    individual: "Fərdi",
    day: "gündüz",
    evening: "axşam",
    perMonth: "Aylıq qiymət, AZN",
    onRequest: "Qiymət üçün əlaqə",
    view: "Kursa bax",
    note:
      "Qiymətlər filiala görə fərqlənə bilər — aralıq göstərilən yerlərdə ən aşağı və ən yüksək filial qiyməti verilib. Filial üzrə dəqiq qiymət kursun öz səhifəsindədir.",
    faqTitle: "Qiymətlərlə bağlı suallar",
    faq: [
      ["Qiymətə nə daxildir?", "Əsas dərslər və kurs proqramının onlayn PDF materialları. Fiziki dərslik kitabları ayrıca ödənilir."],
      ["Axşam qrupları niyə baha olur?", "Axşam saatlarına tələb daha yüksəkdir. Axşam qrupları qrup dərsi üçün təxminən +10 AZN, fərdi dərs üçün +20 AZN fərqlə hesablanır; dəqiq məbləğ cədvəldədir."],
      ["Qrup və fərdi dərs arasında fərq nədir?", "Qrup dərsləri kiçik tərkibdə keçirilir və daha sərfəlidir. Fərdi dərsdə proqram və temp tamamilə sizə uyğunlaşdırılır."],
      ["Qeydiyyatdan əvvəl sınaq dərsi varmı?", "Bəli, ödənişsiz sınaq dərsinə yazıla bilərsiniz. Səviyyənizi əvvəlcədən onlayn testlə də yoxlaya bilərsiniz."],
    ],
  },
  en: {
    title: "Course prices",
    sub: "Monthly prices for every course — group and one-to-one, daytime and evening.",
    metaTitle: "Course prices 2026 — English, IELTS and other courses in Baku",
    metaDesc:
      "Monthly prices for English, IELTS, TOEFL, Russian, German and computer courses — group and one-to-one, daytime and evening. Current prices by branch.",
    course: "Course",
    group: "Group",
    individual: "One-to-one",
    day: "day",
    evening: "evening",
    perMonth: "Monthly price, AZN",
    onRequest: "Contact us for price",
    view: "View course",
    note:
      "Prices can differ by branch — where a range is shown, it runs from the lowest to the highest branch price. The exact price per branch is on each course page.",
    faqTitle: "Pricing questions",
    faq: [
      ["What does the price include?", "The core lessons and the online PDF course materials. Printed textbooks are paid separately."],
      ["Why do evening groups cost more?", "Evening hours are in higher demand. Evening groups are roughly +10 AZN for group lessons and +20 AZN for one-to-one; the exact amount is in the table."],
      ["What is the difference between group and one-to-one?", "Group lessons run in small groups and cost less. In one-to-one lessons the programme and pace are fully tailored to you."],
      ["Is there a trial lesson before I enrol?", "Yes, you can book a free trial lesson. You can also check your level beforehand with the online test."],
    ],
  },
  ru: {
    title: "Цены на курсы",
    sub: "Ежемесячные цены на все курсы — групповые и индивидуальные, днём и вечером.",
    metaTitle: "Цены на курсы 2026 — английский, IELTS и другие курсы в Баку",
    metaDesc:
      "Ежемесячные цены на курсы английского, IELTS, TOEFL, русского, немецкого и компьютерные курсы — группы и индивидуально, днём и вечером. Цены по филиалам.",
    course: "Курс",
    group: "Группа",
    individual: "Индивидуально",
    day: "днём",
    evening: "вечером",
    perMonth: "Цена в месяц, AZN",
    onRequest: "Цена по запросу",
    view: "Смотреть курс",
    note:
      "Цены могут различаться по филиалам — если указан диапазон, это минимальная и максимальная цена среди филиалов. Точная цена по филиалу — на странице курса.",
    faqTitle: "Вопросы о ценах",
    faq: [
      ["Что входит в стоимость?", "Основные занятия и онлайн PDF-материалы курса. Печатные учебники оплачиваются отдельно."],
      ["Почему вечерние группы дороже?", "Вечерние часы пользуются большим спросом. Вечерние группы — примерно +10 AZN для групповых и +20 AZN для индивидуальных занятий; точная сумма в таблице."],
      ["Чем отличаются групповые и индивидуальные занятия?", "Групповые занятия проходят в небольших группах и стоят дешевле. На индивидуальных программа и темп полностью подстраиваются под вас."],
      ["Есть ли пробный урок до записи?", "Да, можно записаться на бесплатный пробный урок. Уровень можно заранее проверить онлайн-тестом."],
    ],
  },
};

const copyFor = (locale) => COPY[locale] || COPY.az;

export async function generateMetadata() {
  const c = copyFor(await getLocale());
  return buildMetadata({ title: c.metaTitle, description: c.metaDesc, path: "/kurslar/qiymetler" });
}

// ── Qiymət hesabı ──

/** Filiallar üzrə [min, max]; qiymət yoxdursa null. */
function priceRange(course, kind, time) {
  const values = (course.pricing || [])
    .map((p) => p?.[kind]?.[time])
    .filter((v) => typeof v === "number" && v > 0);
  if (!values.length) return null;
  return [Math.min(...values), Math.max(...values)];
}

const fmt = (range) => (!range ? "—" : range[0] === range[1] ? `${range[0]}` : `${range[0]}–${range[1]}`);

const COLS = [
  ["group", "day"],
  ["group", "evening"],
  ["individual", "day"],
  ["individual", "evening"],
];

const hasAnyPrice = (course) => COLS.some(([k, t]) => priceRange(course, k, t));

/**
 * «custom» rejimli kursun qiymətləri matrisdə yox, `customPricing` sətirlərində
 * saxlanılır (seans üzrə — məsələn danışıq klubu). Belə kurs matris boş olduğu
 * üçün «Qiymət üçün əlaqə» kimi görünürdü, halbuki öz səhifəsində qiyməti var.
 */
const customRows = (course) => (course.pricingMode === "custom" ? course.customPricing || [] : []);

// ── Görünüş ──

const wrap = { maxWidth: 1200, margin: "0 auto", padding: "0 28px" };
const th = { textAlign: "left", fontSize: 12.5, fontWeight: 700, color: "#63636E", letterSpacing: ".04em", padding: "12px 14px", borderBottom: "1px solid #D9DAE3", whiteSpace: "nowrap" };
const td = { padding: "13px 14px", borderBottom: "1px solid #ECEDF2", fontSize: 15, color: "#33333D", verticalAlign: "middle" };
const num = { ...td, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", fontWeight: 600, color: "#16161C" };

function PriceTable({ category, courses, c }) {
  return (
    <section style={{ ...wrap, padding: "44px 28px 0" }}>
      <h2 id={category.slug} style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(22px,2.6vw,28px)", color: "#14141C", letterSpacing: "-.01em", margin: "0 0 16px", scrollMarginTop: 110 }}>
        {category.name}
      </h2>
      <div style={{ overflowX: "auto", border: "1px solid #ECEDF2", borderRadius: 16, background: "#fff" }}>
        <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>{c.course}</th>
              {COLS.map(([k, t]) => (
                <th key={`${k}-${t}`} style={th}>{c[k]} · {c[t]}</th>
              ))}
              <th style={th} aria-label={c.view} />
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course._id}>
                <td style={{ ...td, fontWeight: 600, color: "#16161C" }}>{course.title}</td>
                {hasAnyPrice(course) ? (
                  COLS.map(([k, t]) => <td key={`${k}-${t}`} style={num}>{fmt(priceRange(course, k, t))}</td>)
                ) : customRows(course).length ? (
                  <td colSpan={COLS.length} style={td}>
                    {/* Flex XANANIN İÇİNDƏ: `td`-nin özünə `display: flex`
                        verilsə xana cədvəl xanası olmaqdan çıxır, `colSpan`
                        işləmir və sətrin son sütunu sürüşür. */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px" }}>
                      {customRows(course).map((r, i) => (
                        <span key={i} style={{ whiteSpace: "nowrap" }}>
                          {r.label} <strong style={{ fontVariantNumeric: "tabular-nums", color: "#16161C" }}>{r.value}</strong>
                        </span>
                      ))}
                    </div>
                  </td>
                ) : (
                  <td colSpan={COLS.length} style={{ ...td, color: "#63636E" }}>
                    <Link href="/elaqe" style={{ color: "var(--accent)", fontWeight: 700 }}>{c.onRequest}</Link>
                  </td>
                )}
                <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                  <Link href={`/kurslar/${course.slug}`} style={{ color: "var(--accent)", fontWeight: 700, fontSize: 14 }}>{c.view} →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function PricesPage() {
  const locale = await getLocale();
  const tr = await getT();
  const c = copyFor(locale);

  const [catData, courseData] = await Promise.all([apiGet("/categories"), apiGet("/courses")]);
  const categories = catData?.categories || [];
  const courses = courseData?.courses || [];

  // Kateqoriya ağacı /kurslar hub-ı ilə EYNİ qaydada yastılanır — iki səhifədə
  // bölmələrin sırası fərqli olmasın.
  const byCat = {};
  for (const course of courses) (byCat[String(course.category?._id || course.category)] ||= []).push(course);
  const groups = [];
  for (const top of categories) {
    if (top.children?.length) for (const child of top.children) groups.push(child);
    else groups.push(top);
  }
  const sections = groups.map((cat) => ({ cat, list: byCat[String(cat._id)] || [] })).filter((s) => s.list.length);

  // ── JSON-LD ── ItemList + Breadcrumb + FAQPage
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: c.title,
      numberOfItems: courses.length,
      itemListElement: courses.map((course, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: course.title,
        url: absUrl(`/kurslar/${course.slug}`, locale),
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: tr("common.home"), item: absUrl("/", locale) },
        { "@type": "ListItem", position: 2, name: tr("common.courses"), item: absUrl("/kurslar", locale) },
        { "@type": "ListItem", position: 3, name: c.title, item: absUrl("/kurslar/qiymetler", locale) },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: c.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <PageBanner
        title={c.title}
        subtitle={c.sub}
        mascot="courses"
        breadcrumb={[
          { label: tr("common.home"), href: "/" },
          { label: tr("common.courses"), href: "/kurslar" },
          { label: c.title },
        ]}
      />

      {/* Bölmələr arası sürətli keçid */}
      <nav aria-label={c.title} style={{ ...wrap, padding: "32px 28px 0", display: "flex", flexWrap: "wrap", gap: 10 }}>
        {sections.map(({ cat }) => (
          <a key={cat._id} href={`#${cat.slug}`} style={{ fontSize: 14, fontWeight: 600, color: "#33333D", background: "#F3F4F8", border: "1px solid #E7E8EE", borderRadius: 99, padding: "7px 14px" }}>
            {cat.name}
          </a>
        ))}
      </nav>

      <p style={{ ...wrap, padding: "20px 28px 0", fontSize: 14.5, color: "#55555F", lineHeight: 1.6, maxWidth: 900 }}>
        <strong style={{ color: "#16161C" }}>{c.perMonth}.</strong> {c.note}
      </p>

      {sections.map(({ cat, list }) => (
        <PriceTable key={cat._id} category={cat} courses={list} c={c} />
      ))}

      <section style={{ ...wrap, padding: "60px 28px 0" }}>
        <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(24px,3vw,32px)", color: "#14141C", letterSpacing: "-.02em", margin: "0 0 24px" }}>{c.faqTitle}</h2>
        <FaqAccordion items={c.faq.map(([question, answer]) => ({ question, answer }))} />
      </section>

      <CtaBand />
    </>
  );
}
