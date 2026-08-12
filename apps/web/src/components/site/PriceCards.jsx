"use client";

import { LocaleLink as Link } from "./LocaleLink";
import { useT } from "@/lib/i18n/useT";

// ── Constants ──
const CC = ["#2E6BE6", "#12B5A5", "#7C4DFF", "#E0533D"];

// ── Subcomponents ──
function CustomPricing({ course }) {
  const rows = course.customPricing || [];
  return (
    <>
      <div style={{ border: "1px solid #ECEDF2", borderRadius: 20, background: "#fff", overflow: "hidden", maxWidth: 720 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "16px 24px", borderBottom: i < rows.length - 1 ? "1px solid #ECEDF2" : "none" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#33333D" }}>{r.label}</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--accent)", whiteSpace: "nowrap" }}>{r.value}</span>
          </div>
        ))}
      </div>
      {course.pricingNote && (
        <p style={{ fontSize: 14.5, color: "#33333D", margin: "18px 0 0", padding: "13px 16px", background: "var(--accent-soft)", borderRadius: 12, fontWeight: 600 }}>{course.pricingNote}</p>
      )}
    </>
  );
}

function BranchPriceCard({ p, cc, teachers }) {
  const t = useT();
  const b = p.branch;
  return (
    <div className="ba-pricecard" style={{ "--c": cc }}>
      <div className="ba-pricecard-head">
        <span className="ba-pricecard-name">{b?.name}</span>
        <span className="ba-pricecard-addr">{b?.address}{b?.metro ? ` · ${b.metro}` : ""}</span>
      </div>
      <table className="ba-ptable">
        <thead>
          <tr>
            <th scope="col"><span className="ba-sr">{t("price.time")}</span></th>
            <th scope="col">{t("price.groupLabel")} <span>{t("price.group")}</span></th>
            <th scope="col">{t("price.individual")} <span>{t("price.onePerson")}</span></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{t("price.day")} <span>09:00–17:00</span></th>
            <td>{p.group?.day} <i>{t("svc.perMonth")}</i></td>
            <td>{p.individual?.day} <i>{t("svc.perMonth")}</i></td>
          </tr>
          <tr>
            <th scope="row">{t("price.evening")} <span>{t("price.afterEvening")}</span></th>
            <td>{p.group?.evening} <i>{t("svc.perMonth")}</i></td>
            <td>{p.individual?.evening} <i>{t("svc.perMonth")}</i></td>
          </tr>
        </tbody>
      </table>
      {teachers.length > 0 && (
        <div className="ba-pricecard-t">
          <span className="ba-pricecard-tlabel">{t("price.teachesHere")}</span>
          <span style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {teachers.map((t) => (
              <Link key={t._id} href={`/muellimler/${t.slug}`} title={t.title} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#F5F6FA", borderRadius: 99, padding: "4px 12px 4px 4px" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: t.color || "#2E6BE6", color: "#fff", fontSize: 11.5, fontWeight: 700, display: "grid", placeItems: "center", flex: "none" }}>{(t.fullName || "?").charAt(0)}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#4a4a55" }}>{t.fullName}</span>
              </Link>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Per-branch price cards: group/individual × day/evening matrix plus the
 * teachers who run the course at that branch (from teachersByBranch).
 */
export function PriceCards({ course, teachersByBranch = [] }) {
  const t = useT();
  // ── Custom pricing mode ──
  if (course.pricingMode === "custom") {
    return <CustomPricing course={course} />;
  }

  // ── Derived values ──
  const teachersFor = (branchId) =>
    teachersByBranch.find((tt) => String(tt.branch._id) === String(branchId))?.teachers || [];

  // ── Render ──
  return (
    <>
      <p style={{ fontSize: 15.5, color: "#63636F", margin: "0 0 24px" }}>
        {t("price.intro")}
      </p>
      <div className="ba-pricegrid">
        {course.pricing.map((p, i) => {
          const cc = CC[i % CC.length];
          const teachers = teachersFor(p.branch?._id);
          return <BranchPriceCard key={i} p={p} cc={cc} teachers={teachers} />;
        })}
      </div>
    </>
  );
}
