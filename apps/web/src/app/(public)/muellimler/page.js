import { apiGet } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";
import { PageBanner } from "@/components/site/PageBanner";
import { TeacherBrowser } from "@/components/site/TeacherBrowser";

export const metadata = buildMetadata({
  title: "Müəllimlər",
  description:
    "British Academy müəllimləri — IELTS 8.0–8.5 sertifikatlı, xaricdə təhsil almış, beynəlxalq təcrübəli müəllim heyəti. Kursa görə süz.",
  path: "/muellimler",
});

export default async function TeachersPage() {
  const [teacherData, courseData] = await Promise.all([
    apiGet("/teachers"),
    apiGet("/courses"),
  ]);
  const teachers = teacherData?.teachers || [];
  const courses = courseData?.courses || [];

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
