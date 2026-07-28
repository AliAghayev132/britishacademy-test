// Next
import Link from "next/link";

// Data
import { apiGet } from "@/lib/api";

// Components
import { PageBanner } from "@/components/site/PageBanner";

// Utils / SEO
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Bloq",
  description:
    "Təhsil, dil və karyera haqqında məsləhətlər, uğur hekayələri və xaricdə təhsil bələdçiləri — British Academy bloqu.",
  path: "/bloq",
});

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" }) : "";

// ── Subcomponents ──

function CategoryChip({ href, label, active }) {
  return (
    <Link href={href} className="bl-chip" style={{ padding: "9px 18px", borderRadius: 99, fontSize: 14, fontWeight: 700, border: "1px solid", borderColor: active ? "var(--accent)" : "#E4E6EF", background: active ? "var(--accent)" : "#fff", color: active ? "#fff" : "#4C4C58" }}>{label}</Link>
  );
}

function BlogPostCard({ post }) {
  return (
    <Link href={`/bloq/${post.slug}`} className="bl-post" style={{ display: "block", background: "#fff", border: "1px solid #ECEDF2", borderRadius: 20, overflow: "hidden" }}>
      <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden", background: "#EEF0F6" }}>
        {post.cover && (/* eslint-disable-next-line @next/next/no-img-element */ <img className="bl-img" src={post.cover} alt={post.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s ease" }} />)}
        {post.category && <span style={{ position: "absolute", top: 12, left: 12, background: post.category.color || "var(--accent)", color: "#fff", fontSize: 11.5, fontWeight: 700, padding: "5px 11px", borderRadius: 99, zIndex: 2 }}>{post.category.name}</span>}
      </div>
      <div style={{ padding: "22px 22px 26px" }}>
        <div style={{ fontSize: 13, color: "#9A9AA6", fontWeight: 600 }}>{fmtDate(post.publishedAt)}</div>
        <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 19, margin: "8px 0 0", lineHeight: 1.3, color: "#17171F" }}>{post.title}</h3>
        {post.excerpt && <p style={{ fontSize: 14.5, color: "#63636F", margin: "10px 0 0", lineHeight: 1.55 }}>{post.excerpt}</p>}
      </div>
    </Link>
  );
}

function PaginationLink({ page, currentPage, category }) {
  const active = page === currentPage;
  return (
    <Link href={`/bloq?${category ? `kateqoriya=${category}&` : ""}seh=${page}`} style={{ width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: 12, fontWeight: 700, fontSize: 14.5, background: active ? "var(--accent)" : "#fff", color: active ? "#fff" : "#4C4C58", border: "1px solid", borderColor: active ? "var(--accent)" : "#E4E6EF" }}>{page}</Link>
  );
}

export default async function BlogPage({ searchParams }) {
  // ── data fetching ──
  const sp = await searchParams;
  const category = sp?.kateqoriya || "";
  const page = Math.max(parseInt(sp?.seh, 10) || 1, 1);

  const data = await apiGet(`/blog?limit=9&page=${page}${category ? `&category=${category}` : ""}`);
  const posts = data?.posts || [];
  const categories = data?.categories || [];
  const pg = data?.pagination || { page: 1, pages: 1 };

  // ── render ──
  return (
    <>
      <PageBanner
        title="Bloq"
        subtitle="Dil öyrənmə, imtahanlar və xaricdə təhsil haqqında faydalı yazılar."
        mascot="blog"
      />

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 28px 0" }}>
        {categories.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
            <CategoryChip href="/bloq" label="Hamısı" active={!category} />
            {categories.map((c) => (
              <CategoryChip key={c._id} href={`/bloq?kateqoriya=${c.slug}`} label={c.name} active={category === c.slug} />
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <p style={{ color: "#63636F", padding: "40px 0" }}>Bu kateqoriyada hələ yazı yoxdur.</p>
        ) : (
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
            {posts.map((p) => <BlogPostCard key={p._id} post={p} />)}
          </div>
        )}

        {pg.pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 36 }}>
            {Array.from({ length: pg.pages }, (_, i) => i + 1).map((n) => (
              <PaginationLink key={n} page={n} currentPage={pg.page} category={category} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
