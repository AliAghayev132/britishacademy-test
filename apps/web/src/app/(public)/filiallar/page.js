// Data
import { apiGet } from "@/lib/api";

// Components
import { PageBanner } from "@/components/site/PageBanner";
import { CtaBand } from "@/components/site/CtaBand";

// Utils / SEO
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Filiallar",
  description:
    "British Academy filialları — Caspian Plaza, Nərimanov, Əhmədli və Elmlər Akademiyası. Ünvan, telefon, iş saatları və WhatsApp.",
  path: "/filiallar",
});

const CC = ["#2E6BE6", "#12B5A5", "#7C4DFF", "#E0533D"];

// ── Subcomponents ──

function BranchCard({ branch, accent }) {
  const b = branch;
  const cc = accent;
  return (
    <div className="ba-pricecard" style={{ "--c": cc }}>
      <div className="ba-pricecard-head">
        <span className="ba-pricecard-name" style={{ fontSize: 19 }}>{b.name} {b.isMain && <span style={{ fontSize: 11, fontWeight: 800, color: cc, background: `${cc}1a`, padding: "3px 9px", borderRadius: 99, verticalAlign: "middle", marginLeft: 6 }}>MƏRKƏZ</span>}</span>
        <span className="ba-pricecard-addr">📍 {b.address}{b.metro ? ` · ${b.metro}` : ""}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14.5, color: "#4a4a55" }}>
        {b.phone && <span>☎ {b.phone}</span>}
        {(b.workingHours || []).map((w, j) => <span key={j}>🕐 {w.days} {w.from}–{w.to}</span>)}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        {b.whatsapp && (
          <a href={`https://wa.me/${b.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 13.5, padding: "10px 18px", borderRadius: 99 }}>WhatsApp</a>
        )}
        {b.phone && (
          <a href={`tel:${b.phone.replace(/[^+\d]/g, "")}`} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 700, fontSize: 13.5, padding: "10px 18px", borderRadius: 99 }}>Zəng et</a>
        )}
      </div>
    </div>
  );
}

export default async function BranchesPage() {
  // ── data fetching ──
  const data = await apiGet("/branches");
  const branches = data?.branches || [];

  // ── render ──
  return (
    <>
      <PageBanner
        title="Filiallar"
        subtitle={`Bakının ${branches.length} nöqtəsində — sənə ən yaxın filialı seç.`}
        mascot="filiallar"
      />

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 28px 0" }}>
        <div className="grid-2 ba-pricegrid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 18 }}>
          {branches.map((b, i) => <BranchCard key={b._id} branch={b} accent={CC[i % CC.length]} />)}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
