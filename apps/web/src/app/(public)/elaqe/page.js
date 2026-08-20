// Data
import { apiGet } from "@/lib/api";

// Components
import { ContactForm } from "@/components/site/ContactForm";
import { PageBanner } from "@/components/site/PageBanner";

// Utils / SEO
import { buildMetadata } from "@/lib/seo";
import { getT } from "@/lib/i18n/serverT";

export async function generateMetadata() {
  // Başlıq/təsvir seçilmiş dildə — əvvəl sabit azərbaycanca idi, ona görə
  // /en və /ru səhifələri AZ meta ilə indekslənirdi.
  const t = await getT();
  return buildMetadata({
    title: t("meta.contact.title"),
    description: t("meta.contact.desc"),
    path: "/elaqe",
  });
}

// ── Subcomponents ──

function ContactInfoCard({ icon, title, value }) {
  return (
    <div style={{ border: "1px solid #ECEDF2", borderRadius: 18, padding: 24, background: "#fff" }}>
      <span style={{ display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 13, background: "var(--accent-soft)", fontSize: 22 }}>{icon}</span>
      <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 16, color: "#16161C", margin: "16px 0 8px" }}>{title}</h3>
      <p style={{ fontSize: 14.5, color: "#63636F", lineHeight: 1.6, margin: 0 }}>{value}</p>
    </div>
  );
}

export default async function ContactPage() {
  const tr = await getT();
  // ── data fetching ──
  const [siteData, branchData] = await Promise.all([
    apiGet("/site"),
    apiGet("/branches"),
  ]);

  // ── derived values ──
  const c = siteData?.settings?.contact || {};
  const branches = branchData?.branches || [];

  const cards = [
    ["📍", tr("common.address"), c.address],
    ["☎", tr("common.phone"), [c.phone, c.phone2].filter(Boolean).join(" · ")],
    ["✉", tr("common.email"), c.email],
    ["🕐", tr("common.hours"), c.hours],
  ].filter(([, , v]) => v);

  // ── render ──
  return (
    <>
      <PageBanner
        title={tr("page.contact.title")}
        subtitle={tr("page.contact.sub")}
        mascot="contact"
      />

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 28px 0" }}>
        <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
          {cards.map(([ic, t, v]) => <ContactInfoCard key={t} icon={ic} title={t} value={v} />)}
        </div>

        <div className="split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginTop: 32, alignItems: "stretch" }}>
          <div className="img-slot" style={{ minHeight: 340, borderRadius: 22 }}>
            <span>{tr("common.mapSoon")}<br />(Google Maps embed)</span>
          </div>
          <ContactForm branches={branches} />
        </div>
      </section>
    </>
  );
}
