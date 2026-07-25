"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetTeachersQuery } from "@/store/api/publicApi";

function TeacherCard({ t }) {
  return (
    <Link
      href={`/muellimler/${t.slug}`}
      className="ba-course"
      style={{ display: "block", background: "#fff", border: "1px solid #ECEDF2", borderRadius: 20, padding: 24, textAlign: "center", "--accent": t.color, "--accent-soft": `${t.color}1f` }}
    >
      <span className="ba-av" style={{ "--c": t.color, width: 84, height: 84, fontSize: 32, margin: "0 auto" }}>
        {t.photo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={t.photo} alt={t.fullName} />
        ) : (
          <span>{(t.fullName || "?").charAt(0)}</span>
        )}
      </span>
      <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 18, margin: "16px 0 0", color: "#16161C" }}>{t.fullName}</h3>
      <p style={{ fontSize: 13.5, color: t.color, fontWeight: 600, margin: "6px 0 0" }}>{t.title}</p>
      {(t.branches || []).length > 0 && (
        <p style={{ fontSize: 12.5, color: "#9A9AA6", margin: "10px 0 0" }}>
          {t.branches.map((b) => b.name || "").filter(Boolean).join(" · ")}
        </p>
      )}
      <span style={{ display: "inline-block", marginTop: 14, color: "var(--accent)", fontWeight: 700, fontSize: 13.5 }}>Profilə bax →</span>
    </Link>
  );
}

/**
 * Teacher grid with a course filter. Server passes the initial (unfiltered)
 * teacher list + the course options; picking a course refetches via RTK Query
 * (`/api/teachers?course=<slug>`), so the first paint is SSR and instant.
 */
export function TeacherBrowser({ courses = [], initialTeachers = [] }) {
  const [course, setCourse] = useState("");
  const { data, isFetching } = useGetTeachersQuery(
    course ? { course } : {},
    { skip: !course }, // no request until a filter is chosen — use SSR data
  );
  const teachers = course ? data?.data?.teachers || [] : initialTeachers;

  return (
    <>
      {courses.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <span style={{ fontWeight: 700, fontSize: 14.5, color: "#63636F" }}>Kursa görə süz:</span>
          <button
            onClick={() => setCourse("")}
            style={chip(!course)}
          >
            Hamısı
          </button>
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="ba-field"
            style={{ border: "1.5px solid #E4E6EF", borderRadius: 11, padding: "9px 14px", fontSize: 14.5, fontFamily: "inherit", cursor: "pointer", color: "#14141C", background: "#fff", minWidth: 220 }}
          >
            <option value="">Kurs seç…</option>
            {courses.map((c) => (
              <option key={c._id} value={c.slug}>{c.title}</option>
            ))}
          </select>
        </div>
      )}

      {teachers.length === 0 ? (
        <p style={{ color: "#63636F", padding: "30px 0" }}>Bu kurs üzrə müəllim tapılmadı.</p>
      ) : (
        <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, opacity: isFetching ? 0.6 : 1, transition: "opacity .15s" }}>
          {teachers.map((t) => <TeacherCard key={t._id} t={t} />)}
        </div>
      )}
    </>
  );
}

const chip = (active) => ({
  padding: "9px 18px",
  borderRadius: 99,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  border: "1px solid",
  borderColor: active ? "var(--accent)" : "#E4E6EF",
  background: active ? "var(--accent)" : "#fff",
  color: active ? "#fff" : "#4C4C58",
});
