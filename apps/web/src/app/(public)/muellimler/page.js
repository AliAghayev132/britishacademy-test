import Link from "next/link";
import { apiGet } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Müəllimlər",
  description:
    "British Academy müəllimləri — IELTS 8.0–8.5 sertifikatlı, xaricdə təhsil almış, beynəlxalq təcrübəli müəllim heyəti.",
  path: "/muellimler",
});

export default async function TeachersPage() {
  const data = await apiGet("/teachers");
  const teachers = data?.teachers || [];

  return (
    <>
      <section style={{ position: "relative", background: "var(--accent)", overflow: "hidden" }}>
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "56px 28px 60px" }}>
          <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(32px,4.6vw,50px)", letterSpacing: "-.025em", margin: 0, color: "#fff" }}>Müəllimlərimiz</h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,.92)", margin: "16px 0 0", maxWidth: 640, lineHeight: 1.6 }}>
            Beynəlxalq sertifikatlı, təcrübəli müəllim heyəti.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 28px 0" }}>
        <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
          {teachers.map((t) => (
            <Link key={t._id} href={`/muellimler/${t.slug}`} className="ba-course" style={{ display: "block", background: "#fff", border: "1px solid #ECEDF2", borderRadius: 20, padding: 24, textAlign: "center", "--accent": t.color, "--accent-soft": `${t.color}1f` }}>
              <span className="ba-av" style={{ "--c": t.color, width: 84, height: 84, fontSize: 32, margin: "0 auto" }}>
                {t.photo ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={t.photo} alt={t.fullName} />) : <span>{(t.fullName || "?").charAt(0)}</span>}
              </span>
              <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 18, margin: "16px 0 0", color: "#16161C" }}>{t.fullName}</h3>
              <p style={{ fontSize: 13.5, color: t.color, fontWeight: 600, margin: "6px 0 0" }}>{t.title}</p>
              {(t.branches || []).length > 0 && (
                <p style={{ fontSize: 12.5, color: "#9A9AA6", margin: "10px 0 0" }}>{t.branches.map((b) => b.name || "").filter(Boolean).join(" · ")}</p>
              )}
              <span style={{ display: "inline-block", marginTop: 14, color: "var(--accent)", fontWeight: 700, fontSize: 13.5 }}>Profilə bax →</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
