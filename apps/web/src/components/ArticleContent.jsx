"use client";

/**
 * ArticleContent — Tiptap-dan gələn HTML-i render edir və daxildəki bütün
 * `<img>` taqları üçün hover-da görünən download düyməsi və modal əlavə edir.
 *
 * İstifadə:
 *   <ArticleContent html={news.content} />
 *
 * Daxildə React effekt-i ilə bütün `<img>` elementlərini portala bağlanmış
 * download wrapper-i ilə əhatə edir. SSR-də adi HTML qaytarır (faydalı SEO).
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, X, Loader2 } from "lucide-react";
import EmblaCarousel from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  getOriginalImageUrl,
  hasOriginalVariant,
} from "@/utils/getOriginalImageUrl";
import { normalizeContentHtml } from "@/utils/normalizeContentHtml";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

export default function ArticleContent({ html: rawHtml = "", className = "" }) {
  const html = sanitizeHtml(normalizeContentHtml(rawHtml));
  const ref = useRef(null);
  const [target, setTarget] = useState(null); // {src, originalUrl, alt}

  useEffect(() => {
    if (!ref.current) return;
    const root = ref.current;
    const cleanups = [];

    const wrapImage = (img) => {
      if (!img || !img.parentNode) return;
      const src = img.getAttribute("src") || "";
      if (!hasOriginalVariant(src)) return;
      // Artıq wrap olunub
      if (img.parentElement?.classList.contains("dlimg-wrap")) return;
      // İçəridə wrap-edici button əlavə olunmuş bağlantı içindədirsə skip
      if (img.dataset.dlimgInit === "1") return;
      img.dataset.dlimgInit = "1";

      const computed = window.getComputedStyle(img);
      const display = computed.display === "block" ? "block" : "inline-block";

      const wrap = document.createElement("span");
      wrap.className = "dlimg-wrap";
      wrap.style.position = "relative";
      wrap.style.display = display;
      wrap.style.maxWidth = "100%";
      const floatVal = img.style.float || computed.float;
      if (floatVal && floatVal !== "none") wrap.style.float = floatVal;
      const margin = img.style.margin || "";
      if (margin) wrap.style.margin = margin;

      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Orijinal şəkli endir");
      btn.title = "Orijinal şəkli endir";
      Object.assign(btn.style, {
        position: "absolute",
        bottom: "10px",
        right: "10px",
        zIndex: "10",
        width: "36px",
        height: "36px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "9999px",
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        opacity: "0",
        transform: "translateY(4px)",
        transition: "opacity 200ms ease, transform 200ms ease, background 200ms",
        backdropFilter: "blur(4px)",
        padding: "0",
      });
      btn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

      const show = () => {
        btn.style.opacity = "1";
        btn.style.transform = "translateY(0)";
      };
      const hide = () => {
        btn.style.opacity = "0";
        btn.style.transform = "translateY(4px)";
      };
      const onClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setTarget({
          src,
          originalUrl: getOriginalImageUrl(src),
          alt: img.getAttribute("alt") || "",
        });
      };
      const onBtnHover = () => {
        btn.style.background = "rgba(0,0,0,0.85)";
      };
      const onBtnLeave = () => {
        btn.style.background = "rgba(0,0,0,0.6)";
      };

      wrap.addEventListener("mouseenter", show);
      wrap.addEventListener("mouseleave", hide);
      btn.addEventListener("focus", show);
      btn.addEventListener("blur", hide);
      btn.addEventListener("click", onClick);
      btn.addEventListener("mouseenter", onBtnHover);
      btn.addEventListener("mouseleave", onBtnLeave);

      wrap.appendChild(btn);

      cleanups.push(() => {
        wrap.removeEventListener("mouseenter", show);
        wrap.removeEventListener("mouseleave", hide);
        btn.removeEventListener("focus", show);
        btn.removeEventListener("blur", hide);
        btn.removeEventListener("click", onClick);
        btn.removeEventListener("mouseenter", onBtnHover);
        btn.removeEventListener("mouseleave", onBtnLeave);
      });
    };

    const scan = () => {
      root.querySelectorAll("img").forEach(wrapImage);
    };

    // İlk pass
    scan();

    // React `dangerouslySetInnerHTML` təkrar render edəndə və ya hər hansı
    // başqa skript DOM-a img əlavə etdikdə avtomatik wrap et.
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const m of mutations) {
        if (m.type === "childList" && m.addedNodes.length) {
          shouldScan = true;
          break;
        }
      }
      if (shouldScan) scan();
    });
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanups.forEach((fn) => fn());
    };
  }, [html]);

  /* ------------------------------------------------------------------ */
  /*  Math rendering (bug #1 fix)                                        */
  /*  The stored HTML only carries `data-latex`; render KaTeX from it.   */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!ref.current) return;
    const root = ref.current;

    root.querySelectorAll("[data-math-block]").forEach((el) => {
      const target = el.querySelector(".math-block-render") || el;
      try {
        katex.render(el.getAttribute("data-latex") || "", target, {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        target.textContent = el.getAttribute("data-latex") || "";
      }
    });

    root.querySelectorAll("[data-math-inline]").forEach((el) => {
      try {
        katex.render(el.getAttribute("data-latex") || "", el, {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        el.textContent = el.getAttribute("data-latex") || "";
      }
    });
  }, [html]);

  /* ------------------------------------------------------------------ */
  /*  Image slider initialization (Embla)                               */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!ref.current) return;
    const root = ref.current;
    const instances = new WeakMap();

    const initSlider = (el) => {
      if (!el || instances.has(el) || el.dataset.bduSliderInit === "1") return;
      const viewport = el.querySelector(".bdu-slider__viewport");
      const track = el.querySelector(".bdu-slider__track");
      if (!viewport || !track) return;

      el.dataset.bduSliderInit = "1";

      const autoplay = el.getAttribute("data-autoplay") === "1";
      const autoplayDelay = parseInt(el.getAttribute("data-autoplay-delay") || "4000", 10);
      const loop = el.getAttribute("data-loop") !== "0";
      const showNav = el.getAttribute("data-nav") !== "0";
      const showPagination = el.getAttribute("data-pagination") !== "0";
      const spv = parseInt(el.getAttribute("data-spv") || "1", 10) || 1;

      const plugins = [];
      if (autoplay) {
        plugins.push(
          Autoplay({
            delay: autoplayDelay,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          })
        );
      }

      let embla;
      try {
        embla = EmblaCarousel(
          viewport,
          {
            loop,
            align: "start",
            slidesToScroll: 1,
            containScroll: loop ? false : "trimSnaps",
          },
          plugins
        );
      } catch (err) {
        console.warn("Embla init failed:", err);
        return;
      }

      const slidesCount = track.children.length;

      // --- Navigation buttons ---
      let prevBtn, nextBtn;
      if (showNav && slidesCount > spv) {
        prevBtn = document.createElement("button");
        prevBtn.type = "button";
        prevBtn.className = "bdu-slider__btn bdu-slider__btn--prev";
        prevBtn.setAttribute("aria-label", "Əvvəlki");
        prevBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
        nextBtn = document.createElement("button");
        nextBtn.type = "button";
        nextBtn.className = "bdu-slider__btn bdu-slider__btn--next";
        nextBtn.setAttribute("aria-label", "Növbəti");
        nextBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

        const onPrev = () => embla.scrollPrev();
        const onNext = () => embla.scrollNext();
        prevBtn.addEventListener("click", onPrev);
        nextBtn.addEventListener("click", onNext);
        el.appendChild(prevBtn);
        el.appendChild(nextBtn);

        const updateBtnState = () => {
          if (loop) return;
          prevBtn.disabled = !embla.canScrollPrev();
          nextBtn.disabled = !embla.canScrollNext();
        };
        embla.on("select", updateBtnState);
        embla.on("reInit", updateBtnState);
        updateBtnState();
      }

      // --- Pagination dots ---
      let dotsContainer;
      const dots = [];
      if (showPagination && slidesCount > spv) {
        dotsContainer = document.createElement("div");
        dotsContainer.className = "bdu-slider__dots";
        const snapList = embla.scrollSnapList();
        snapList.forEach((_, i) => {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = "bdu-slider__dot";
          dot.setAttribute("aria-label", `Slayd ${i + 1}`);
          dot.addEventListener("click", () => embla.scrollTo(i));
          dotsContainer.appendChild(dot);
          dots.push(dot);
        });
        el.appendChild(dotsContainer);

        const updateDots = () => {
          const selected = embla.selectedScrollSnap();
          dots.forEach((d, i) =>
            d.classList.toggle("bdu-slider__dot--active", i === selected)
          );
        };
        embla.on("select", updateDots);
        embla.on("reInit", updateDots);
        updateDots();
      }

      instances.set(el, { embla, prevBtn, nextBtn, dotsContainer });
    };

    const initAll = () => {
      root.querySelectorAll(".bdu-slider").forEach(initSlider);
    };

    initAll();

    const obs = new MutationObserver((mutations) => {
      let should = false;
      for (const m of mutations) {
        if (m.type === "childList" && m.addedNodes.length) {
          should = true;
          break;
        }
      }
      if (should) initAll();
    });
    obs.observe(root, { childList: true, subtree: true });

    return () => {
      obs.disconnect();
      root.querySelectorAll(".bdu-slider").forEach((el) => {
        const inst = instances.get(el);
        if (inst?.embla) {
          try { inst.embla.destroy(); } catch {}
        }
        if (inst?.prevBtn) inst.prevBtn.remove();
        if (inst?.nextBtn) inst.nextBtn.remove();
        if (inst?.dotsContainer) inst.dotsContainer.remove();
        delete el.dataset.bduSliderInit;
      });
    };
  }, [html]);

  return (
    <>
      <div
        ref={ref}
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {target &&
        typeof document !== "undefined" &&
        createPortal(
          <DownloadModal
            src={target.src}
            originalUrl={target.originalUrl}
            alt={target.alt}
            onClose={() => setTarget(null)}
          />,
          document.body
        )}
    </>
  );
}

function DownloadModal({ src, originalUrl, alt, onClose }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(originalUrl);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = decodeURIComponent(originalUrl.split("/").pop() || "image");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      window.open(originalUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-secondary">Şəkili endir</h3>
          <button
            onClick={onClose}
            aria-label="Bağla"
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative w-full bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: 220 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="max-h-[50vh] w-auto h-auto object-contain" />
          </div>

          <div className="text-xs text-gray-500 break-all bg-gray-50 px-3 py-2 rounded-md font-mono">
            {originalUrl}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Bağla
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg
                         hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed
                         transition-colors flex items-center gap-2"
            >
              {downloading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Endirilir...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Orijinal şəkli endir
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
