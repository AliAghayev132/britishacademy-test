// Data
import { apiGet } from "@/lib/api";

// Components
import { TestimonialCard, SectionHead } from "@/components/site/cards";
import { PageBanner } from "@/components/site/PageBanner";
import { CtaBand } from "@/components/site/CtaBand";
import VideoSwiper from "@/components/site/VideoSwiper";

// Utils / SEO
import { buildMetadata } from "@/lib/seo";
import { getT } from "@/lib/i18n/serverT";

export async function generateMetadata() {
  // Başlıq/təsvir seçilmiş dildə — əvvəl sabit azərbaycanca idi, ona görə
  // /en və /ru səhifələri AZ meta ilə indekslənirdi.
  const t = await getT();
  return buildMetadata({
    title: t("meta.students.title"),
    description: t("meta.students.desc"),
    path: "/telebelerimiz",
  });
}

const wrap = { maxWidth: 1200, margin: "0 auto", padding: "0 28px" };

// ── Subcomponents ──

/**
 * Statistika zolağı — dəyərlər admin panelindən gəlir (Tənzimləmələr →
 * Ana səhifə → Statistika, 3 dilli). Əvvəl bu siyahı burada sabit kodlanmışdı:
 * nə tərcümə olunurdu, nə də admin dəyişə bilirdi.
 */
function StatsBar({ stats = [] }) {
  if (!stats.length) return null;
  return (
    <section style={{ maxWidth: 1200, margin: "52px auto 0", padding: "0 28px" }}>
      <div
        className="grid-4"
        style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, border: "1px solid #ECEDF2", borderRadius: 22, padding: "30px 24px", background: "linear-gradient(150deg,#FAFBFF,#FFF6F2)" }}
      >
        {stats.map((s, i) => (
          <div key={s.label || i} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: "clamp(30px,4vw,44px)", color: "var(--accent)", letterSpacing: "-.02em" }}>{s.value}</div>
            <div style={{ fontSize: 14.5, color: "#63636F", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function StudentsPage() {
  const tr = await getT();
  // ── data fetching ──
  const [data, site] = await Promise.all([
    apiGet("/testimonials"),
    apiGet("/site"),
  ]);
  const all = data?.testimonials || [];
  const stats = site?.settings?.stats || [];

  // ── derived values ──
  const videos = all.filter((t) => t.type === "video");
  const texts = all.filter((t) => t.type === "text");

  // ── render ──
  return (
    <>
      <PageBanner
        title={tr("page.students.title")}
        subtitle={tr("page.students.sub")}
        mascot="students"
      />

      <StatsBar stats={stats} />

      {videos.length > 0 && (
        <section style={{ ...wrap, padding: "64px 28px 0" }}>
          <SectionHead title={tr("page.students.speak")} sub={tr("page.students.speakSub")} />
          <VideoSwiper videos={videos} />
        </section>
      )}

      {texts.length > 0 && (
        <section style={{ ...wrap, padding: "70px 28px 0" }}>
          <SectionHead title={tr("home.reviews.title")} />
          <div className="ba-wall">
            {texts.map((t) => <TestimonialCard key={t._id} t={t} />)}
          </div>
        </section>
      )}

      <CtaBand />
    </>
  );
}
