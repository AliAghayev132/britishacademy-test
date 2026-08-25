import { LocaleLink as Link } from "@/components/site/LocaleLink";

/**
 * Per-page mascot slot. Filenames map to /public/assets/mascot/<name>.png.
 * A missing file simply shows nothing (CSS background) — no broken-image icon.
 * Sizes for the client: transparent PNG ~800×800, < 500 KB.
 */
export const MASCOTS = {
  home: "hero", // welcoming / thumbs-up
  courses: "study", // holding a book
  filiallar: "map", // pointing at a map
  teachers: "teach", // with a pointer/board
  students: "grad", // graduate cap
  destinations: "travel", // holding a placard / suitcase
  blog: "read", // reading
  contact: "call", // headset / waving
  about: "hello", // waving hello
};

/**
 * Brand-gradient inner-page hero with breadcrumb, title, subtitle, an optional
 * mascot and optional action children. Server Component (no client JS).
 */
export function PageBanner({
  title,
  subtitle,
  eyebrow,
  breadcrumb = [],
  mascot,
  children,
}) {
  const mascotFile = mascot && (MASCOTS[mascot] || mascot);
  return (
    <section className="ba-banner">
      <div
        className="ba-banner-inner"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "34px 28px 60px" }}
      >
        {breadcrumb.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 13.5, color: "rgba(255,255,255,.8)" }}
          >
            {breadcrumb.map((c, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {c.href ? (
                  <Link href={c.href} style={{ color: "rgba(255,255,255,.8)" }}>{c.label}</Link>
                ) : (
                  <span style={{ color: "#fff", fontWeight: 600 }}>{c.label}</span>
                )}
                {i < breadcrumb.length - 1 && <span style={{ opacity: 0.5 }}>/</span>}
              </span>
            ))}
          </nav>
        )}

        {eyebrow && (
          <span style={{ display: "inline-block", marginTop: breadcrumb.length ? 18 : 0, fontSize: 12.5, color: "rgba(255,255,255,.9)", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase" }}>
            {eyebrow}
          </span>
        )}

        <h1 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(30px,4.6vw,50px)", letterSpacing: "-.025em", margin: "14px 0 0", lineHeight: 1.12, color: "#fff", maxWidth: 820 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 18, color: "rgba(255,255,255,.92)", margin: "16px 0 0", maxWidth: 660, lineHeight: 1.6 }}>
            {subtitle}
          </p>
        )}
        {children && <div style={{ marginTop: 26 }}>{children}</div>}
      </div>

      {mascotFile && (
        <span
          className="ba-banner-mascot"
          aria-hidden="true"
          style={{ backgroundImage: `url(/assets/mascot/${mascotFile}.png)` }}
        />
      )}
    </section>
  );
}
