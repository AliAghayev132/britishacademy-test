"use client";

// Swiper — davamlı (loop) hərəkətli tərəfdaş loqoları lenti.
// Struktur istənilən sayda loqonu qəbul edir; sonradan yeni tərəfdaşlar
// əlavə olunduqca avtomatik işləyəcək.
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";

function PartnerTile({ partner }) {
  const inner = (
    <div className="ba-partner" style={{ background: "#fff", border: "1px solid #ECEDF2", borderRadius: 14, height: 92, display: "grid", placeItems: "center", padding: 12 }}>
      {partner.logo ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={partner.logo} alt={partner.name} loading="lazy" style={{ maxHeight: 56, maxWidth: "86%", objectFit: "contain" }} />
      ) : (
        <span style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 15, color: "#54545F", textAlign: "center" }}>{partner.name}</span>
      )}
    </div>
  );
  return partner.url ? (
    <a href={partner.url} target="_blank" rel="noopener noreferrer" aria-label={partner.name} style={{ display: "block" }}>{inner}</a>
  ) : inner;
}

export default function PartnersCarousel({ partners = [] }) {
  if (!partners.length) return null;

  // Loop-un fasiləsiz görünməsi üçün az sayda loqonu təkrarlayırıq.
  const slides =
    partners.length < 8
      ? Array.from({ length: Math.ceil(8 / partners.length) }, () => partners).flat()
      : partners;

  return (
    <Swiper
      modules={[Autoplay, FreeMode]}
      slidesPerView="auto"
      spaceBetween={16}
      loop
      freeMode
      speed={4200}
      autoplay={{ delay: 0, disableOnInteraction: false, pauseOnMouseEnter: true }}
      style={{ padding: "6px 2px" }}
    >
      {slides.map((p, i) => (
        <SwiperSlide key={`${p._id || p.name}-${i}`} style={{ width: 200 }}>
          <PartnerTile partner={p} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
