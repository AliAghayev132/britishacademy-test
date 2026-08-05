"use client";

// React
import { memo, useCallback, useState } from "react";
// Next
import Link from "next/link";
// Data (RTK Query)
import { useGetTeachersQuery } from "@/store/api/publicApi";

// ── Constants ──
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

// ── Helpers ──
// Badge text: certificate title → first segment of title before "·" → none.
function badgeText(t) {
  const cert = t.certificates?.[0]?.title;
  if (cert && cert.trim()) return cert.trim();
  const first = (t.title || "").split("·")[0].trim();
  return first || "";
}

// ── Subcomponents ──
// Portrait card mirroring the static `.mt-card` design.
const TeacherCard = memo(function TeacherCard({ t }) {
  const badge = badgeText(t);
  return (
    <Link
      href={`/muellimler/${t.slug}`}
      className="mt-card"
      style={{ display: "block", background: "#fff", border: "1px solid #ECEDF2", borderRadius: 22, overflow: "hidden", "--accent": t.color }}
    >
      {/* Portrait image area */}
      <div style={{ position: "relative", aspectRatio: "4 / 4.4", overflow: "hidden", background: "#EEF0F6" }}>
        {t.photo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            className="mt-img"
            src={t.photo}
            alt={t.fullName}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform .35s ease" }}
          />
        ) : (
          <div
            className="mt-img"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "grid", placeItems: "center", background: t.color, transition: "transform .35s ease" }}
          >
            <span style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 72, color: "#fff", lineHeight: 1 }}>
              {(t.fullName || "?").charAt(0)}
            </span>
          </div>
        )}
        {badge && (
          <span style={{ position: "absolute", top: 14, left: 14, background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 99 }}>
            {badge}
          </span>
        )}
      </div>

      {/* Bottom row: name + subject on the left, arrow on the right */}
      <div style={{ padding: "22px 22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 20, margin: 0, color: "#17171F" }}>{t.fullName}</h3>
          {t.title && <div style={{ fontSize: 14, color: "#63636F", marginTop: 4 }}>{t.title}</div>}
        </div>
        <span className="mt-arrow" style={{ width: 40, height: 40, flex: "none", borderRadius: "50%", background: "#F1F2F6", color: "#4C4C58", display: "grid", placeItems: "center", transition: ".25s", fontSize: 18 }}>→</span>
      </div>
    </Link>
  );
});

const FilterBar = memo(function FilterBar({ courses, course, onReset, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 28 }}>
      <span style={{ fontWeight: 700, fontSize: 14.5, color: "#63636F" }}>Kursa görə süz:</span>
      <button
        onClick={onReset}
        style={chip(!course)}
      >
        Hamısı
      </button>
      <select
        value={course}
        onChange={onChange}
        className="ba-field"
        style={{ border: "1.5px solid #E4E6EF", borderRadius: 11, padding: "9px 14px", fontSize: 14.5, fontFamily: "inherit", cursor: "pointer", color: "#14141C", background: "#fff", minWidth: 220 }}
      >
        <option value="">Kurs seç…</option>
        {courses.map((c) => (
          <option key={c._id} value={c.slug}>{c.title}</option>
        ))}
      </select>
    </div>
  );
});

/**
 * Teacher grid with a course filter. Server passes the initial (unfiltered)
 * teacher list + the course options; picking a course refetches via RTK Query
 * (`/api/teachers?course=<slug>`), so the first paint is SSR and instant.
 */
export function TeacherBrowser({ courses = [], initialTeachers = [] }) {
  // ── State / data ──
  const [course, setCourse] = useState("");
  const { data, isFetching } = useGetTeachersQuery(
    course ? { course } : {},
    { skip: !course }, // no request until a filter is chosen — use SSR data
  );

  // ── Derived ──
  const teachers = course ? data?.data?.teachers || [] : initialTeachers;

  // ── Handlers ──
  const handleReset = useCallback(() => setCourse(""), []);
  const handleChange = useCallback((e) => setCourse(e.target.value), []);

  // ── Render ──
  return (
    <>
      {courses.length > 0 && (
        <FilterBar courses={courses} course={course} onReset={handleReset} onChange={handleChange} />
      )}

      {teachers.length === 0 ? (
        <p style={{ color: "#63636F", padding: "30px 0" }}>Bu kurs üzrə müəllim tapılmadı.</p>
      ) : (
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, opacity: isFetching ? 0.6 : 1, transition: "opacity .15s" }}>
          {teachers.map((t) => <TeacherCard key={t._id} t={t} />)}
        </div>
      )}
    </>
  );
}
