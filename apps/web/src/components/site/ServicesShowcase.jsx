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
    // Xarici sarğı yalnız BOŞLUQ verir: mavi panel marquee lentinə yapışmır,
    // ağ ara ilə ondan ayrılır və müstəqil blok kimi oxunur.
    <section style={{ ...wrap, padding: "62px 28px 0" }}>
      <div className="ba-svcband ba-reveal">
        {/* Bulanıq işıq ləkələri. Ayrıca elementdədir, çünki `filter: blur()`
            valideynə verilsə İÇİNDƏKİ kartlar və mətn də bulanardı. */}
        <span className="ba-svcband-glow" aria-hidden="true" />

        <div className="ba-svcband-in">
          {/* Başlıq + "Bütün xidmətlər" düyməsi (sağ yuxarı) */}
          <div className="ba-svcband-head">
            <div>
              <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(26px,3.4vw,40px)", letterSpacing: "-.02em", margin: 0, lineHeight: 1.1, color: "#fff" }}>{title}</h2>
              {sub && <div style={{ color: "rgba(255,255,255,.58)", fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(17px,2.2vw,23px)", lineHeight: 1.2, marginTop: 4 }}>{sub}</div>}
            </div>
            {/* Mavi fonda mavi düymə itərdi — ağ fon, mavi yazı. */}
            <Link
              href={allHref}
              className="ba-svcband-all"
              style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "var(--accent)", fontWeight: 700, fontSize: 14.5, padding: "12px 22px", borderRadius: 99, whiteSpace: "nowrap" }}
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
            style={{ padding: "4px 4px 6px" }}
          >
            {courses.map((c) => (
              // `height: auto` + CSS-dəki `stretch` — kartlar ƏN HÜNDÜRÜ qədər
              // uzanır, altları düz sırada bitir. Onsuz kateqoriya adı iki sətrə
              // düşən kart qonşularından hündür qalırdı.
              <SwiperSlide key={c._id} style={{ height: "auto" }}>
                <CourseCard course={c} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
