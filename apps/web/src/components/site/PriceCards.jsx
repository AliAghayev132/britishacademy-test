import Link from "next/link";

const CC = ["#2E6BE6", "#12B5A5", "#7C4DFF", "#E0533D"];

/**
 * Per-branch price cards: group/individual × day/evening matrix plus the
 * teachers who run the course at that branch (from teachersByBranch).
 */
export function PriceCards({ course, teachersByBranch = [] }) {
  if (course.pricingMode === "custom") {
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

  const teachersFor = (branchId) =>
    teachersByBranch.find((t) => String(t.branch._id) === String(branchId))?.teachers || [];

  return (
    <>
      <p style={{ fontSize: 15.5, color: "#63636F", margin: "0 0 24px" }}>
        Qiymət filiala, dərs formatına (qrup / fərdi) və saata görə dəyişir. Axşam qrupları — qrup dərsi üçün +10 AZN, fərdi dərs üçün +20 AZN.
      </p>
      <div className="ba-pricegrid">
        {course.pricing.map((p, i) => {
          const cc = CC[i % CC.length];
          const b = p.branch;
          const teachers = teachersFor(b?._id);
          return (
            <div key={i} className="ba-pricecard" style={{ "--c": cc }}>
              <div className="ba-pricecard-head">
                <span className="ba-pricecard-name">{b?.name}</span>
                <span className="ba-pricecard-addr">{b?.address}{b?.metro ? ` · ${b.metro}` : ""}</span>
              </div>
              <table className="ba-ptable">
                <thead>
                  <tr>
                    <th scope="col"><span className="ba-sr">Vaxt</span></th>
                    <th scope="col">Qrup <span>3–6 nəfər</span></th>
                    <th scope="col">Fərdi <span>1 nəfər</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Gündüz <span>09:00–17:00</span></th>
                    <td>{p.group?.day} <i>AZN/ay</i></td>
                    <td>{p.individual?.day} <i>AZN/ay</i></td>
                  </tr>
                  <tr>
                    <th scope="row">Axşam <span>17:00-dan sonra</span></th>
                    <td>{p.group?.evening} <i>AZN/ay</i></td>
                    <td>{p.individual?.evening} <i>AZN/ay</i></td>
                  </tr>
                </tbody>
              </table>
              {teachers.length > 0 && (
                <div className="ba-pricecard-t">
                  <span className="ba-pricecard-tlabel">Bu filialda dərs deyir</span>
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
        })}
      </div>
    </>
  );
}
