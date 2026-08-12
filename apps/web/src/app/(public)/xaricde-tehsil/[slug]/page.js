// Next
import { notFound } from "next/navigation";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";

// Data
import { apiGetStatus, isMissing } from "@/lib/api";

// Components
import { ContentBlocks } from "@/components/site/ContentBlocks";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { ApplyButton } from "@/components/site/ApplyButton";
import { PageBanner } from "@/components/site/PageBanner";

// Utils / SEO
import { metaFromApi, SITE_URL } from "@/lib/seo";

// ── Metadata ──
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

// ── Subcomponents ──
/** "Universitetlər" list. */
function UniversitiesList({ universities }) {
  return (
    <>
      <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(22px,2.8vw,30px)", color: "#14141C", margin: "36px 0 16px" }}>Universitetlər</h2>
      <ul role="list" style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
        {universities.map((u, i) => (
          <li key={i} style={{ display: "flex", gap: 11, fontSize: 16, color: "#3c3c47" }}>
            <span style={{ color: "var(--accent)", fontWeight: 800 }}>🎓</span>
            <span>{u.name}{u.city ? ` — ${u.city}` : ""}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Sidebar with quick facts. */
function FactsSidebar({ facts }) {
  return (
    <aside style={{ border: "1px solid #ECEDF2", borderRadius: 20, padding: 26, background: "#FAFBFF" }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#63636E", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 16 }}>Qısa məlumat</div>
      {facts.map((f, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid #ECEDF2", fontSize: 15 }}>
          <span style={{ color: "#63636F" }}>{f.label}</span>
          <span style={{ color: "#16161C", fontWeight: 600 }}>{f.value}</span>
        </div>
      ))}
    </aside>
  );
}

export default async function DestinationPage({ params }) {
  const { slug } = await params;

  // ── Data fetching + notFound guard ──
  const res = await apiGetStatus(`/destinations/${slug}`);
  if (isMissing(res, "destination")) notFound();
  const d = res.data.destination;

  // ── JSON-LD ── Breadcrumb (+ FAQPage when present)
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ana səhifə", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Xaricdə təhsil", item: `${SITE_URL}/xaricde-tehsil` },
        { "@type": "ListItem", position: 3, name: d.country, item: `${SITE_URL}/xaricde-tehsil/${d.slug || slug}` },
      ],
    },
  ];
  if (d.faq?.length) {
    ld.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: d.faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
    });
  }

  // ── Render ──
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      <PageBanner
        title={d.isScholarship ? d.country : `${d.country}-də təhsil`}
        subtitle={d.lead || d.tagline}
        mascot="destinations"
        breadcrumb={[
          { label: "Xaricdə təhsil", href: "/xaricde-tehsil" },
          { label: d.country },
        ]}
      >
        <ApplyButton interest={`Xaricdə təhsil — ${d.country}`} className="ba-btn-primary" style={{ background: "#fff", color: "var(--accent)", border: "none", fontWeight: 700, fontSize: 15, padding: "14px 26px", borderRadius: 99, cursor: "pointer" }} />
      </PageBanner>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 28px 0" }}>
        <div className="split" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 36, alignItems: "start" }}>
          <div>
            {d.contentHtml ? (
              <article className="bz-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(d.contentHtml) }} />
            ) : d.content?.length ? (
              <ContentBlocks blocks={d.content} />
            ) : (
              <p style={{ fontSize: 16.5, lineHeight: 1.85, color: "#3c3c47" }}>
                {d.country} üzrə təfərrüatlı məlumat tezliklə əlavə olunacaq. Universitet seçimi, sənədlər və viza prosesi barədə məsləhət üçün bizimlə əlaqə saxla.
              </p>
            )}

            {(d.universities || []).length > 0 && <UniversitiesList universities={d.universities} />}
          </div>

          {(d.facts || []).length > 0 && <FactsSidebar facts={d.facts} />}
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
