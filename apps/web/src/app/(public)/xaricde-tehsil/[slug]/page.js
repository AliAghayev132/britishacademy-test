import { notFound } from "next/navigation";
import Link from "next/link";
import { apiGetStatus } from "@/lib/api";
import { metaFromApi } from "@/lib/seo";
import { ContentBlocks } from "@/components/site/ContentBlocks";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { ApplyButton } from "@/components/site/ApplyButton";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data } = await apiGetStatus(`/destinations/${slug}`);
  const d = data?.destination;
  if (!d) return {};
  return metaFromApi(d.seo, {
    title: d.isScholarship ? d.country : `${d.country}-də təhsil`,
    description: d.lead || `${d.country} — British Academy xaricdə təhsil dəstəyi.`,
    path: `/xaricde-tehsil/${slug}`,
  });
}

export default async function DestinationPage({ params }) {
  const { slug } = await params;
  const { data, status } = await apiGetStatus(`/destinations/${slug}`);
  if (status === 404 || !data?.destination) notFound();
  const d = data.destination;

  return (
    <>
      <section style={{ position: "relative", background: "var(--accent)", overflow: "hidden" }}>
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "30px 28px 60px" }}>
          <nav aria-label="Breadcrumb" style={{ fontSize: 13.5, color: "rgba(255,255,255,.8)" }}>
            <Link href="/xaricde-tehsil" style={{ color: "rgba(255,255,255,.8)" }}>Xaricdə təhsil</Link>
            <span style={{ opacity: 0.5 }}> / </span>
            <span style={{ color: "#fff", fontWeight: 600 }}>{d.country}</span>
          </nav>
          <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(30px,4.4vw,48px)", letterSpacing: "-.025em", margin: "18px 0 0", color: "#fff" }}>
            {d.isScholarship ? d.country : `${d.country}-də təhsil`}
          </h1>
          {(d.lead || d.tagline) && <p style={{ fontSize: 18, color: "rgba(255,255,255,.92)", margin: "16px 0 0", maxWidth: 660, lineHeight: 1.6 }}>{d.lead || d.tagline}</p>}
          <div style={{ marginTop: 28 }}>
            <ApplyButton interest={`Xaricdə təhsil — ${d.country}`} className="ba-btn-primary" style={{ background: "#fff", color: "var(--accent)", border: "none", fontWeight: 700, fontSize: 15, padding: "14px 26px", borderRadius: 99, cursor: "pointer" }} />
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 28px 0" }}>
        <div className="split" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 36, alignItems: "start" }}>
          <div>
            {d.content?.length ? (
              <ContentBlocks blocks={d.content} />
            ) : (
              <p style={{ fontSize: 16.5, lineHeight: 1.85, color: "#3c3c47" }}>
                {d.country} üzrə təfərrüatlı məlumat tezliklə əlavə olunacaq. Universitet seçimi, sənədlər və viza prosesi barədə məsləhət üçün bizimlə əlaqə saxla.
              </p>
            )}

            {(d.universities || []).length > 0 && (
              <>
                <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(22px,2.8vw,30px)", color: "#14141C", margin: "36px 0 16px" }}>Universitetlər</h2>
                <ul role="list" style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {d.universities.map((u, i) => (
                    <li key={i} style={{ display: "flex", gap: 11, fontSize: 16, color: "#3c3c47" }}>
                      <span style={{ color: "var(--accent)", fontWeight: 800 }}>🎓</span>
                      <span>{u.name}{u.city ? ` — ${u.city}` : ""}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {(d.facts || []).length > 0 && (
            <aside style={{ border: "1px solid #ECEDF2", borderRadius: 20, padding: 26, background: "#FAFBFF" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#9A9AA6", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 16 }}>Qısa məlumat</div>
              {d.facts.map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid #ECEDF2", fontSize: 15 }}>
                  <span style={{ color: "#63636F" }}>{f.label}</span>
                  <span style={{ color: "#16161C", fontWeight: 600 }}>{f.value}</span>
                </div>
              ))}
            </aside>
          )}
        </div>
      </section>

      {(d.faq || []).length > 0 && (
        <section style={{ maxWidth: 900, margin: "56px auto 0", padding: "0 28px" }}>
          <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(24px,3vw,32px)", color: "#14141C", margin: "0 0 24px" }}>Tez-tez verilən suallar</h2>
          <FaqAccordion items={d.faq} />
        </section>
      )}
    </>
  );
}
