"use client";

import { useEffect } from "react";
import { playSfx } from "@/lib/sfx";

/**
 * Drives the homepage scroll reveals. The reveal CSS already lives in
 * globals.css (`.ba-reveal` → `.is-visible`, and `body.ba-home.ba-fx .ba-sg`
 * staggered groups → `.is-in`). This mounts an IntersectionObserver that flips
 * those classes as elements enter the viewport, and adds `ba-fx` to <body>
 * (some reveal rules are gated on `body.ba-home.ba-fx`). Renders nothing.
 */
export default function RevealOnScroll() {
  useEffect(() => {
    document.body.classList.add("ba-fx");

    const els = document.querySelectorAll(".ba-reveal, .ba-sg");

    const show = (el) => {
      el.classList.add("is-visible");
      if (el.classList.contains("ba-sg")) el.classList.add("is-in");
    };

    // Graceful fallback: no IO → just reveal everything immediately.
    if (typeof IntersectionObserver === "undefined") {
      els.forEach(show);
      return () => document.body.classList.remove("ba-fx");
    }

    // Səs yalnız İSTİFADƏÇİ scroll edəndə — səhifə açılanda ekranda olan
    // bölmələr üçün çalınmır. Hər yeni bölmə pentatonik pillədə növbəti not.
    let scrolled = false;
    let n = 0;
    const onScroll = () => { scrolled = true; };
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            show(e.target);
            io.unobserve(e.target);
            if (scrolled) playSfx("reveal", n++);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    els.forEach((el) => io.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      document.body.classList.remove("ba-fx");
    };
  }, []);

  return null;
}
