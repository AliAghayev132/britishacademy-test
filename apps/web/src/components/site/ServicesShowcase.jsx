"use client";

// Homepage "Xidmətlər/Kurslar" bölməsi — Swiper loop carousel.
// Karta klik edəndə səhifə naviqasiya etmir; seçilmiş xidmətin məlumatı
// YUXARIDAKI panel-də inline açılır. Sağ yuxarıda "Bütün xidmətlər" düyməsi.
import { useState } from "react";
import { LocaleLink as Link } from "./LocaleLink";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { ApplyButton } from "./ApplyButton";
import { useT } from "@/lib/i18n/useT";

const CAT_COLORS = ["#2E6BE6", "#F5A524", "#7C4DFF", "#E0533D", "#12B5A5", "#FF3D8B", "#0EA5E9", "#22B07D"];
const wrap = { maxWidth: 1240, margin: "0 auto", padding: "0 28px" };

export default function ServicesShowcase({
  courses = [],
  title,
  sub,
  allHref = "/kurslar",
  allLabel,
}) {
  const t = useT();
  const [active, setActive] = useState(0);
  if (!courses.length) return null;

  title = title || t("home.courses.title");
  sub = sub || t("home.courses.sub");
  allLabel = allLabel || t("svc.all");

  const cur = courses[active] || courses[0];
  const accent = CAT_COLORS[active % CAT_COLORS.length];
  const soft = `${accent}14`;

  return (
    <section className="ba-reveal" style={{ ...wrap, padding: "84px 28px 20px" }}>
      {/* Başlıq + "Bütün xidmətlər" düyməsi (sağ yuxarı) */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 34 }}>
        <div>
          <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(28px,4vw,44px)", letterSpacing: "-.02em", margin: 0, lineHeight: 1.08, color: "#14141C" }}>{title}</h2>
          {sub && <div style={{ color: "#7C7D8C", fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(20px,3vw,30px)", lineHeight: 1.1 }}>{sub}</div>}
        </div>
        <Link
          href={allHref}
          style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 8, background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 14.5, padding: "12px 20px", borderRadius: 99, whiteSpace: "nowrap" }}
        >
          {allLabel} →
        </Link>
      </div>

      {/* İnline məlumat paneli — seçilmiş xidmət yuxarıda açılır (naviqasiya yox) */}
      <div
        key={cur._id}
        className="ba-svc-panel"
        style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 26, alignItems: "center", background: "#fff", border: `1px solid ${accent}33`, borderRadius: 24, padding: 30, marginBottom: 22, boxShadow: `0 24px 60px ${accent}14` }}
      >
        <div>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, color: accent, background: soft, padding: "5px 12px", borderRadius: 99, letterSpacing: ".05em", textTransform: "uppercase" }}>
            {cur.category?.name || t("svc.service")}
          </span>
          <h3 style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: "clamp(24px,3vw,32px)", color: "#16161C", margin: "16px 0 0", letterSpacing: "-.01em" }}>{cur.title}</h3>
          {cur.lead && <p style={{ fontSize: 16, color: "#4B4B57", lineHeight: 1.7, margin: "12px 0 0", maxWidth: 560 }}>{cur.lead}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
            <Link href={`/kurslar/${cur.slug}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: accent, color: "#fff", fontWeight: 700, fontSize: 15, padding: "13px 24px", borderRadius: 13 }}>{t("card.more")} →</Link>
            <ApplyButton interest={cur.title} style={{ background: soft, color: accent, border: "none", fontWeight: 700, fontSize: 15, padding: "13px 24px", borderRadius: 13, cursor: "pointer" }} />
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          {cur.priceFrom ? (
            <>
              <div style={{ fontSize: 13, color: "#63636E", fontWeight: 600 }}>{t("svc.priceFrom")}</div>
              <div style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: 44, color: "#14141C", lineHeight: 1.1 }}>{cur.priceFrom}<span style={{ fontSize: 16, color: "#63636E", fontWeight: 700 }}> {t("svc.perMonth")}</span></div>
            </>
          ) : (
            <div style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: 30, color: accent }}>{t("svc.individual")}</div>
          )}
        </div>
      </div>

      {/* Loop swiper — kliklə seçim (naviqasiya yox) */}
      <Swiper
        modules={[Autoplay, FreeMode, Mousewheel]}
        slidesPerView="auto"
        spaceBetween={16}
        loop={courses.length > 3}
        freeMode
        grabCursor
        speed={600}
        autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        style={{ padding: "6px 2px" }}
      >
        {courses.map((c, i) => {
          const on = i === active;
          const ac = CAT_COLORS[i % CAT_COLORS.length];
          return (
            <SwiperSlide key={c._id} style={{ width: 270 }}>
              <button
                type="button"
                onClick={() => setActive(i)}
                style={{
                  width: "100%", textAlign: "left", cursor: "pointer", background: "#fff",
                  border: `1.5px solid ${on ? ac : "#ECEDF2"}`, borderRadius: 18, padding: 20,
                  boxShadow: on ? `0 14px 34px ${ac}22` : "none", transition: "border-color .2s, box-shadow .2s",
                }}
              >
                <span style={{ display: "inline-block", width: 40, height: 40, borderRadius: 11, background: `${ac}18`, color: ac, display: "grid", placeItems: "center", fontFamily: "'Poppins'", fontWeight: 800, fontSize: 16 }}>
                  {(c.category?.name || c.title || "?").charAt(0)}
                </span>
                <span style={{ display: "block", fontFamily: "'Poppins'", fontWeight: 700, fontSize: 17, color: "#17171F", marginTop: 14, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                <span style={{ display: "block", fontSize: 13.5, color: "#63636F", marginTop: 6 }}>{c.category?.name || t("svc.service")}</span>
              </button>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
