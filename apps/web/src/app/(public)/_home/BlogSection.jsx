// Components
import { LocaleLink as Link, SectionHead } from "@/components";

// Lib
import { formatDate } from "@/lib";

// Local
import { wrap } from "./wrap";

function NewsCard({ post, locale }) {
  return (
    <Link href={`/bloq/${post.slug}`} className="ba-news-card" style={{ display: "block", background: "#fff", border: "1px solid #ECEDF2", borderRadius: 20, overflow: "hidden", "--accent": post.category?.color || "var(--accent)" }}>
      <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden", background: "#EEF0F6" }}>
        {post.cover && (/* eslint-disable-next-line @next/next/no-img-element */ <img className="ba-news-img" src={post.cover} alt={post.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .35s ease" }} />)}
        {post.category && <span style={{ position: "absolute", top: 12, left: 12, background: post.category.color || "var(--accent)", color: "#fff", fontSize: 11.5, fontWeight: 700, padding: "5px 11px", borderRadius: 99, zIndex: 2 }}>{post.category.name}</span>}
      </div>
      <div style={{ padding: "22px 22px 26px" }}>
        <div style={{ fontSize: 13, color: "#63636E", fontWeight: 600 }}>{formatDate(post.publishedAt, locale)}</div>
        <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 19, margin: "8px 0 0", lineHeight: 1.3, color: "#17171F" }}>{post.title}</h3>
        {post.excerpt && <p style={{ fontSize: 14.5, color: "#63636F", margin: "10px 0 0", lineHeight: 1.55 }}>{post.excerpt}</p>}
      </div>
    </Link>
  );
}

/**
 * Bloq / xəbərlər. Yazı varsa son 3 yazı, yoxdursa bloqa keçid zolağı —
 * ana səhifədən bloqa keçid hər halda qalır.
 */
export default function BlogSection({ posts, locale, t }) {
  if (posts.length > 0) {
    return (
      <section className="ba-reveal" style={{ ...wrap, padding: "84px 28px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
          <SectionHead title={t("home.blog.title")} sub={t("home.blog.sub")} />
          <Link href="/bloq" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 15 }}>{t("home.blog.all")}</Link>
        </div>
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
          {posts.map((p) => <NewsCard key={p._id} post={p} locale={locale} />)}
        </div>
      </section>
    );
  }
  return (
    <section className="ba-reveal" style={{ ...wrap, padding: "84px 28px 20px" }}>
      <Link
        href="/bloq"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap", padding: "28px 32px", borderRadius: 24, background: "#00157A", color: "#fff" }}
      >
        <div style={{ minWidth: 0, flex: "1 1 280px" }}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{t("home.blog.title")}</div>
          <div style={{ marginTop: 6, fontSize: 15, opacity: 0.85, lineHeight: 1.5 }}>{t("home.blog.cta")}</div>
        </div>
        <span style={{ flex: "none", padding: "12px 22px", borderRadius: 999, background: "#fff", color: "#00157A", fontWeight: 700, fontSize: 15 }}>
          {t("home.blog.ctaBtn")}
        </span>
      </Link>
    </section>
  );
}
