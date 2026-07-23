import Link from "next/link";
import { apiGet } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Bloq",
  description:
    "Təhsil, dil və karyera haqqında məsləhətlər, uğur hekayələri və xaricdə təhsil bələdçiləri — British Academy bloqu.",
  path: "/bloq",
});

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" }) : "";

export default async function BlogPage({ searchParams }) {
  const sp = await searchParams;
  const category = sp?.kateqoriya || "";
  const page = Math.max(parseInt(sp?.seh, 10) || 1, 1);

  const data = await apiGet(`/blog?limit=9&page=${page}${category ? `&category=${category}` : ""}`);
  const posts = data?.posts || [];
  const categories = data?.categories || [];
  const pg = data?.pagination || { page: 1, pages: 1 };

  return (
    <>
      <section style={{ position: "relative", background: "var(--accent)", overflow: "hidden" }}>
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "56px 28px 60px" }}>
          <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(32px,4.6vw,50px)", letterSpacing: "-.025em", margin: 0, color: "#fff" }}>Bloq</h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,.92)", margin: "16px 0 0", maxWidth: 640, lineHeight: 1.6 }}>
            Dil öyrənmə, imtahanlar və xaricdə təhsil haqqında faydalı yazılar.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 28px 0" }}>
        {categories.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
            <Link href="/bloq" className="bl-chip" style={{ padding: "9px 18px", borderRadius: 99, fontSize: 14, fontWeight: 700, border: "1px solid", borderColor: !category ? "var(--accent)" : "#E4E6EF", background: !category ? "var(--accent)" : "#fff", color: !category ? "#fff" : "#4C4C58" }}>Hamısı</Link>
            {categories.map((c) => (
              <Link key={c._id} href={`/bloq?kateqoriya=${c.slug}`} className="bl-chip" style={{ padding: "9px 18px", borderRadius: 99, fontSize: 14, fontWeight: 700, border: "1px solid", borderColor: category === c.slug ? "var(--accent)" : "#E4E6EF", background: category === c.slug ? "var(--accent)" : "#fff", color: category === c.slug ? "#fff" : "#4C4C58" }}>{c.name}</Link>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <p style={{ color: "#63636F", padding: "40px 0" }}>Bu kateqoriyada hələ yazı yoxdur.</p>
        ) : (
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
            {posts.map((p) => (
              <Link key={p._id} href={`/bloq/${p.slug}`} className="bl-post" style={{ display: "block", background: "#fff", border: "1px solid #ECEDF2", borderRadius: 20, overflow: "hidden" }}>
                <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden", background: "#EEF0F6" }}>
                  {p.cover && (/* eslint-disable-next-line @next/next/no-img-element */ <img className="bl-img" src={p.cover} alt={p.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s ease" }} />)}
                  {p.category && <span style={{ position: "absolute", top: 12, left: 12, background: p.category.color || "var(--accent)", color: "#fff", fontSize: 11.5, fontWeight: 700, padding: "5px 11px", borderRadius: 99, zIndex: 2 }}>{p.category.name}</span>}
                </div>
                <div style={{ padding: "22px 22px 26px" }}>
                  <div style={{ fontSize: 13, color: "#9A9AA6", fontWeight: 600 }}>{fmtDate(p.publishedAt)}</div>
                  <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 19, margin: "8px 0 0", lineHeight: 1.3, color: "#17171F" }}>{p.title}</h3>
                  {p.excerpt && <p style={{ fontSize: 14.5, color: "#63636F", margin: "10px 0 0", lineHeight: 1.55 }}>{p.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}

        {pg.pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 36 }}>
            {Array.from({ length: pg.pages }, (_, i) => i + 1).map((n) => (
              <Link key={n} href={`/bloq?${category ? `kateqoriya=${category}&` : ""}seh=${n}`} style={{ width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: 12, fontWeight: 700, fontSize: 14.5, background: n === pg.page ? "var(--accent)" : "#fff", color: n === pg.page ? "#fff" : "#4C4C58", border: "1px solid", borderColor: n === pg.page ? "var(--accent)" : "#E4E6EF" }}>{n}</Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
