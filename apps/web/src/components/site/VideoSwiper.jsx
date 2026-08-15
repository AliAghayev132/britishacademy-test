"use client";

// ── Tələbə videoları — Swiper (LOOPSUZ) ──
// Həm ana səhifədə, həm Tələbələrimiz səhifəsində istifadə olunur. Loop yoxdur
// (istifadəçi tələbi) — sonuncu slayda çatanda oxlar deaktiv olur.
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import VideoCard from "./VideoCard";

export default function VideoSwiper({ videos = [] }) {
  if (!videos.length) return null;
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
