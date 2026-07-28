// Data
import { apiGetStatus, apiGet } from "@/lib/api";

// Components
import { ContentBlocks } from "@/components/site/ContentBlocks";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { ApplyButton } from "@/components/site/ApplyButton";
import { PageBanner } from "@/components/site/PageBanner";

// Utils / SEO
import { metaFromApi } from "@/lib/seo";

export async function generateMetadata() {
  const { data } = await apiGetStatus("/pages/haqqimizda");
  const p = data?.page;
  return metaFromApi(p?.seo || {}, {
    title: p?.title || "Haqqımızda",
    description: p?.lead || "British Academy — 2014-cü ildən dünya dillərini Azərbaycana öyrədən, English UK akkreditasiyalı dil mərkəzi.",
    path: "/haqqimizda",
  });
}

// ── Subcomponents ──

function StatCard({ stat }) {
  return (
    <div style={{ border: "1px solid #ECEDF2", borderRadius: 20, padding: 28 }}>
      <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 40, color: "#14141C", letterSpacing: "-.02em" }}>{stat.value}</div>
      <div style={{ fontSize: 14.5, color: "#63636F", marginTop: 6 }}>{stat.label}</div>
    </div>
  );
}

export default async function AboutPage() {
  // ── data fetching ──
  const [{ data }, siteData] = await Promise.all([
    apiGetStatus("/pages/haqqimizda"),
    apiGet("/site"),
  ]);

  // ── derived values ──
  const p = data?.page || {};
  const stats = siteData?.settings?.stats || [];

  // ── render ──
  return (
    <>
      <PageBanner
        eyebrow="Haqqımızda"
        title={p.h1 || "2014-cü ildən dünya dillərini Azərbaycana öyrədirik"}
        subtitle={p.lead}
        mascot="about"
      />

      {stats.length > 0 && (
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 28px 0" }}>
          <div className="grid-4" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(stats.length, 4)},1fr)`, gap: 20 }}>
            {stats.map((s) => <StatCard key={s.label} stat={s} />)}
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
