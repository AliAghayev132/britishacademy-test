"use client";

// ── Tələbə videoları ──
// 4 və daha az video olanda adi grid (swiper-ə ehtiyac yoxdur — oxlar boş yerə
// görünürdü), 4-dən çox olanda LOOPSUZ swiper. Həm ana səhifədə, həm
// Tələbələrimiz səhifəsində istifadə olunur.
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import VideoCard from "./VideoCard";

// Bu həddən sonra swiper-ə keçilir.
const SWIPER_FROM = 4;

export default function VideoSwiper({ videos = [] }) {
  if (!videos.length) return null;

  // Az sayda videoda sadə grid daha yaxşı görünür (boş slayd yeri qalmır).
  if (videos.length <= SWIPER_FROM) {
    return (
      <div
        className="grid-4"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${videos.length}, minmax(0, 1fr))`,
          gap: 18,
        }}
      >
        {videos.map((t) => (
          <VideoCard key={t._id} t={t} />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        "--swiper-navigation-color": "var(--accent)",
        "--swiper-pagination-color": "var(--accent)",
        "--swiper-navigation-size": "26px",
      }}
    >
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={18}
        slidesPerView={1.15}
        navigation
        pagination={{ clickable: true }}
        breakpoints={{
          560: { slidesPerView: 2 },
          900: { slidesPerView: 3 },
          1200: { slidesPerView: 4 },
        }}
        style={{ padding: "4px 2px 46px" }}
      >
        {videos.map((t) => (
          <SwiperSlide key={t._id} style={{ height: "auto" }}>
            <VideoCard t={t} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
