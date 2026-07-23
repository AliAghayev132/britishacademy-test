import { apiGet } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata = buildMetadata({
  title: "Əlaqə",
  description:
    "British Academy ilə əlaqə — ünvan, telefon, e-poçt və iş saatları. Sualların üçün bizə yaz.",
  path: "/elaqe",
});

export default async function ContactPage() {
  const [siteData, branchData] = await Promise.all([
    apiGet("/site"),
    apiGet("/branches"),
  ]);
  const c = siteData?.settings?.contact || {};
  const branches = branchData?.branches || [];

  const cards = [
    ["📍", "Ünvan", c.address],
    ["☎", "Telefon", [c.phone, c.phone2].filter(Boolean).join(" · ")],
    ["✉", "E-poçt", c.email],
    ["🕐", "İş saatları", c.hours],
  ].filter(([, , v]) => v);

  return (
    <>
      <section style={{ position: "relative", background: "var(--accent)", overflow: "hidden" }}>
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "56px 28px 60px" }}>
          <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(32px,4.6vw,50px)", letterSpacing: "-.025em", margin: 0, color: "#fff" }}>Əlaqə</h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,.92)", margin: "16px 0 0", maxWidth: 640, lineHeight: 1.6 }}>
            Sualların var? Bizimlə əlaqə saxla — komandamız kömək etməyə hazırdır.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 28px 0" }}>
        <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
          {cards.map(([ic, t, v]) => (
            <div key={t} style={{ border: "1px solid #ECEDF2", borderRadius: 18, padding: 24, background: "#fff" }}>
              <span style={{ display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 13, background: "var(--accent-soft)", fontSize: 22 }}>{ic}</span>
              <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 16, color: "#16161C", margin: "16px 0 8px" }}>{t}</h3>
              <p style={{ fontSize: 14.5, color: "#63636F", lineHeight: 1.6, margin: 0 }}>{v}</p>
            </div>
          ))}
        </div>

        <div className="split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginTop: 32, alignItems: "stretch" }}>
          <div className="img-slot" style={{ minHeight: 340, borderRadius: 22 }}>
            <span>Xəritə buraya əlavə olunacaq<br />(Google Maps embed)</span>
          </div>
          <ContactForm branches={branches} />
        </div>
      </section>
    </>
  );
}
