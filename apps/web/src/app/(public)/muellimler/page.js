// Data
import { apiGet } from "@/lib/api";

// Components
import { PageBanner } from "@/components/site/PageBanner";
import { TeacherBrowser } from "@/components/site/TeacherBrowser";

// Utils / SEO
import { buildMetadata } from "@/lib/seo";
import { getT } from "@/lib/i18n/serverT";

export async function generateMetadata() {
  // Başlıq/təsvir seçilmiş dildə — əvvəl sabit azərbaycanca idi, ona görə
  // /en və /ru səhifələri AZ meta ilə indekslənirdi.
  const t = await getT();
  return buildMetadata({
    title: t("meta.teachers.title"),
    description: t("meta.teachers.desc"),
    path: "/muellimler",
  });
}

export default async function TeachersPage() {
  const tr = await getT();
  // ── data fetching ──
  const [teacherData, courseData] = await Promise.all([
    apiGet("/teachers"),
    apiGet("/courses"),
  ]);
  const teachers = teacherData?.teachers || [];
  const courses = courseData?.courses || [];

  // ── render ──
  return (
    <>
      <PageBanner
        title={tr("page.teachers.title")}
        subtitle={tr("page.teachers.sub")}
        mascot="teachers"
      />
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 28px 0" }}>
        <TeacherBrowser courses={courses} initialTeachers={teachers} />
      </section>
    </>
  );
}
