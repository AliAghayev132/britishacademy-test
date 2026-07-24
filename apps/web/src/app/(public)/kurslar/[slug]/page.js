import { notFound } from "next/navigation";
import Link from "next/link";
import { apiGetStatus, isMissing } from "@/lib/api";
import { metaFromApi, SITE_URL } from "@/lib/seo";
import { ContentBlocks } from "@/components/site/ContentBlocks";
import { PriceCards } from "@/components/site/PriceCards";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { CourseCard, SectionHead } from "@/components/site/cards";
import { ApplyButton } from "@/components/site/ApplyButton";

const wrap = { maxWidth: 1200, margin: "0 auto", padding: "0 28px" };

import { apiGet } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

/** The /kurslar/<slug> namespace serves BOTH courses and category hubs. */
async function findCategory(slug) {
  const catData = await apiGet("/categories");
  for (const top of catData?.categories || []) {
    if (top.slug === slug) return top;
    for (const child of top.children || []) if (child.slug === slug) return child;
  }
  return null;
}

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
    return buildMetadata({
      title: cat.name,
      description: cat.lead || `${cat.name} — British Academy proqramları və qeydiyyat.`,
      path: `/kurslar/${slug}`,
    });
  }
  return {};
}

/** Category hub: boxes of the category's courses. */
async function CategoryHub({ cat }) {
  const courseData = await apiGet(`/courses?category=${cat.slug}`);
  const courses = courseData?.courses || [];
  return (
    <>
      <section style={{ position: "relative", background: "var(--accent)", overflow: "hidden" }}>
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "30px 28px 60px" }}>
          <nav aria-label="Breadcrumb" style={{ display: "flex", gap: 8, fontSize: 13.5, color: "rgba(255,255,255,.8)" }}>
            <Link href="/" style={{ color: "rgba(255,255,255,.8)" }}>Ana səhifə</Link>
            <span style={{ opacity: 0.5 }}>/</span>
            <Link href="/kurslar" style={{ color: "rgba(255,255,255,.8)" }}>Kurslar</Link>
            <span style={{ opacity: 0.5 }}>/</span>
            <span style={{ color: "#fff", fontWeight: 600 }}>{cat.name}</span>
          </nav>
          <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(30px,4.4vw,48px)", letterSpacing: "-.025em", margin: "18px 0 0", color: "#fff" }}>{cat.name}</h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,.92)", margin: "16px 0 0", maxWidth: 640, lineHeight: 1.6 }}>
            {cat.lead || `${cat.name} üzrə bütün proqramlar və qeydiyyat.`}
          </p>
        </div>
      </section>
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 28px 0" }}>
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {courses.map((c, i) => <CourseCard key={c._id} course={c} index={i} />)}
        </div>
        {!courses.length && <p style={{ color: "#63636F" }}>Bu kateqoriyada hələ kurs yoxdur.</p>}
      </section>
    </>
  );
}

