"use client";

// Lib
import { useT } from "@/lib";

const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

/** Text testimonial card (review wall). */
export default function TestimonialCard({ t }) {
  const tr = useT();
  const rating = t.rating || 5;
  return (
    <figure className="ba-review" style={{ "--c": t.color || "#2E6BE6" }}>
      <span className="ba-review-quote" aria-hidden="true">”</span>
      <span className="ba-stars" role="img" aria-label={tr("review.rating").replace("{n}", rating)}>{stars(rating)}</span>
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
