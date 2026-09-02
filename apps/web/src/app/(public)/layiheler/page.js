// Data
import { apiGet } from "@/lib/api";

// Components
import { PageBanner } from "@/components/site/PageBanner";
import { CtaBand } from "@/components/site/CtaBand";
import { LocaleLink as Link } from "@/components/site/LocaleLink";

// Utils / SEO
import { buildMetadata } from "@/lib/seo";
import { getT } from "@/lib/i18n/serverT";
import { getImageUrl } from "@/utils/getImageUrl";

export async function generateMetadata() {
  const t = await getT();
  return buildMetadata({
    title: t("page.projects.title"),
    description: t("page.projects.sub"),
    path: "/layiheler",
  });
}

/**
 * Layihələr siyahısı.
 *
 * Xaricdə təhsil səhifəsi ilə eyni quruluş. Müraciət düyməsi BURADA YOXDUR —
 * müraciət yalnız layihənin öz səhifəsindən edilir (müştəri tələbi), ona görə
 * kart bütövlükdə həmin səhifəyə keçid verir.
 */
function ProjectCard({ p }) {
  const img = getImageUrl(p.image);
  return (
    <Link
      href={`/layiheler/${p.slug}`}
      className="mt-card"
      style={{
        display: "block",
        background: "#fff",
        border: "1px solid #ECEDF2",
        borderRadius: 22,
        overflow: "hidden",
        "--accent": p.color || "#00157A",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16 / 9", background: "#EEF0F6", overflow: "hidden" }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(140deg, ${p.color || "#00157A"}, ${p.color || "#00157A"}99)`,
            }}
          />
        )}
      </div>

      <div style={{ padding: "20px 20px 22px" }}>
        <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 19, margin: 0, color: "#17171F" }}>
          {p.title}
        </h3>
        {p.tagline && (
          <div style={{ fontSize: 14, color: "var(--accent)", fontWeight: 600, marginTop: 5 }}>{p.tagline}</div>
        )}
        {p.lead && (
          <p style={{ fontSize: 14.5, color: "#63636F", lineHeight: 1.65, margin: "9px 0 0" }}>{p.lead}</p>
        )}
      </div>
    </Link>
  );
}

export default async function ProjectsPage() {
  const tr = await getT();
  const data = await apiGet("/projects");
  const projects = data?.projects || [];

  return (
    <>
      <PageBanner title={tr("page.projects.title")} subtitle={tr("page.projects.sub")} />

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 28px 0" }}>
        {projects.length === 0 ? (
          <p style={{ color: "#8A8A96" }}>{tr("page.projects.empty")}</p>
        ) : (
          <div
            className="grid-3"
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}
          >
            {projects.map((p) => (
              <ProjectCard key={p._id} p={p} />
            ))}
          </div>
        )}
      </section>

      <CtaBand />
    </>
  );
}
