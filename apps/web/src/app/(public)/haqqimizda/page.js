// Data
import { apiGetStatus, apiGet } from "@/lib/api";
import DOMPurify from "isomorphic-dompurify";

// Components
import { ContentBlocks } from "@/components/site/ContentBlocks";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { ApplyButton } from "@/components/site/ApplyButton";
import { PageBanner } from "@/components/site/PageBanner";

// Utils / SEO
import { metaFromApi } from "@/lib/seo";
import { getT } from "@/lib/i18n/serverT";

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

function ValueCard({ value }) {
  return (
    <div className="hz-val" style={{ background: "#fff", border: "1px solid #ECEDF2", borderRadius: 20, padding: 28, transition: ".25s" }}>
      <div style={{ width: 48, height: 48, borderRadius: 13, background: "#EEF0FF", color: "var(--accent)", display: "grid", placeItems: "center", marginBottom: 16 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          {value.icon.map((d, i) => <path key={i} d={d} />)}
        </svg>
      </div>
      <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 18, margin: 0, color: "#17171F" }}>{value.title}</h3>
      <p style={{ fontSize: 14.5, color: "#63636F", margin: "9px 0 0", lineHeight: 1.55 }}>{value.text}</p>
    </div>
  );
}

const VALUE_ICONS = [
  ["M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12", "M8.2 13.9 7 22l5-3 5 3-1.2-8.1"],
  ["M4 5a2 2 0 0 1 2-2h9a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2z", "M4 19a2 2 0 0 1 2-2h10"],
  ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"],
  ["M2 12a10 10 0 1 0 20 0 10 10 0 0 0-20 0", "M2 12h20", "M12 2a15 15 0 0 1 0 20", "M12 2a15 15 0 0 0 0 20"],
  ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18", "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10", "M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2"],
  ["M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M8 6V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1", "M3 12h18"],
];

const ACCREDITATIONS = ["English UK", "Cambridge", "British Council", "Duolingo", "TOEFL"];

export default async function AboutPage() {
  const tr = await getT();
  const VALUES = VALUE_ICONS.map((icon, i) => ({ icon, title: tr(`about.v${i + 1}t`), text: tr(`about.v${i + 1}x`) }));
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
        eyebrow={tr("about.eyebrow")}
        title={p.h1 || tr("about.bannerTitle")}
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

      {/* Missiyamız — story split */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 28px 0" }}>
        <div className="split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 52, alignItems: "center" }}>
          <div>
            <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 40, letterSpacing: "-.02em", margin: 0, lineHeight: 1.1, color: "#14141C" }}>
              {tr("about.missionTitle1")}<br /><span style={{ color: "#7C7D8C" }}>{tr("about.missionTitle2")}</span>
            </h2>
            <p style={{ fontSize: 16.5, color: "#54545F", margin: "20px 0 0", lineHeight: 1.7 }}>
              {tr("about.missionP1")}
            </p>
            <p style={{ fontSize: 16.5, color: "#54545F", margin: "16px 0 0", lineHeight: 1.7 }}>
              {tr("about.missionP2")}
            </p>
          </div>
          <div style={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 24, overflow: "hidden", border: "1px solid #ECEDF2" }}>
            <div className="img-slot" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}><span>{tr("about.centerPhoto")}</span></div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 900, margin: "0 auto", padding: "56px 28px 0" }}>
        {p.contentHtml ? (
          <article className="bz-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.contentHtml) }} />
        ) : p.content?.length ? (
          <ContentBlocks blocks={p.content} />
        ) : (
          <p style={{ fontSize: 17, lineHeight: 1.85, color: "#3c3c47" }}>
            {tr("about.contentFallback")}
          </p>
        )}
      </section>

      {/* Dəyərlərimiz — values grid */}
      <section style={{ background: "#F6F7FA", borderTop: "1px solid #ECEDF2", borderBottom: "1px solid #ECEDF2", margin: "64px 0 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 28px" }}>
          <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 40, letterSpacing: "-.02em", margin: "0 0 40px", lineHeight: 1.1, color: "#14141C" }}>
            {tr("about.valuesTitle1")}<br /><span style={{ color: "#7C7D8C" }}>{tr("about.valuesTitle2")}</span>
          </h2>
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
            {VALUES.map((v) => <ValueCard key={v.title} value={v} />)}
          </div>
        </div>
      </section>

      {/* Akkreditasiyalar */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 28px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30, flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ fontSize: 13, color: "#8A8A98", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700 }}>{tr("about.accreditations")}</span>
          {ACCREDITATIONS.map((name) => (
            <span key={name} style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 18, color: "#54545F" }}>{name}</span>
          ))}
        </div>
      </section>

      {(p.faq || []).length > 0 && (
        <section style={{ maxWidth: 900, margin: "48px auto 0", padding: "0 28px" }}>
          <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(24px,3vw,32px)", color: "#14141C", margin: "0 0 24px" }}>{tr("common.faq")}</h2>
          <FaqAccordion items={p.faq} />
        </section>
      )}

      <section style={{ maxWidth: 1200, margin: "64px auto 0", padding: "0 28px" }}>
        <div style={{ background: "#00103D", borderRadius: 28, padding: "52px 40px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(26px,3.4vw,36px)", color: "#fff", margin: 0 }}>{tr("about.ctaTitle")}</h2>
          <p style={{ fontSize: 16, color: "#B9BAD0", margin: "14px auto 26px", maxWidth: 520, lineHeight: 1.6 }}>{tr("about.ctaText")}</p>
          <ApplyButton style={{ background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 16, padding: "15px 30px", borderRadius: 99, cursor: "pointer" }} />
        </div>
      </section>
    </>
  );
}
