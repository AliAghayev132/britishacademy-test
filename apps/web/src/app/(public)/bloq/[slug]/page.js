// Next
import { notFound } from "next/navigation";
import { LocaleLink as Link } from "@/components/site/LocaleLink";
import { getT } from "@/lib/i18n/serverT";

// Data
import { apiGetStatus, isMissing } from "@/lib/api";

// Utils / SEO
import DOMPurify from "isomorphic-dompurify";
import { metaFromApi, SITE_URL } from "@/lib/seo";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" }) : "";

// ── Metadata ──
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

// ── Subcomponents ──
/** Banner: breadcrumb, title, meta row. */
function BlogHero({ p }) {
  return (
    <section className="ba-banner">
      <div className="ba-banner-inner" style={{ maxWidth: 900, margin: "0 auto", padding: "36px 28px 56px" }}>
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
  );
}

/** Cover image, overlapping the hero. */
function CoverImage({ src, alt }) {
  return (
    <div style={{ maxWidth: 900, margin: "-28px auto 0", padding: "0 28px", position: "relative", zIndex: 2 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ width: "100%", borderRadius: 20, boxShadow: "0 24px 60px rgba(20,20,45,.18)" }} />
    </div>
  );
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;

  // ── Data fetching + notFound guard ──
  const res = await apiGetStatus(`/blog/${slug}`);
  if (isMissing(res, "post")) notFound();
  const p = res.data.post;
  const tr = await getT();

  // TipTap emits HTML; sanitize before rendering.
  const html = DOMPurify.sanitize(p.content || "");

  // ── JSON-LD ──
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

  // ── Render ──
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      <BlogHero p={p} />

      {p.cover && <CoverImage src={p.cover} alt={p.title} />}

      <article className="bz-body" style={{ maxWidth: 760, margin: "48px auto 0", padding: "0 28px" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div style={{ maxWidth: 760, margin: "48px auto 0", padding: "0 28px" }}>
        <Link href="/bloq" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 15 }}>{tr("blog.allPosts")}</Link>
      </div>
    </>
  );
}
