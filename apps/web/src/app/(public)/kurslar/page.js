// Next
import { LocaleLink as Link } from "@/components/site/LocaleLink";

// Data
import { apiGet } from "@/lib/api";

// Components
import { CourseCard, SectionHead } from "@/components/site/cards";
import { PageBanner } from "@/components/site/PageBanner";
import { CtaBand } from "@/components/site/CtaBand";

// Utils / SEO
import { buildMetadata } from "@/lib/seo";
import { getT } from "@/lib/i18n/serverT";

export async function generateMetadata() {
  return buildMetadata({
    title: "Kurslar",
    description:
      "British Academy kursları — dil kursları, beynəlxalq imtahanlara hazırlıq, kompüter və karyera proqramları. İstiqamətini seç.",
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

  // ── render ──
  return (
    <>
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
