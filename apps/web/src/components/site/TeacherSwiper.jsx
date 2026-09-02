"use client";

// ── Ana səhifədəki müəllim lenti ──
//
// Admin paneldən seçilmiş müəllimlər (isFeatured) göstərilir. Sıra HƏR AÇILIŞDA
// qarışdırılır ki, eyni adamlar həmişə birinci görünməsin — müəllim heyəti
// geniş olduğu üçün bu, hər dəfə fərqli üzlərin qabağa çıxmasını təmin edir.
//
// QARIŞDIRMA MOUNT-DA EDİLİR, render zamanı yox: server və klient fərqli sıra
// qursaydı React hidratasiya uyğunsuzluğu verərdi (#418). Ona görə ilk render
// serverdəki sıradadır, effekt işləyəndən sonra qarışır.

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { TeacherCard } from "./TeacherBrowser";

/** Bu həddən azdırsa swiper əvəzinə adi grid — boş slayd yeri qalmasın. */
const SWIPER_FROM = 4;

/** Fisher–Yates — massivi dəyişmədən qarışdırır. */
function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TeacherSwiper({ teachers = [] }) {
  const [items, setItems] = useState(teachers);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- qarışdırma yalnız klientdə olmalıdır, əks halda hidratasiya uyğunsuzluğu yaranır
    setItems(shuffle(teachers));
  }, [teachers]);

  if (!items.length) return null;

  if (items.length <= SWIPER_FROM) {
    return (
      <div
        className="grid-4"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
          gap: 18,
        }}
      >
        {items.map((t) => (
          <TeacherCard key={t._id} t={t} />
        ))}
      </div>
    );
  }

  return (
    <Swiper
      modules={[Navigation, Pagination]}
      navigation
      pagination={{ clickable: true }}
      spaceBetween={18}
      slidesPerView={1.15}
      breakpoints={{
        640: { slidesPerView: 2.2 },
        900: { slidesPerView: 3 },
        1200: { slidesPerView: 4 },
      }}
      style={{ paddingBottom: 46 }}
    >
      {items.map((t) => (
        <SwiperSlide key={t._id}>
          <TeacherCard t={t} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
