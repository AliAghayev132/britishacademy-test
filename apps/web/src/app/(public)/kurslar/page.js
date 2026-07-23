import Link from "next/link";
import { apiGet } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";
import { CourseCard, SectionHead } from "@/components/site/cards";

export const metadata = buildMetadata({
  title: "Kurslar",
  description:
    "British Academy kursları — dil kursları, beynəlxalq imtahanlara hazırlıq, kompüter və karyera proqramları. İstiqamətini seç.",
  path: "/kurslar",
});

const wrap = { maxWidth: 1240, margin: "0 auto", padding: "0 28px" };

export default async function CoursesHubPage() {
  const [catData, courseData] = await Promise.all([
    apiGet("/categories"),
    apiGet("/courses"),
  ]);
  const categories = catData?.categories || [];
  const courses = courseData?.courses || [];

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

  return (
    <>
      <section style={{ position: "relative", background: "var(--accent)", overflow: "hidden" }}>
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "56px 28px 60px" }}>
          <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(32px,4.6vw,50px)", letterSpacing: "-.025em", margin: 0, color: "#fff" }}>Kurslarımız</h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,.92)", margin: "16px 0 0", maxWidth: 640, lineHeight: 1.6 }}>
            Dil kurslarından beynəlxalq imtahanlara, kompüter və karyera proqramlarına qədər — istiqamətini seç.
          </p>
        </div>
      </section>

      {groups.map((cat) => {
        const list = byCat[String(cat._id)] || [];
        if (!list.length) return null;
        return (
          <section key={cat._id} style={{ ...wrap, padding: "64px 28px 0" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <SectionHead title={`${cat.icon || ""} ${cat.name}`.trim()} />
              <Link href={`/kurslar/${cat.slug}`} style={{ color: "var(--accent)", fontWeight: 700, fontSize: 14.5 }}>Hamısına bax →</Link>
            </div>
            <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
              {list.slice(0, 6).map((c, i) => <CourseCard key={c._id} course={c} index={i} />)}
            </div>
          </section>
        );
      })}
    </>
  );
}
