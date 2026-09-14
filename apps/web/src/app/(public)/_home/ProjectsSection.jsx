// Components
import { LocaleLink as Link, SectionHead } from "@/components";

// Lib
import { getImageUrl } from "@/lib";

// Local
import { wrap } from "./wrap";

/**
 * Layihələr — seçilmişlər. Müraciət düyməsi BURADA yoxdur: müraciət
 * yalnız layihənin öz səhifəsindən edilir.
 */
export default function ProjectsSection({ projects, t }) {
  return (
    <section className="ba-reveal" style={{ ...wrap, padding: "84px 28px 0" }}>
      <SectionHead title={t("page.projects.title")} sub={t("page.projects.sub")} />
      <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
        {projects.map((p) => (
          <Link
            key={p._id}
            href={`/layiheler/${p.slug}`}
            className="mt-card"
            style={{ display: "block", background: "#fff", border: "1px solid #ECEDF2", borderRadius: 22, overflow: "hidden", "--accent": p.color || "#00157A" }}
          >
            <div style={{ aspectRatio: "16 / 9", background: p.color || "#00157A", overflow: "hidden" }}>
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getImageUrl(p.image)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              )}
            </div>
            <div style={{ padding: "18px 20px 20px" }}>
              <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 18, margin: 0, color: "#17171F" }}>{p.title}</h3>
              {p.tagline && <div style={{ fontSize: 13.5, color: "var(--accent)", fontWeight: 600, marginTop: 4 }}>{p.tagline}</div>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
