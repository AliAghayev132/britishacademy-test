// Next
import { notFound } from "next/navigation";

// Components
import {
  ViewBeacon,
  LocaleLink as Link,
  ContentBlocks,
  PriceCards,
  FaqAccordion,
  CourseCard,
  ApplyButton,
} from "@/components";
import { PageBanner } from "@/components/server";

// Lib
import { ldJson, getImageUrl } from "@/lib";
import {
  getT,
  getLocale,
  apiGet,
  apiGetStatus,
  isMissing,
  metaFromApi,
  buildMetadata,
  SITE_URL,
  absUrl,
} from "@/lib/server";

// Utils
// Standart təmizləyici YouTube/Vimeo iframe-lərini silirdi — videolar saytda
// görünmürdü. sanitizeHtml onları icazəli hostlarla saxlayır.
import { sanitizeHtml } from "@/utils";

const wrap = { maxWidth: 1200, margin: "0 auto", padding: "0 28px" };

// ── Category hub helper ──
/** The /kurslar/<slug> namespace serves BOTH courses and category hubs. */
async function findCategory(slug) {
  const catData = await apiGet("/categories");
  for (const top of catData?.categories || []) {
    if (top.slug === slug) return top;
    for (const child of top.children || []) if (child.slug === slug) return child;
  }
  return null;
}

// ── Metadata ──
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data } = await apiGetStatus(`/courses/${slug}`);
  const course = data?.course;
  if (course) {
    // Use the short `title`, not `h1` — h1 copy often already carries the brand
    // name and the root layout appends "| British Academy" via the template.
    return metaFromApi(course.seo, {
      title: course.title,
      description: course.lead,
      path: `/kurslar/${slug}`,
    });
  }
  const cat = await findCategory(slug);
  if (cat) {
    const tr = await getT();
    return buildMetadata({
      title: cat.name,
      description: cat.lead || `${cat.name} — ${tr("meta.categoryDesc")}`,
      path: `/kurslar/${slug}`,
    });
  }
  return {};
}

// ── Category hub ──
/** Category hub: boxes of the category's courses. */
async function CategoryHub({ cat }) {
  const tr = await getT();
  const courseData = await apiGet(`/courses?category=${cat.slug}`);
  const courses = courseData?.courses || [];
  return (
    <>
      <PageBanner
        title={cat.name}
        subtitle={cat.lead || cat.name}
        mascot="courses"
        breadcrumb={[
          { label: tr("common.home"), href: "/" },
          { label: tr("common.courses"), href: "/kurslar" },
          { label: cat.name },
        ]}
      />
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 28px 0" }}>
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {courses.map((c, i) => <CourseCard key={c._id} course={c} index={i} />)}
        </div>
        {!courses.length && <p style={{ color: "#63636F" }}>{tr("course.emptyCat")}</p>}
      </section>
    </>
  );
}

// ── Subcomponents ──
/** Sidebar with course info rows + apply CTA. */
function InfoSidebar({ course, tr }) {
  return (
    <aside style={{ border: "1px solid #ECEDF2", borderRadius: 20, padding: 26, background: "#FAFBFF", position: "sticky", top: 100 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#63636E", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 16 }}>{tr("course.info")}</div>
      {(course.info || []).map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid #ECEDF2", fontSize: 15 }}>
          <span style={{ color: "#63636F" }}>{r.label}</span>
          <span style={{ color: "#16161C", fontWeight: 600 }}>{r.value}</span>
        </div>
      ))}
      <ApplyButton interest={course.title} course={course._id} className="ba-btn-primary" style={{ width: "100%", marginTop: 20, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 15, padding: 14, borderRadius: 13, cursor: "pointer" }} />
    </aside>
  );
}

