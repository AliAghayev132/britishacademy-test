import fs from "node:fs";
import path from "node:path";
import { LocaleLink as Link } from "@/components/site/LocaleLink";

/**
 * Per-page mascot slot → /public/assets/mascot/<ad>.png.
 * Fayl adı = səhifə açarı (README ilə eyni: courses.png, blog.png, …);
 * yalnız ana səhifə istisnadır (hero.png).
 *
 * ── NASAZLIQ ──
 * Əvvəl xəritə README-də olmayan adlara aparırdı (courses → study,
 * blog → read, about → hello …). Qovluqdakı fayllar isə səhifə adı ilə
 * idi — nəticədə HƏR daxili səhifənin banneri 404 alırdı (konsolda
 * «GET /assets/mascot/read.png 404»). Şəkil CSS fonu olduğu üçün səhifədə
 * görünmürdü, amma sorğu gedirdi.
 *
 * İndi fayl serverdə yoxlanılır: yoxdursa sorğu ümumiyyətlə göndərilmir.
 * Qovluğa yeni fayl atılanda kod dəyişmədən görünür.
 */
export const MASCOTS = { home: "hero" };

const MASCOT_DIR = path.join(process.cwd(), "public", "assets", "mascot");

/** Açar → mövcud fayl adı, fayl yoxdursa null. */
export function mascotFileFor(key) {
  if (!key) return null;
  const file = MASCOTS[key] || key;
  if (!/^[a-z0-9-]+$/.test(file)) return null; // yol keçidinə qarşı
  return fs.existsSync(path.join(MASCOT_DIR, `${file}.png`)) ? file : null;
}

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
  const mascotFile = mascotFileFor(mascot);
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
