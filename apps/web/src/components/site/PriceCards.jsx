"use client";

// Lib
import { useLocale, useT } from "@/lib";

// Utils
import { metroLabel } from "@/utils";

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

function BranchPriceCard({ p, cc }) {
  const t = useT();
  const locale = useLocale();
  const b = p.branch;
  return (
    <div className="ba-pricecard" style={{ "--c": cc }}>
      <div className="ba-pricecard-head">
        <span className="ba-pricecard-name">{b?.name}</span>
        <span className="ba-pricecard-addr">{b?.address}{b?.metro ? ` · ${metroLabel(b.metro, locale)}` : ""}</span>
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
    </div>
  );
}

/**
 * Per-branch price cards: group/individual × day/evening matrix.
 *
 * Müəllim çipləri buradan çıxarıldı — filial üzrə müəllim bölgüsü artıq API-də
 * yoxdur; müəllimlər kurs səhifəsində ayrı bölmədə göstərilir.
 */
export function PriceCards({ course }) {
  const t = useT();
  // ── Custom pricing mode ──
  if (course.pricingMode === "custom") {
    return <CustomPricing course={course} />;
  }

  // ── Render ──
  return (
    <>
      <p style={{ fontSize: 15.5, color: "#63636F", margin: "0 0 24px" }}>
        {t("price.intro")}
      </p>
      <div className="ba-pricegrid">
        {course.pricing.map((p, i) => (
          <BranchPriceCard key={i} p={p} cc={CC[i % CC.length]} />
        ))}
      </div>
    </>
  );
}
