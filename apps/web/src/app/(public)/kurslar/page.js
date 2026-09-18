// Components
import { LocaleLink as Link, CourseCard, SectionHead, CtaBand } from "@/components";
import { PageBanner } from "@/components/server";

// Lib
import { ldJson } from "@/lib";
import { apiGet, buildMetadata, getT, getLocale, absUrl } from "@/lib/server";

export async function generateMetadata() {
  // Başlıq/təsvir seçilmiş dildə — əvvəl sabit azərbaycanca idi, ona görə
  // /en və /ru səhifələri AZ meta ilə indekslənirdi.
  const t = await getT();
  return buildMetadata({
    title: t("meta.courses.title"),
    description: t("meta.courses.desc"),
    path: "/kurslar",
  });
}

const wrap = { maxWidth: 1240, margin: "0 auto", padding: "0 28px" };

// ── Subcomponents ──

function CourseCategorySection({ category, courses, tr }) {
  if (!courses.length) return null;
  return (
    <section style={{ ...wrap, padding: "64px 28px 0" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <SectionHead title={`${category.icon || ""} ${category.name}`.trim()} />
        <Link href={`/kurslar/${category.slug}`} style={{ color: "var(--accent)", fontWeight: 700, fontSize: 14.5 }}>{tr("nav.all")}</Link>
      </div>
      <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
        {courses.slice(0, 6).map((c, i) => <CourseCard key={c._id} course={c} index={i} />)}
      </div>
    </section>
  );
}

export default async function CoursesHubPage() {
  const tr = await getT();
  // ── data fetching ──
  const [catData, courseData] = await Promise.all([
    apiGet("/categories"),
    apiGet("/courses"),
  ]);
  const categories = catData?.categories || [];
  const courses = courseData?.courses || [];

  // ── derived values ──
  const byCat = {};
  for (const c of courses) {
    const id = String(c.category?._id || c.category);
    (byCat[id] ||= []).push(c);
  }

  // Flatten: top-level "Xidmətlər" children + other top-level cats (Uşaq Proqramları)
  const groups = [];
  for (const top of categories) {
    if (top.children?.length) {
      for (const child of top.children) groups.push(child);
    } else {
      groups.push(top);
    }
  }

  // ── JSON-LD ──
  // Hub səhifəsində struktur məlumat yox idi: Google kurs siyahısını adi mətn
  // kimi görürdü. ItemList kataloqun tərkibini, BreadcrumbList isə səhifənin
  // saytdakı yerini bildirir.
  const locale = await getLocale();
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: tr("page.courses.title"),
      numberOfItems: courses.length,
      itemListElement: courses.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.title,
        url: absUrl(`/kurslar/${c.slug}`, locale),
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: tr("common.home"), item: absUrl("/", locale) },
        { "@type": "ListItem", position: 2, name: tr("page.courses.title"), item: absUrl("/kurslar", locale) },
      ],
    },
  ];

  // ── render ──
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <PageBanner
        title={tr("page.courses.title")}
        subtitle={tr("page.courses.sub")}
        mascot="courses"
      />

      {groups.map((cat) => (
        <CourseCategorySection key={cat._id} category={cat} courses={byCat[String(cat._id)] || []} tr={tr} />
      ))}

      <CtaBand />
    </>
  );
}
