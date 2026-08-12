// Data
import { apiGet } from "@/lib/api";

// Components
import { PageBanner } from "@/components/site/PageBanner";
import { CtaBand } from "@/components/site/CtaBand";

// Utils / SEO
import { buildMetadata, SITE_NAME } from "@/lib/seo";
import { getT } from "@/lib/i18n/serverT";

export async function generateMetadata() {
  return buildMetadata({
    title: "Filiallar",
    description:
      "British Academy filialları — Caspian Plaza, Nərimanov, Əhmədli və Elmlər Akademiyası. Ünvan, telefon, iş saatları və WhatsApp.",
    path: "/filiallar",
  });
}

const CC = ["#2E6BE6", "#12B5A5", "#7C4DFF", "#E0533D"];

// ── Subcomponents ──

function BranchCard({ branch, accent, tr }) {
  const b = branch;
  const cc = accent;
  return (
    <div className="ba-pricecard" style={{ "--c": cc }}>
      <div className="ba-pricecard-head">
        <span className="ba-pricecard-name" style={{ fontSize: 19 }}>{b.name} {b.isMain && <span style={{ fontSize: 11, fontWeight: 800, color: cc, background: `${cc}1a`, padding: "3px 9px", borderRadius: 99, verticalAlign: "middle", marginLeft: 6 }}>{tr("branch.main")}</span>}</span>
        <span className="ba-pricecard-addr">📍 {b.address}{b.metro ? ` · ${b.metro}` : ""}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14.5, color: "#4a4a55" }}>
        {b.district && <span>🏙 {b.district}</span>}
        {b.phone && <span>☎ {b.phone}</span>}
        {(b.workingHours || []).map((w, j) => <span key={j}>🕐 {w.days} {w.from}–{w.to}</span>)}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {b.whatsapp && (
          <a href={`https://wa.me/${b.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 14, padding: 12, borderRadius: 12 }}>WhatsApp</a>
        )}
        {b.phone && (
          <a href={`tel:${b.phone.replace(/[^+\d]/g, "")}`} style={{ flex: 1, textAlign: "center", background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 14, padding: 12, borderRadius: 12 }}>{tr("common.callNow")}</a>
        )}
      </div>
    </div>
  );
}

/** Full-width map placeholder below the branch grid (mirrors the static site). */
function BranchMap({ branches, tr }) {
  const embed = branches.find((b) => b.mapEmbedUrl)?.mapEmbedUrl;
  if (embed) {
    return (
      <iframe
        src={embed}
        title={tr("page.branchesMap")}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        style={{ width: "100%", minHeight: 340, border: 0, borderRadius: 22, marginTop: 24, display: "block" }}
      />
    );
  }
  return (
    <div className="img-slot" style={{ minHeight: 340, borderRadius: 22, marginTop: 24 }}>
      <span>{tr("common.mapSoon")}<br />{tr("page.mapNote")}</span>
    </div>
  );
}

export default async function BranchesPage() {
  const tr = await getT();
  // ── data fetching ──
  const data = await apiGet("/branches");
  const branches = data?.branches || [];

  // ── JSON-LD ── ItemList of branch EducationalOrganizations
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: branches.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "EducationalOrganization",
        name: `${SITE_NAME} — ${b.name}`,
        address: { "@type": "PostalAddress", streetAddress: b.address, addressLocality: "Bakı", addressCountry: "AZ" },
        telephone: b.phone || undefined,
      },
    })),
  };

  // ── render ──
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      <PageBanner
        title={tr("page.branches.title")}
        subtitle={tr("page.branches.sub")}
        mascot="filiallar"
      />

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 28px 0" }}>
        <div className="grid-2 ba-pricegrid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 18 }}>
          {branches.map((b, i) => <BranchCard key={b._id} branch={b} accent={CC[i % CC.length]} tr={tr} />)}
        </div>
        <BranchMap branches={branches} tr={tr} />
      </section>

      <CtaBand />
    </>
  );
}
