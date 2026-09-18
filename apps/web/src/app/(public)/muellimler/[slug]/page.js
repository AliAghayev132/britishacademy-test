// Next
import { notFound } from "next/navigation";

// Components
import { ViewBeacon, LocaleLink as Link, ApplyButton } from "@/components";

// Lib
import { ldJson } from "@/lib";
import {
  getT,
  getLocale,
  apiGetStatus,
  isMissing,
  metaFromApi,
  SITE_URL,
  SITE_NAME,
  absUrl,
} from "@/lib/server";

// Utils
// Standart təmizləyici YouTube/Vimeo iframe-lərini silirdi — videolar saytda
// görünmürdü. sanitizeHtml onları icazəli hostlarla saxlayır.
import { sanitizeHtml } from "@/utils";

// ── Metadata ──
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data } = await apiGetStatus(`/teachers/${slug}`);
  const t = data?.teacher;
  if (!t) return {};
  const tr = await getT();
  return metaFromApi(t.seo, {
    title: `${t.fullName} — ${tr("meta.teacherSuffix")}`,
    description: `${t.fullName} — ${t.title || tr("meta.teacherFallback")}.`,
    path: `/muellimler/${slug}`,
  });
}

// ── Subcomponents ──
/** Banner: avatar, breadcrumb, name, title. */
function TeacherHero({ t, tr }) {
  return (
    <section className="ba-banner">
      <div className="ba-banner-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 28px 56px", display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
        <span className="ba-av" style={{ "--c": t.color || "#2E6BE6", width: 110, height: 110, fontSize: 42 }}>
          {t.photo ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={t.photo} alt={t.fullName} />) : <span>{(t.fullName || "?").charAt(0)}</span>}
        </span>
        <div>
          <nav aria-label="Breadcrumb" style={{ fontSize: 13.5, color: "rgba(255,255,255,.8)" }}>
            <Link href="/muellimler" style={{ color: "rgba(255,255,255,.8)" }}>{tr("common.teachers")}</Link>
            <span style={{ opacity: 0.5 }}> / </span>
            <span style={{ color: "#fff", fontWeight: 600 }}>{t.fullName}</span>
          </nav>
          <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(28px,4vw,44px)", letterSpacing: "-.02em", margin: "10px 0 0", color: "#fff" }}>{t.fullName}</h1>
          {t.title && <p style={{ fontSize: 17, color: "rgba(255,255,255,.92)", margin: "8px 0 0" }}>{t.title}</p>}
        </div>
      </div>
    </section>
  );
}

/**
 * "Keçdiyi kurslar" — müəllimin apardığı kurslar.
 *
 * Saat/qrafik göstərilmir: qrafik tez-tez dəyişirdi və onu iki yerdə saxlamaq
 * baxım yükü yaradırdı. Əlaqə indi kursun özündədir (Course.teachers), ona görə
 * ziyarətçiyə birbaşa kurs səhifəsinə keçid verilir.
 */
function TaughtCourses({ courses, tr }) {
  return (
    <>
      <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(22px,2.8vw,30px)", color: "#14141C", margin: "40px 0 18px" }}>
        {tr("teacher.courses")}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {courses.map((c) => (
          <Link
            key={c._id}
            href={`/kurslar/${c.slug}`}
            style={{ display: "block", border: "1px solid #ECEDF2", borderRadius: 14, padding: "16px 18px", background: "#fff" }}
          >
            <span style={{ display: "block", fontWeight: 700, color: "#16161C", fontFamily: "'Poppins'", fontSize: 15.5 }}>
              {c.title}
            </span>
            {/* `excerpt` admin paneldə çox vaxt boş qalır — `lead` ehtiyatdır. */}
            {(c.excerpt || c.lead) && (
              <span style={{ display: "block", fontSize: 13.5, color: "#63636F", lineHeight: 1.6, marginTop: 5 }}>
                {c.excerpt || c.lead}
              </span>
            )}
            {(c.levels || []).length > 0 && (
              <span style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 11 }}>
                {c.levels.map((lv) => (
                  <span key={lv} style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent)", background: "var(--accent-soft)", borderRadius: 99, padding: "5px 12px" }}>
                    {lv}
                  </span>
                ))}
              </span>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}

/** Sidebar: stats, branches, apply CTA. */
function TeacherSidebar({ t, tr }) {
  return (
    <aside style={{ border: "1px solid #ECEDF2", borderRadius: 20, padding: 26, background: "#FAFBFF" }}>
      {(t.stats || []).length > 0 && (
        <>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#63636E", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 16 }}>{tr("course.info")}</div>
          {t.stats.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid #ECEDF2", fontSize: 15 }}>
              <span style={{ color: "#63636F" }}>{s.label}</span>
              <span style={{ color: "#16161C", fontWeight: 600 }}>{s.value}</span>
            </div>
          ))}
        </>
      )}
      {(t.branches || []).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#63636E", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>{tr("page.branches.title")}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {t.branches.map((b) => (
              <span key={b._id} style={{ fontSize: 13, fontWeight: 600, color: "#4a4a55", background: "#F5F6FA", borderRadius: 99, padding: "6px 13px" }}>{b.name}</span>
            ))}
          </div>
        </div>
      )}
      <ApplyButton interest={`Müəllim: ${t.fullName}`} className="ba-btn-primary" style={{ width: "100%", marginTop: 20, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 15, padding: 14, borderRadius: 13, cursor: "pointer" }} />
    </aside>
  );
}

export default async function TeacherPage({ params }) {
  const { slug } = await params;

  // ── Data fetching + notFound guard ──
  const res = await apiGetStatus(`/teachers/${slug}`);
  if (isMissing(res, "teacher")) notFound();
  const { teacher: t, courses = [] } = res.data;
  const tr = await getT();
  const locale = await getLocale();

  // ── JSON-LD ── Person + Breadcrumb
  const abs = (u) => (u ? (u.startsWith("http") ? u : `${SITE_URL}${u}`) : undefined);
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: t.fullName,
      jobTitle: t.title || undefined,
      worksFor: { "@type": "Organization", name: SITE_NAME },
      url: absUrl(`/muellimler/${t.slug || slug}`, locale),
      image: abs(t.photo),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: tr("bc.home"), item: absUrl("/", locale) },
        { "@type": "ListItem", position: 2, name: tr("bc.teachers"), item: absUrl("/muellimler", locale) },
        { "@type": "ListItem", position: 3, name: t.fullName, item: absUrl(`/muellimler/${t.slug || slug}`, locale) },
      ],
    },
  ];

  // ── Render ──
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <ViewBeacon type="teacher" slug={t.slug} />

      <TeacherHero t={t} tr={tr} />

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 28px 0" }}>
        <div className="split" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 36, alignItems: "start" }}>
          <div>
            {t.bio ? (
              // Rich text from the admin editor — sanitize like blog content.
              <div style={{ fontSize: 16.5, lineHeight: 1.85, color: "#3c3c47" }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(t.bio) }} />
            ) : (
              <p style={{ fontSize: 16.5, lineHeight: 1.85, color: "#3c3c47" }}>
                {t.fullName} {tr("teacher.bioSoon")}
              </p>
            )}

            {courses.length > 0 && <TaughtCourses courses={courses} tr={tr} />}
          </div>

          <TeacherSidebar t={t} tr={tr} />
        </div>
      </section>
    </>
  );
}
