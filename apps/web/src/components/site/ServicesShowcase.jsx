"use client";

// Homepage "Kurslarımız" bölməsi — əvvəlki CourseCard dizaynı, Swiper loop
// carousel-də fırlanır. Sağ yuxarıda "Bütün xidmətlər" düyməsi.
import { LocaleLink as Link } from "./LocaleLink";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { CourseCard } from "./cards";
import { useT } from "@/lib/i18n/useT";

const wrap = { maxWidth: 1240, margin: "0 auto", padding: "0 28px" };

export default function ServicesShowcase({
  courses = [],
  title,
  sub,
  allHref = "/kurslar",
  allLabel,
}) {
  const t = useT();
  if (!courses.length) return null;

  title = title || t("home.courses.title");
  sub = sub || t("home.courses.sub");
  allLabel = allLabel || t("svc.all");

  return (
    // Tam enli mavi lent — `wrap` içəridəki sarğıya keçir ki, fon kənardan
    // kənara getsin, məzmun isə 1240px-də qalsın.
    <section className="ba-svcband">
      {/* Bulanıq işıq ləkələri. Ayrıca elementdədir, çünki `filter: blur()`
          valideynə verilsə İÇİNDƏKİ kartlar və mətn də bulanardı. */}
      <span className="ba-svcband-glow" aria-hidden="true" />

      <div className="ba-reveal" style={{ ...wrap, position: "relative", zIndex: 1, padding: "84px 28px 92px" }}>
      {/* Başlıq + "Bütün xidmətlər" düyməsi (sağ yuxarı) */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 34 }}>
        <div>
          <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(28px,4vw,44px)", letterSpacing: "-.02em", margin: 0, lineHeight: 1.08, color: "#fff" }}>{title}</h2>
          {sub && <div style={{ color: "rgba(255,255,255,.62)", fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(20px,3vw,30px)", lineHeight: 1.1 }}>{sub}</div>}
        </div>
        {/* Mavi fonda mavi düymə itərdi — ağ fon, mavi yazı. */}
        <Link
          href={allHref}
          className="ba-svcband-all"
          style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "var(--accent)", fontWeight: 700, fontSize: 14.5, padding: "12px 20px", borderRadius: 99, whiteSpace: "nowrap" }}
        >
          {allLabel} →
        </Link>
      </div>

      {/* Kartlar — əvvəlki dizayn, Swiper loop ilə fırlanır */}
      <Swiper
        modules={[Autoplay]}
        spaceBetween={18}
        loop={courses.length > 3}
        grabCursor
        autoplay={{ delay: 3200, disableOnInteraction: false, pauseOnMouseEnter: true }}
        breakpoints={{
          0: { slidesPerView: 1.1 },
          560: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        style={{ padding: "6px 4px 8px" }}
      >
        {courses.map((c) => (
          <SwiperSlide key={c._id} style={{ height: "auto" }}>
            <CourseCard course={c} />
          </SwiperSlide>
        ))}
      </Swiper>
      </div>
    </section>
  );
}
