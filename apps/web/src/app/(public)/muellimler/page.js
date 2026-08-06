// Data
import { apiGet } from "@/lib/api";

// Components
import { PageBanner } from "@/components/site/PageBanner";
import { TeacherBrowser } from "@/components/site/TeacherBrowser";

// Utils / SEO
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({
    title: "Müəllimlər",
    description:
      "British Academy müəllimləri — IELTS 8.0–8.5 sertifikatlı, xaricdə təhsil almış, beynəlxalq təcrübəli müəllim heyəti. Kursa görə süz.",
    path: "/muellimler",
  });
}

export default async function TeachersPage() {
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
        title="Müəllimlərimiz"
        subtitle="Beynəlxalq sertifikatlı, təcrübəli müəllim heyəti — kursa görə süzə bilərsən."
        mascot="teachers"
      />
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 28px 0" }}>
        <TeacherBrowser courses={courses} initialTeachers={teachers} />
      </section>
    </>
  );
}