/** "Üstünlüklər" — responsive icon-tile grid of course features. */
function FeaturesGrid({ features, tr }) {
  return (
    <section style={{ ...wrap, padding: "56px 28px 0" }}>
      <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(24px,3vw,32px)", color: "#14141C", letterSpacing: "-.02em", margin: "0 0 26px" }}>{tr("course.features")}</h2>
      <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
        {features.map((f, i) => (
          <div key={i} style={{ border: "1px solid #ECEDF2", borderRadius: 18, padding: 24, background: "#fff" }}>
            <span style={{ display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 13, background: "var(--accent-soft)", fontSize: 23 }}>{f.icon}</span>
            <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 17, color: "#16161C", margin: "16px 0 8px" }}>{f.title}</h3>
            <p style={{ fontSize: 14, color: "#63636F", lineHeight: 1.6, margin: 0 }}>{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * "Bu kursun müəllimləri" — `course.teachers` (Course → Teacher əlaqəsi).
 *
 * Əvvəl filial üzrə bölünmüş siyahıdan yığılırdı; artıq əlaqə birbaşa kursun
 * özündədir, ona görə bölgü olmadan bütün müəllimlər göstərilir.
 */
function CourseTeachers({ teachers, tr }) {
  return (
    <section style={{ ...wrap, padding: "56px 28px 0" }}>
      <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(24px,3vw,32px)", color: "#14141C", letterSpacing: "-.02em", margin: "0 0 8px" }}>{tr("course.teachers")}</h2>
      <p style={{ fontSize: 15, color: "#63636F", margin: "0 0 24px" }}>{tr("course.teachersSub")} <Link href="/muellimler" style={{ color: "var(--accent)", fontWeight: 700 }}>{tr("nav.all")}</Link></p>
      <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {teachers.map((t) => (
          <Link key={t._id} href={`/muellimler/${t.slug}`} style={{ display: "flex", alignItems: "center", gap: 14, border: "1px solid #ECEDF2", borderRadius: 18, padding: 18, background: "#fff" }}>
            {/* Avatar `ba-av`: şəkil varsa kəsilib dairəyə oturur, yoxsa baş hərf. */}
            <span className="ba-av" style={{ "--c": t.color || "#2E6BE6", width: 52, height: 52, fontSize: 22 }}>
              {t.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getImageUrl(t.photo)} alt="" loading="lazy" decoding="async" />
              ) : (
                <span>{(t.fullName || "?").charAt(0)}</span>
              )}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: "'Poppins'", fontWeight: 700, fontSize: 16.5, color: "#16161C" }}>{t.fullName}</span>
              {t.title && <span style={{ display: "block", fontSize: 13, color: "#63636F", marginTop: 3 }}>{t.title}</span>}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** "Digər istiqamətlər" related-courses grid. */
function RelatedCourses({ related, tr }) {
  return (
    <section style={{ ...wrap, padding: "56px 28px 0" }}>
      <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(24px,3vw,32px)", color: "#14141C", letterSpacing: "-.02em", margin: "0 0 26px" }}>{tr("course.related")}</h2>
      <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
        {related.map((c, i) => <CourseCard key={c._id} course={c} index={i} />)}
      </div>
    </section>
  );
}

export default async function CoursePage({ params }) {
  const { slug } = await params;
  const res = await apiGetStatus(`/courses/${slug}`);

  // ── Data fetching + notFound guard ──
  // isMissing throws when the API is unreachable, so an outage renders a 5xx
  // instead of silently 404-ing a real course.
  if (isMissing(res, "course")) {
    const cat = await findCategory(slug);
    if (cat) return <CategoryHub cat={cat} />;
    notFound();
  }

  const tr = await getT();
  const locale = await getLocale();
  const { course, related = [] } = res.data;

  // Qiymət varmı? Boşdursa bölmə ümumiyyətlə göstərilmir — əvvəl başlıq
  // görünür, altı boş qalırdı (qiymətlər admin paneldən doldurulana qədər).
  const hasPricing =
    (course.pricing || []).length > 0 || (course.customPricing || []).length > 0;

  const teachers = course.teachers || [];

  // ── JSON-LD ──
  // Course + Breadcrumb + FAQPage
  const abs = (u) => (u ? (u.startsWith("http") ? u : `${SITE_URL}${u}`) : undefined);
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.h1 || course.title,
      description: course.lead || course.excerpt,
      url: absUrl(`/kurslar/${course.slug || slug}`, locale),
      provider: { "@type": "EducationalOrganization", name: "British Academy", sameAs: SITE_URL },
      image: abs(course.image),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: tr("bc.home"), item: absUrl("/", locale) },
        { "@type": "ListItem", position: 2, name: course.category?.name || tr("bc.courses"), item: absUrl(course.category?.slug ? `/kurslar/${course.category.slug}` : "/kurslar", locale) },
        { "@type": "ListItem", position: 3, name: course.title, item: absUrl(`/kurslar/${slug}`, locale) },
      ],
    },
  ];
  if (course.faq?.length) {
    ld.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: course.faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
    });
  }

  // ── Render ──
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <ViewBeacon type="course" slug={course.slug} />

      {/* Hero */}
      <PageBanner
        title={course.h1 || course.title}
        subtitle={course.lead}
        mascot="courses"
        breadcrumb={[
          { label: tr("common.home"), href: "/" },
          { label: course.category?.name || tr("common.courses"), href: `/kurslar/${course.category?.slug || ""}` },
          { label: course.title },
        ]}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <ApplyButton interest={course.title} course={course._id} className="ba-btn-primary" style={{ background: "#fff", color: "var(--accent)", border: "none", fontWeight: 700, fontSize: 15, padding: "14px 26px", borderRadius: 99, cursor: "pointer" }} />
          <Link href="/elaqe" style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", fontWeight: 700, fontSize: 15, padding: "14px 26px", borderRadius: 99 }}>{tr("course.contactSave")}</Link>
        </div>
      </PageBanner>

      {/* About + info card */}
      <section style={{ ...wrap, padding: "60px 28px 0" }}>
        <div className="split" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 36, alignItems: "start" }}>
          <div>
            {course.contentHtml ? (
              <article className="bz-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.contentHtml) }} />
            ) : course.content?.length ? (
              <ContentBlocks blocks={course.content} />
            ) : (
              <>
                <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(24px,3vw,32px)", color: "#14141C", margin: "0 0 16px" }}>{tr("course.about")}</h2>
                <p style={{ fontSize: 17, lineHeight: 1.8, color: "#33333D" }}>{course.lead}</p>
              </>
            )}
          </div>
          <InfoSidebar course={course} tr={tr} />
        </div>
      </section>

      {/* Prices */}
      {hasPricing && (
      <section id="qiymetler" style={{ ...wrap, padding: "56px 28px 0" }}>
        <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(24px,3vw,32px)", color: "#14141C", letterSpacing: "-.02em", margin: "0 0 22px" }}>{course.pricingMode === "custom" ? tr("course.prices") : tr("course.pricesByBranch")}</h2>
        <PriceCards course={course} />
        <p style={{ fontSize: 13.5, color: "#63636E", margin: "14px 0 0" }}>{tr("course.priceHelp")} <Link href="/elaqe" style={{ color: "var(--accent)", fontWeight: 700 }}>{tr("course.contactSave")}</Link>.</p>
        {/* Bütün kurslar üzrə müqayisə cədvəli — hər kurs səhifəsindən daxili keçid. */}
        <p style={{ fontSize: 13.5, margin: "8px 0 0" }}>
          <Link href="/kurslar/qiymetler" style={{ color: "var(--accent)", fontWeight: 700 }}>
            {({ az: "Bütün kursların qiymətləri", en: "Prices for all courses", ru: "Цены на все курсы" })[locale] || "Bütün kursların qiymətləri"} →
          </Link>
        </p>
      </section>
      )}

      {/* Features */}
      {course.features?.length > 0 && <FeaturesGrid features={course.features} tr={tr} />}

      {/* Course teachers */}
      {teachers.length > 0 && <CourseTeachers teachers={teachers} tr={tr} />}

      {/* FAQ */}
      {course.faq?.length > 0 && (
        <section style={{ ...wrap, padding: "56px 28px 0" }}>
          <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(24px,3vw,32px)", color: "#14141C", letterSpacing: "-.02em", margin: "0 0 24px" }}>{tr("common.faq")}</h2>
          <FaqAccordion items={course.faq} />
        </section>
      )}

      {/* Related */}
      {related.length > 0 && <RelatedCourses related={related} tr={tr} />}

      {/* CTA */}
      <section style={{ ...wrap, padding: "64px 28px 0" }}>
        <div style={{ background: "#00103D", borderRadius: 28, padding: "52px 40px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(26px,3.4vw,36px)", color: "#fff", margin: 0 }}>{tr("cta.title")}</h2>
          <p style={{ fontSize: 16, color: "#B9BAD0", margin: "14px auto 26px", maxWidth: 520, lineHeight: 1.6 }}>{tr("cta.text")}</p>
          <ApplyButton interest={course.title} course={course._id} style={{ background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 16, padding: "15px 30px", borderRadius: 99, cursor: "pointer" }} />
        </div>
      </section>
    </>
  );
}
