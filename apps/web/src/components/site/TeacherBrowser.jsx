"use client";

// React
import { memo, useCallback, useState } from "react";
// Next
import Link from "next/link";
// Data (RTK Query)
import { useGetTeachersQuery } from "@/store/api/publicApi";
// Local
import { SiteSelect } from "./SiteSelect";

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

const inputStyle = {
  border: "1.5px solid #E4E6EF", borderRadius: 11, padding: "11px 14px",
  fontSize: 14.5, fontFamily: "inherit", color: "#14141C", background: "#fff", width: "100%",
};

const FilterBar = memo(function FilterBar({ courses, course, name, onName, onCourse, onReset, hasFilter }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 28 }}>
      {/* Name search */}
      <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220, maxWidth: 360 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#63636E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Müəllim adı ilə axtar…"
          className="ba-field"
          style={{ ...inputStyle, paddingLeft: 42 }}
        />
      </div>
      {/* Course filter */}
      <div style={{ flex: "0 1 260px", minWidth: 220 }}>
        <SiteSelect
          value={course}
          onChange={onCourse}
          placeholder="Bütün kurslar"
          style={inputStyle}
          options={courses.map((c) => ({ value: c.slug, label: c.title }))}
        />
      </div>
      {hasFilter && (
        <button onClick={onReset} style={{ ...chip(false), fontWeight: 600, color: "#63636F" }}>
          Sıfırla
        </button>
      )}
    </div>
  );
});

// Azerbaijani-tolerant lowercase for the client-side name match.
const norm = (s) => (s || "").toLocaleLowerCase("az");

/**
 * Teacher grid with a course filter. Server passes the initial (unfiltered)
 * teacher list + the course options; picking a course refetches via RTK Query
 * (`/api/teachers?course=<slug>`), so the first paint is SSR and instant.
 */
export function TeacherBrowser({ courses = [], initialTeachers = [] }) {
  // ── State / data ──
  const [course, setCourse] = useState("");
  const [name, setName] = useState("");
  const { data, isFetching } = useGetTeachersQuery(
    course ? { course } : {},
    { skip: !course }, // no request until a course is chosen — use SSR data
  );

  // ── Derived ──
  // Course filter is server-side (SSR list or /teachers?course=…); the name
  // filter is applied client-side on top of whichever list is showing.
  const base = course ? data?.data?.teachers || [] : initialTeachers;
  const q = norm(name.trim());
  const teachers = q ? base.filter((t) => norm(t.fullName).includes(q)) : base;
  const hasFilter = Boolean(course || name.trim());

  // ── Handlers ──
  const handleReset = useCallback(() => { setCourse(""); setName(""); }, []);
  const handleCourse = useCallback((v) => setCourse(v), []);
  const handleName = useCallback((v) => setName(v), []);

  // ── Render ──
  return (
    <>
      {courses.length > 0 && (
        <FilterBar
          courses={courses}
          course={course}
          name={name}
          onName={handleName}
          onCourse={handleCourse}
          onReset={handleReset}
          hasFilter={hasFilter}
        />
      )}

      {teachers.length === 0 ? (
        <p style={{ color: "#63636F", padding: "30px 0" }}>
          {hasFilter ? "Axtarışa uyğun müəllim tapılmadı." : "Hələ müəllim əlavə edilməyib."}
        </p>
      ) : (
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, opacity: isFetching ? 0.6 : 1, transition: "opacity .15s" }}>
          {teachers.map((t) => <TeacherCard key={t._id} t={t} />)}
        </div>
      )}
    </>
  );
}
