// Next
import { notFound } from "next/navigation";
import { LocaleLink as Link } from "@/components/site/LocaleLink";
import { getT } from "@/lib/i18n/serverT";

// Data
import { apiGetStatus, isMissing } from "@/lib/api";

// Utils / SEO
import DOMPurify from "isomorphic-dompurify";
import { metaFromApi, SITE_URL } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/serverT";

// Mütləq URL (şəkil relativdirsə SITE_URL əlavə et).
const abs = (u) => (!u ? undefined : u.startsWith("http") ? u : `${SITE_URL}${u}`);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" }) : "";

// ── Metadata ──
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data } = await apiGetStatus(`/blog/${slug}`);
  const p = data?.post;
  if (!p) return {};
  const meta = metaFromApi(p.seo, {
    title: p.title,
    description: p.excerpt,
    path: `/bloq/${slug}`,
    image: p.cover,
    type: "article",
  });
  // Article-spesifik Open Graph (paylaşımlar + Google Discover üçün).
  const authorName = p.author ? `${p.author.firstName || ""} ${p.author.lastName || ""}`.trim() : undefined;
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: "article",
      publishedTime: p.publishedAt || undefined,
      modifiedTime: p.updatedAt || undefined,
      authors: authorName ? [authorName] : undefined,
      section: p.category?.name || undefined,
      tags: p.tags?.length ? p.tags : undefined,
    },
  };
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
  const locale = await getLocale();

  // TipTap emits HTML; sanitize before rendering.
  const html = DOMPurify.sanitize(p.content || "");

  const url = `${SITE_URL}/bloq/${slug}`;
  const authorName = p.author ? `${p.author.firstName || ""} ${p.author.lastName || ""}`.trim() : "";

  // ── JSON-LD ── BlogPosting + BreadcrumbList
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      url,
      headline: p.title,
      description: p.excerpt || undefined,
      datePublished: p.publishedAt || undefined,
      dateModified: p.updatedAt || p.publishedAt || undefined,
      image: abs(p.cover) ? [abs(p.cover)] : undefined,
      articleSection: p.category?.name || undefined,
      keywords: p.tags?.length ? p.tags.join(", ") : undefined,
      inLanguage: locale,
      author: authorName
        ? { "@type": "Person", name: authorName }
        : { "@type": "Organization", name: "British Academy" },
      publisher: {
        "@type": "Organization",
        name: "British Academy",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/assets/logo.png` },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: tr("common.home"), item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: tr("home.blog.title"), item: `${SITE_URL}/bloq` },
        ...(p.category
          ? [{ "@type": "ListItem", position: 3, name: p.category.name, item: `${SITE_URL}/bloq?kateqoriya=${p.category.slug}` }]
          : []),
        { "@type": "ListItem", position: p.category ? 4 : 3, name: p.title, item: url },
      ],
    },
  ];

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