export default async function CoursePage({ params }) {
  const { slug } = await params;
  const res = await apiGetStatus(`/courses/${slug}`);

  // isMissing throws when the API is unreachable, so an outage renders a 5xx
  // instead of silently 404-ing a real course.
  if (isMissing(res, "course")) {
    const cat = await findCategory(slug);
    if (cat) return <CategoryHub cat={cat} />;
    notFound();
  }

  const { course, teachersByBranch = [], related = [] } = res.data;

  // JSON-LD: Course + Breadcrumb + FAQPage
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.h1 || course.title,
      description: course.lead,
      provider: { "@type": "EducationalOrganization", name: "British Academy", sameAs: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ana səhifə", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: course.category?.name || "Kurslar", item: `${SITE_URL}/kurslar/${course.category?.slug || ""}` },
        { "@type": "ListItem", position: 3, name: course.title, item: `${SITE_URL}/kurslar/${slug}` },
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      {/* Hero */}
      <section style={{ position: "relative", background: "var(--accent)", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -90, right: "6%", width: 340, height: 340, borderRadius: "50%", background: "rgba(255,255,255,.13)", filter: "blur(22px)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "30px 28px 60px" }}>
          <nav aria-label="Breadcrumb" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 13.5, color: "rgba(255,255,255,.8)" }}>
            <Link href="/" style={{ color: "rgba(255,255,255,.8)" }}>Ana səhifə</Link>
            <span style={{ opacity: 0.5 }}>/</span>
            <Link href={`/kurslar/${course.category?.slug || ""}`} style={{ color: "rgba(255,255,255,.8)" }}>{course.category?.name || "Kurslar"}</Link>
            <span style={{ opacity: 0.5 }}>/</span>
            <span style={{ color: "#fff", fontWeight: 600 }}>{course.title}</span>
          </nav>
          <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(30px,4.4vw,48px)", letterSpacing: "-.025em", margin: "18px 0 0", lineHeight: 1.12, color: "#fff", maxWidth: 900 }}>{course.h1 || course.title}</h1>
          {course.lead && <p style={{ fontSize: 18, color: "rgba(255,255,255,.92)", margin: "18px 0 0", maxWidth: 660, lineHeight: 1.6 }}>{course.lead}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
            <ApplyButton interest={course.title} className="ba-btn-primary" style={{ background: "#fff", color: "var(--accent)", border: "none", fontWeight: 700, fontSize: 15, padding: "14px 26px", borderRadius: 99, cursor: "pointer" }} />
            <Link href="/elaqe" style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", fontWeight: 700, fontSize: 15, padding: "14px 26px", borderRadius: 99 }}>Əlaqə saxla</Link>
          </div>
        </div>
      </section>

      {/* About + info card */}
      <section style={{ ...wrap, padding: "60px 28px 0" }}>
        <div className="split" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 36, alignItems: "start" }}>
          <div>
            {course.content?.length ? (
              <ContentBlocks blocks={course.content} />
            ) : (
              <>
                <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(24px,3vw,32px)", color: "#14141C", margin: "0 0 16px" }}>Kurs haqqında</h2>
                <p style={{ fontSize: 17, lineHeight: 1.8, color: "#33333D" }}>{course.lead}</p>
              </>
            )}
          </div>
          <aside style={{ border: "1px solid #ECEDF2", borderRadius: 20, padding: 26, background: "#FAFBFF", position: "sticky", top: 100 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#9A9AA6", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 16 }}>Qısa məlumat</div>
            {(course.info || []).map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid #ECEDF2", fontSize: 15 }}>
                <span style={{ color: "#63636F" }}>{r.label}</span>
                <span style={{ color: "#16161C", fontWeight: 600 }}>{r.value}</span>
              </div>
            ))}
            <ApplyButton interest={course.title} className="ba-btn-primary" style={{ width: "100%", marginTop: 20, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 15, padding: 14, borderRadius: 13, cursor: "pointer" }} />
          </aside>
        </div>
      </section>

      {/* Prices */}
      <section id="qiymetler" style={{ ...wrap, padding: "56px 28px 0" }}>
        <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(24px,3vw,32px)", color: "#14141C", letterSpacing: "-.02em", margin: "0 0 22px" }}>{course.pricingMode === "custom" ? "Qiymətlər" : "Filiallar üzrə qiymətlər"}</h2>
        <PriceCards course={course} teachersByBranch={teachersByBranch} />
        <p style={{ fontSize: 13.5, color: "#9A9AA6", margin: "14px 0 0" }}>Bütün <Link href="/filiallar" style={{ color: "var(--accent)", fontWeight: 700 }}>filiallara bax</Link> və ya dəqiq məlumat üçün <Link href="/elaqe" style={{ color: "var(--accent)", fontWeight: 700 }}>əlaqə saxla</Link>.</p>
      </section>

      {/* FAQ */}
      {course.faq?.length > 0 && (
        <section style={{ maxWidth: 900, margin: "56px auto 0", padding: "0 28px" }}>
          <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(24px,3vw,32px)", color: "#14141C", letterSpacing: "-.02em", margin: "0 0 24px" }}>Tez-tez verilən suallar</h2>
          <FaqAccordion items={course.faq} />
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section style={{ ...wrap, padding: "56px 28px 0" }}>
          <SectionHead title="Digər istiqamətlər" />
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
            {related.map((c, i) => <CourseCard key={c._id} course={c} index={i} />)}
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ ...wrap, padding: "64px 28px 0" }}>
        <div style={{ background: "#0C0D1A", borderRadius: 28, padding: "52px 40px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(26px,3.4vw,36px)", color: "#fff", margin: 0 }}>Hazırsan? Elə bu gün başla.</h2>
          <p style={{ fontSize: 16, color: "#B9BAD0", margin: "14px auto 26px", maxWidth: 520, lineHeight: 1.6 }}>Pulsuz səviyyə təyini və məsləhət üçün müraciət et.</p>
          <ApplyButton interest={course.title} style={{ background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 16, padding: "15px 30px", borderRadius: 99, cursor: "pointer" }} />
        </div>
      </section>
    </>
  );
}
