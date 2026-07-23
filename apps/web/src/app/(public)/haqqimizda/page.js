import { apiGetStatus, apiGet } from "@/lib/api";
import { metaFromApi } from "@/lib/seo";
import { ContentBlocks } from "@/components/site/ContentBlocks";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { ApplyButton } from "@/components/site/ApplyButton";

export async function generateMetadata() {
  const { data } = await apiGetStatus("/pages/haqqimizda");
  const p = data?.page;
  return metaFromApi(p?.seo || {}, {
    title: p?.title || "Haqqımızda",
    description: p?.lead || "British Academy — 2014-cü ildən dünya dillərini Azərbaycana öyrədən, English UK akkreditasiyalı dil mərkəzi.",
    path: "/haqqimizda",
  });
}

export default async function AboutPage() {
  const [{ data }, siteData] = await Promise.all([
    apiGetStatus("/pages/haqqimizda"),
    apiGet("/site"),
  ]);
  const p = data?.page || {};
  const stats = siteData?.settings?.stats || [];

  return (
    <>
      <section style={{ position: "relative", background: "var(--accent)", overflow: "hidden" }}>
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "56px 28px 60px" }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,.85)", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>Haqqımızda</span>
          <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(30px,4.6vw,50px)", letterSpacing: "-.025em", margin: "14px 0 0", lineHeight: 1.1, color: "#fff", maxWidth: 820 }}>
            {p.h1 || "2014-cü ildən dünya dillərini Azərbaycana öyrədirik"}
          </h1>
          {p.lead && <p style={{ fontSize: 19, color: "rgba(255,255,255,.9)", margin: "20px 0 0", maxWidth: 640, lineHeight: 1.6 }}>{p.lead}</p>}
        </div>
      </section>

      {stats.length > 0 && (
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 28px 0" }}>
          <div className="grid-4" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(stats.length, 4)},1fr)`, gap: 20 }}>
            {stats.map((s) => (
              <div key={s.label} style={{ border: "1px solid #ECEDF2", borderRadius: 20, padding: 28 }}>
                <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 40, color: "#14141C", letterSpacing: "-.02em" }}>{s.value}</div>
                <div style={{ fontSize: 14.5, color: "#63636F", marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ maxWidth: 900, margin: "0 auto", padding: "56px 28px 0" }}>
        {p.content?.length ? (
          <ContentBlocks blocks={p.content} />
        ) : (
          <p style={{ fontSize: 17, lineHeight: 1.85, color: "#3c3c47" }}>
            British Academy — “English UK” akkreditasiyasından keçmiş yeganə Azərbaycan şirkəti və rəsmi TOEFL beynəlxalq imtahan mərkəzidir. Böyük Britaniyada hazırlanmış xüsusi metodika ilə dilləri 4 dəfə sürətli öyrədirik.
          </p>
        )}
      </section>

      {(p.faq || []).length > 0 && (
        <section style={{ maxWidth: 900, margin: "48px auto 0", padding: "0 28px" }}>
          <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(24px,3vw,32px)", color: "#14141C", margin: "0 0 24px" }}>Tez-tez verilən suallar</h2>
          <FaqAccordion items={p.faq} />
        </section>
      )}

      <section style={{ maxWidth: 1200, margin: "64px auto 0", padding: "0 28px" }}>
        <div style={{ background: "#0C0D1A", borderRadius: 28, padding: "52px 40px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(26px,3.4vw,36px)", color: "#fff", margin: 0 }}>Bizimlə tanış ol</h2>
          <p style={{ fontSize: 16, color: "#B9BAD0", margin: "14px auto 26px", maxWidth: 520, lineHeight: 1.6 }}>Pulsuz sınaq dərsinə yazıl və mühitimizi yaxından gör.</p>
          <ApplyButton style={{ background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 16, padding: "15px 30px", borderRadius: 99, cursor: "pointer" }} />
        </div>
      </section>
    </>
  );
}
