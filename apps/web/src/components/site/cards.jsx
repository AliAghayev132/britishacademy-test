"use client";

import { LocaleLink as Link } from "./LocaleLink";
import { useT } from "@/lib/i18n/useT";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { getImageUrl } from "@/utils/getImageUrl";

const CAT_COLORS = ["#2E6BE6", "#F5A524", "#7C4DFF", "#E0533D", "#12B5A5", "#FF3D8B", "#0EA5E9", "#22B07D"];

/** Course card — used on the homepage and category hubs. */
export function CourseCard({ course, index = 0 }) {
  const t = useT();
  const accent = CAT_COLORS[index % CAT_COLORS.length];
  const from = course.priceFrom;
  return (
    <Link
      href={`/kurslar/${course.slug}`}
      className="ba-course"
      style={{ display: "flex", flexDirection: "column", background: "#fff", border: "1px solid #ECEDF2", borderRadius: 20, padding: 26, "--accent": accent, "--accent-soft": `${accent}1f` }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#63636E", letterSpacing: ".05em", textTransform: "uppercase" }}>{course.category?.name || t("card.course")}</span>
        {course.isFeatured && <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--accent)", background: "var(--accent-soft)", padding: "4px 9px", borderRadius: 99 }}>{t("card.popular")}</span>}
      </div>
      <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 22, lineHeight: 1.25, margin: "14px 0 0", letterSpacing: "-.01em", color: "#17171F", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "2.5em" }}>{course.title}</h3>
      <p style={{ fontSize: 14.5, color: "#63636F", margin: "10px 0 0", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", height: "4.65em" }}>{course.lead}</p>
      <div style={{ borderTop: "1px solid #EEEFF3", marginTop: "auto", paddingTop: 18, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        {from ? (
          <div><span style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: 26, color: "#14141C" }}>{from}</span><span style={{ fontSize: 13, color: "#63636E", marginLeft: 4 }}>{t("card.perMonth")}</span></div>
        ) : <span style={{ fontSize: 14, color: "#54545F", fontWeight: 700 }}>{t("card.more")}</span>}
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", whiteSpace: "nowrap" }}>{t("card.view")}</span>
      </div>
    </Link>
  );
}

// Country → flag emoji (used as a decorative wash when no SVG flag is stored).
const COUNTRY_FLAGS = {
  "Almaniya": "🇩🇪", "Türkiyə": "🇹🇷", "İngiltərə": "🇬🇧", "Kanada": "🇨🇦",
  "Polşa": "🇵🇱", "Latviya": "🇱🇻", "Macarıstan": "🇭🇺", "Litva": "🇱🇹",
  "Rusiya": "🇷🇺", "Gürcüstan": "🇬🇪", "Estoniya": "🇪🇪", "Amerika": "🇺🇸",
  "Fransa": "🇫🇷", "İspaniya": "🇪🇸", "İtaliya": "🇮🇹", "Niderland": "🇳🇱",
};

/**
 * Study-abroad destination card — sağ tərəfdə solğun "wash" görüntüsü.
 *
 * Üstünlük sırası:
 *   1) dest.image  — admin paneldən yüklənən şəkil (ƏN SADƏ YOL)
 *   2) dest.flag   — inline SVG bayraq (JSON redaktorundan)
 *   3) emoji       — heç nə yoxdursa (⚠️ Windows-da bayraq emojiləri
 *                    dəstəklənmir, "DE" kimi hərf cütü görünür)
 */
export function DestinationCard({ dest }) {
  const flag = COUNTRY_FLAGS[dest.country] || (dest.isScholarship ? "🎓" : "🌍");
  return (
    <Link href={`/xaricde-tehsil/${dest.slug}`} className="ba-fdest" style={{ "--cc": dest.color || "#2E6BE6" }}>
      {dest.image ? (
        <span className="ba-flag" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getImageUrl(dest.image)} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </span>
      ) : dest.flag ? (
        <span
          className="ba-flag"
          aria-hidden="true"
          /* Admin sərbəst mətn sahəsidir (inline SVG) — sanitizasiyasız render
             saxlanmış XSS vektoru idi. */
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(dest.flag) }}
        />
      ) : (
        <span aria-hidden="true" style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 92, lineHeight: 1, opacity: 0.9, pointerEvents: "none", userSelect: "none", WebkitMaskImage: "linear-gradient(to left, #000 55%, transparent)", maskImage: "linear-gradient(to left, #000 55%, transparent)" }}>{flag}</span>
      )}
      <span className="ba-fdest-body">
        <span className="ba-fdest-tag" style={{ display: "block" }}>{dest.region}</span>
        <span className="ba-fdest-name" style={{ display: "block" }}>{dest.country}</span>
        <span className="ba-fdest-sub" style={{ display: "block" }}>{dest.tagline}</span>
      </span>
    </Link>
  );
}

const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

/** Text testimonial card (review wall). */
export function TestimonialCard({ t }) {
  return (
    <figure className="ba-review" style={{ "--c": t.color || "#2E6BE6" }}>
      <span className="ba-review-quote" aria-hidden="true">”</span>
      <span className="ba-stars" aria-label={`${t.rating} ulduz`}>{stars(t.rating || 5)}</span>
      <blockquote style={{ margin: "12px 0 0", fontSize: 15.5, lineHeight: 1.75, color: "#3c3c47" }}>{t.quote}</blockquote>
      <figcaption style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, paddingTop: 16, borderTop: "1px solid #EFF0F5" }}>
        <span className="ba-av" style={{ "--c": t.color, width: 46, height: 46, fontSize: 18 }}>
          {t.photo ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={t.photo} alt="" />) : <span>{(t.name || "?").charAt(0)}</span>}
        </span>
        <span>
          <span style={{ display: "block", fontFamily: "'Poppins'", fontWeight: 700, fontSize: 15, color: "#16161C" }}>{t.name}</span>
          <span style={{ display: "block", fontSize: 13, color: t.color, fontWeight: 600, marginTop: 2 }}>{t.achievement}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** Section heading used across pages. */
export function SectionHead({ title, sub }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(28px,4vw,44px)", letterSpacing: "-.02em", margin: 0, lineHeight: 1.08, color: "#14141C" }}>{title}</h2>
      {sub && <div style={{ color: "#7C7D8C", fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(20px,3vw,30px)", lineHeight: 1.1 }}>{sub}</div>}
    </div>
  );
}
