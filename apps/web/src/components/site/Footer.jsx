import Link from "next/link";

const col = (title, links) => (
  <div>
    <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 18 }}>{title}</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14.5 }}>
      {links.map(([label, href]) => (
        <Link key={label + href} href={href} className="ba-flink">{label}</Link>
      ))}
    </div>
  </div>
);

/** Site footer. Pure render (no hooks) so it stays a Server Component. */
export function Footer({ site }) {
  const s = site || {};
  const c = s.contact || {};
  const soc = s.socials || {};
  return (
    <footer style={{ position: "relative", background: "#0C0D1A", color: "#C4C5D6", overflow: "visible", marginTop: 70 }}>
      <div style={{ height: 5, background: "var(--accent)" }} />
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translate(-50%,-50%)", zIndex: 5, width: 104, height: 104, borderRadius: "50%", background: "#fff", border: "7px solid #0C0D1A", display: "grid", placeItems: "center", boxShadow: "0 14px 36px rgba(0,0,0,.45)", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.brand?.badge || "/assets/badge11.png"} alt="11 il sizinlə" style={{ width: 74, height: "auto" }} />
      </div>
      <div className="footer-grid" style={{ position: "relative", zIndex: 2, maxWidth: 1240, margin: "0 auto", padding: "64px 28px 20px", display: "grid", gridTemplateColumns: "1.7fr 1fr 1fr 1fr", gap: 36 }}>
        <div>
          <div style={{ display: "inline-block", background: "#fff", borderRadius: 14, padding: "14px 18px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.brand?.logoStack || "/assets/logo-stack.png"} alt="British Academy" style={{ height: 74, width: "auto" }} />
          </div>
          <p style={{ fontSize: 14.5, lineHeight: 1.65, margin: "20px 0 0", maxWidth: 330, color: "#9A9BB0" }}>
            English UK akkreditasiyasından keçmiş yeganə Azərbaycan şirkəti. 2014-cü ildən keyfiyyətli dil təhsili və xaricdə təhsil.
          </p>
          <div style={{ fontSize: 14, color: "#8788A0", marginTop: 20, lineHeight: 1.75 }}>
            {c.address}<br />{c.phone}{c.phone2 ? ` · ${c.phone2}` : ""}<br />{c.email}
          </div>
        </div>
        {col("Kurslar", [["Dil Kursları", "/kurslar/dil-kurslari"], ["Beynəlxalq imtahanlar", "/kurslar/imtahanlar"], ["Kompüter Kursu", "/kurslar/komputer"], ["Karyera kursları", "/kurslar/karyera"]])}
        {col("Akademiya", [["Haqqımızda", "/haqqimizda"], ["Filiallar", "/filiallar"], ["Xaricdə təhsil", "/xaricde-tehsil"], ["Müəllimlər", "/muellimler"], ["Tələbələrimiz", "/telebelerimiz"]])}
        {col("Əlaqə", [["Instagram", soc.instagram || "#"], ["Facebook", soc.facebook || "#"], ["YouTube", soc.youtube || "#"], ["Əlaqə", "/elaqe"], ["Bloq", "/bloq"]])}
      </div>
      <div style={{ position: "relative", zIndex: 2, borderTop: "1px solid rgba(255,255,255,.1)", marginTop: 24 }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "22px 28px", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#7B7C94" }}>
          <span>© 2014–2026 British Academy. Bütün hüquqlar qorunur.</span>
          <span>English UK · Cambridge · British Council · Duolingo · TOEFL</span>
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 1, lineHeight: 0.74, textAlign: "center", marginTop: 4, overflow: "hidden" }}>
        <div style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: "clamp(40px,9.5vw,124px)", color: "var(--accent-wm)", letterSpacing: "-.03em", whiteSpace: "nowrap", transform: "translateY(12%)" }}>British Academy</div>
      </div>
    </footer>
  );
}
