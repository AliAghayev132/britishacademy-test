import { notFound } from "next/navigation";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { apiGetStatus, isMissing } from "@/lib/api";
import { metaFromApi, SITE_URL } from "@/lib/seo";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" }) : "";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data } = await apiGetStatus(`/blog/${slug}`);
  const p = data?.post;
  if (!p) return {};
  return metaFromApi(p.seo, {
    title: p.title,
    description: p.excerpt,
    path: `/bloq/${slug}`,
    image: p.cover,
  });
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const res = await apiGetStatus(`/blog/${slug}`);
  if (isMissing(res, "post")) notFound();
  const p = res.data.post;

  // TipTap emits HTML; sanitize before rendering.
  const html = DOMPurify.sanitize(p.content || "");

  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.excerpt,
    datePublished: p.publishedAt,
    dateModified: p.updatedAt,
    image: p.cover ? [p.cover] : undefined,
    author: p.author
      ? { "@type": "Person", name: `${p.author.firstName || ""} ${p.author.lastName || ""}`.trim() }
      : { "@type": "Organization", name: "British Academy" },
    publisher: { "@type": "Organization", name: "British Academy", url: SITE_URL },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      <section style={{ position: "relative", background: "var(--accent)", overflow: "hidden" }}>
        <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", padding: "36px 28px 56px" }}>
          <nav aria-label="Breadcrumb" style={{ fontSize: 13.5, color: "rgba(255,255,255,.8)" }}>
            <Link href="/bloq" style={{ color: "rgba(255,255,255,.8)" }}>Bloq</Link>
            {p.category && (<><span style={{ opacity: 0.5 }}> / </span><Link href={`/bloq?kateqoriya=${p.category.slug}`} style={{ color: "rgba(255,255,255,.8)" }}>{p.category.name}</Link></>)}
          </nav>
          <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(28px,4vw,44px)", letterSpacing: "-.02em", margin: "14px 0 0", lineHeight: 1.18, color: "#fff" }}>{p.title}</h1>
          <div style={{ display: "flex", gap: 16, marginTop: 16, fontSize: 14, color: "rgba(255,255,255,.85)", flexWrap: "wrap" }}>
            <span>{fmtDate(p.publishedAt)}</span>
            {p.readMinutes && <span>· {p.readMinutes} dəq oxu</span>}
            {p.author && <span>· {`${p.author.firstName || ""} ${p.author.lastName || ""}`.trim()}</span>}
          </div>
        </div>
      </section>

      {p.cover && (
        <div style={{ maxWidth: 900, margin: "-28px auto 0", padding: "0 28px", position: "relative", zIndex: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.cover} alt={p.title} style={{ width: "100%", borderRadius: 20, boxShadow: "0 24px 60px rgba(20,20,45,.18)" }} />
        </div>
      )}

      <article className="bz-body" style={{ maxWidth: 760, margin: "48px auto 0", padding: "0 28px" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div style={{ maxWidth: 760, margin: "48px auto 0", padding: "0 28px" }}>
        <Link href="/bloq" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 15 }}>← Bütün yazılar</Link>
      </div>
    </>
  );
}
