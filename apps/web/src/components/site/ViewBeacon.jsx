"use client";

// React
import { useEffect } from "react";

const RAW = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const ENDPOINT = `${RAW ? `${RAW}/api` : "/api"}/views`;

/**
 * Detal səhifəsinin baxışını sayır (kurs, müəllim, ölkə, layihə, bloq).
 *
 * ── NİYƏ BRAUZERDƏN ──
 * Əvvəl sayğac API-nin GET cavabının içində artırılırdı. Next həmin cavabı
 * 60 saniyə keşləyir — populyar səhifə dəqiqədə ən çox BİR baxış yazırdı,
 * botlar isə rəqəmi şişirdirdi. İndi baxış səhifə brauzerdə açılanda sayılır;
 * eyni sessiyada eyni səhifənin yenilənməsi təkrar sayılmır, botları server
 * atır (bax api eventController.view).
 *
 * `slug` səhifənin DB məlumatından gəlir — EN/RU ünvanlarında slug
 * lokallaşdırıla bilər, ünvandan götürmək etibarlı olmazdı.
 */
export function ViewBeacon({ type, slug }) {
  useEffect(() => {
    if (!type || !slug) return;
    const key = `ba-view:${type}:${slug}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      /* gizli rejim — hər açılış sayılır, server onsuz da botları atır */
    }
    fetch(ENDPOINT, {
      method: "POST",
      keepalive: true,
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, slug }),
    }).catch(() => {});
  }, [type, slug]);

  return null;
}
