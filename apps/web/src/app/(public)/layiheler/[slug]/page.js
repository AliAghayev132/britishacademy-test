// Next
import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";

// Data
import { apiGetStatus, isMissing } from "@/lib/api";

// Components
import { ContentBlocks } from "@/components/site/ContentBlocks";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { ApplyButton } from "@/components/site/ApplyButton";
import { PageBanner } from "@/components/site/PageBanner";

// Utils / SEO
import { metaFromApi } from "@/lib/seo";
import { getT } from "@/lib/i18n/serverT";

/**
 * Bir layihənin səhifəsi.
 *
 * MÜRACİƏT YALNIZ BURADAN edilir — ümumi müraciət formasında layihə seçimi
 * yoxdur (müştəri tələbi). Düymə `project` id-sini ötürür, müraciət admin
 * paneldə həmin layihəyə bağlı görünür.
 *
 * `applyEnabled` söndürülübsə düymə göstərilmir: bəzi layihələr yalnız
 * məlumat xarakterlidir.
 */

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data } = await apiGetStatus(`/projects/${slug}`);
  const p = data?.project;
  if (!p) return {};
  return metaFromApi(p.seo, {
    title: p.title,
    description: p.lead || p.tagline || "",
    path: `/layiheler/${slug}`,
  });
}

function FactsSidebar({ facts, title }) {
  return (
    <aside
      style={{
        border: "1px solid #ECEDF2",
        borderRadius: 20,
        padding: "22px 22px 8px",
        background: "#fff",
        alignSelf: "start",
        position: "sticky",
        top: 96,
      }}
    >
      <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 16, margin: "0 0 14px", color: "#14141C" }}>
        {title}
      </h3>
      {facts.map((f, i) => (
        <div key={i} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: i === facts.length - 1 ? "none" : "1px solid #F1F2F6" }}>
          <div style={{ fontSize: 12.5, color: "#9A9AA6", fontWeight: 600 }}>{f.label}</div>
          <div style={{ fontSize: 15.5, color: "#22222C", fontWeight: 600, marginTop: 3 }}>{f.value}</div>
        </div>
      ))}
    </aside>
  );
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const [res, tr] = await Promise.all([apiGetStatus(`/projects/${slug}`), getT()]);

  // isMissing: şəbəkə sıçrayışını 404 kimi göstərmir — müvəqqəti API kəsilməsi
  // səhifəni axtarış indeksindən çıxarardı.
  if (isMissing(res, "project")) notFound();

  const p = res.data.project;
  const hasFacts = (p.facts || []).length > 0;

  return (
    <>
      <PageBanner title={p.title} subtitle={p.tagline || p.lead} />

      {p.applyEnabled !== false && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "26px 28px 0", textAlign: "center" }}>
          <ApplyButton
            interest={`Layihə — ${p.title}`}
            project={p._id}
            style={{
              background: p.color || "var(--accent)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 15.5,
              padding: "14px 30px",
              borderRadius: 99,
              cursor: "pointer",
            }}
          >
            {p.applyLabel || tr("cta.apply")}
          </ApplyButton>
        </div>
      )}

      <section
        className="split"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "44px 28px 0",
          display: "grid",
          gridTemplateColumns: hasFacts ? "minmax(0,1fr) 320px" : "minmax(0,1fr)",
          gap: 32,
        }}
      >
        <div>
          {p.contentHtml ? (
            <article
              className="bz-body"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.contentHtml) }}
            />
          ) : (
            <ContentBlocks blocks={p.content} />
          )}

          {(p.faq || []).length > 0 && (
            <div style={{ marginTop: 40 }}>
              <FaqAccordion items={p.faq} />
            </div>
          )}
        </div>

        {hasFacts && <FactsSidebar facts={p.facts} title={tr("page.projects.facts")} />}
      </section>

      {p.applyEnabled !== false && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 28px 72px", textAlign: "center" }}>
          <ApplyButton
            interest={`Layihə — ${p.title}`}
            project={p._id}
            style={{
              background: p.color || "var(--accent)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 15.5,
              padding: "14px 30px",
              borderRadius: 99,
              cursor: "pointer",
            }}
          >
            {p.applyLabel || tr("cta.apply")}
          </ApplyButton>
        </div>
      )}
    </>
  );
}
