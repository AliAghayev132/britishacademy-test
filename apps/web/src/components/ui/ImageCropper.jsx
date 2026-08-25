"use client";

// ── Şəkil kəsmə (crop) dialoqu — native, kitabxanasız ──
//
// Yanaşma: çərçivə SABİTDİR, şəkil onun altında hərəkət edir və miqyaslanır
// (Instagram/avatar kəsicilərindəki klassik model). Sürüklənən künc tutacaqları
// olan modeldən daha az səhv verir və toxunma ekranlarında rahatdır.
//
// WYSIWYG zəmanəti: önizləmə və ixrac EYNİ çəkmə funksiyasından keçir
// (`paint`) — yalnız hədəf ölçü fərqlidir. Yəni gördüyünüz nəticə alınır.
//
// Rejimlər:
//   cover   → şəkil çərçivəni doldurur, artığı kəsilir (fotolar üçün)
//   contain → şəkil tam sığır, boşluq seçilmiş fonla doldurulur (loqo, maskot)
//
// Şəffaflıq: `transparent` spesifikasiyada işarələnibsə və fon «şəffaf»
// seçilibsə çıxış PNG olur; əks halda daha yüngül JPEG/WebP seçilir.

// React
import { useCallback, useEffect, useRef, useState } from "react";
// UI
import {
  X, ZoomIn, ZoomOut, RotateCw, RotateCcw, Check, Maximize2, Crop as CropIcon, Loader2,
} from "lucide-react";
// Utils
import { specSummary } from "@/lib/imageSpecs";

// Çərçivənin ekrandakı maksimum ölçüsü (nisbət spesifikasiyadan gəlir)
const FRAME_MAX = 460;

const RATIOS = [
  { id: "spec", label: "Tövsiyə" },
  { id: "1:1", label: "1:1", v: 1 },
  { id: "4:3", label: "4:3", v: 4 / 3 },
  { id: "16:10", label: "16:10", v: 16 / 10 },
  { id: "16:9", label: "16:9", v: 16 / 9 },
  { id: "3:4", label: "3:4", v: 3 / 4 },
  { id: "free", label: "Sərbəst" },
];

const BACKGROUNDS = [
  { id: "transparent", label: "Şəffaf", css: "repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 50%/12px 12px" },
  { id: "#ffffff", label: "Ağ", css: "#ffffff" },
  { id: "#00157A", label: "Navy", css: "#00157A" },
  { id: "#F5F6FA", label: "Açıq boz", css: "#F5F6FA" },
];

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

export function ImageCropper({ file, spec, onCancel, onDone, busy }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null);

  const [img, setImg] = useState(null);       // HTMLImageElement
  const [ratioId, setRatioId] = useState("spec");
  const [fit, setFit] = useState(spec?.fit || "cover");
  const [bg, setBg] = useState(spec?.transparent ? "transparent" : "#ffffff");
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);           // 0 | 90 | 180 | 270
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [outSize, setOutSize] = useState(null); // təxmini fayl ölçüsü

  // ── Şəkli yüklə ──
  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      imgRef.current = im;
      setImg(im);
      setZoom(1);
      setRot(0);
      setOff({ x: 0, y: 0 });
    };
    im.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ── Çərçivə nisbəti ──
  const specRatio = spec ? spec.w / spec.h : 1;
  const ratioOpt = RATIOS.find((r) => r.id === ratioId);
  const ratio =
    ratioId === "spec" ? specRatio
      : ratioId === "free" ? (img ? img.naturalWidth / img.naturalHeight : 1)
        : ratioOpt?.v || 1;

  const frameW = ratio >= 1 ? FRAME_MAX : Math.round(FRAME_MAX * ratio);
  const frameH = ratio >= 1 ? Math.round(FRAME_MAX / ratio) : FRAME_MAX;

  // ── Çəkmə: önizləmə və ixrac üçün EYNİ funksiya ──
  const paint = useCallback(
    (ctx, W, H) => {
      const im = imgRef.current;
      if (!im) return;
      const k = W / frameW; // ekran → hədəf miqyas əmsalı

      ctx.clearRect(0, 0, W, H);
      if (bg !== "transparent") {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
      }

      // Döndərmə 90/270-də şəklin en/hündürlüyü yer dəyişir
      const swap = rot === 90 || rot === 270;
      const iw = swap ? im.naturalHeight : im.naturalWidth;
      const ih = swap ? im.naturalWidth : im.naturalHeight;

      // Bazis miqyas: cover → doldurur, contain → sığdırır
      const base =
        fit === "cover"
          ? Math.max(W / iw, H / ih)
          : Math.min(W / iw, H / ih);
      const s = base * zoom;

      ctx.save();
      ctx.translate(W / 2 + off.x * k, H / 2 + off.y * k);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.imageSmoothingQuality = "high";
      // Döndərmədən sonra orijinal en/hündürlüklə çəkirik
      const dw = im.naturalWidth * s;
      const dh = im.naturalHeight * s;
      ctx.drawImage(im, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    },
    [bg, fit, zoom, rot, off, frameW],
  );

  // ── Önizləməni yenilə ──
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !img) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = frameW * dpr;
    c.height = frameH * dpr;
    c.style.width = `${frameW}px`;
    c.style.height = `${frameH}px`;
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint(ctx, frameW, frameH);
  }, [img, frameW, frameH, paint]);

  // ── Sürükləmə (pointer — siçan və toxunma birlikdə) ──
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: off.x, oy: off.y };
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    setOff({ x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) });
  };
  const onPointerUp = (e) => {
    dragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  // Təkərlə zoom (səhifə sürüşməsin)
  const onWheel = (e) => {
    e.preventDefault();
    setZoom((z) => clamp(z * (e.deltaY < 0 ? 1.08 : 1 / 1.08), 0.2, 6));
  };

  const reset = () => { setZoom(1); setRot(0); setOff({ x: 0, y: 0 }); };

  // ── Çıxış ölçüsü ──
  const target = (() => {
    if (!spec) return { w: frameW * 2, h: frameH * 2 };
    if (ratioId === "spec") return { w: spec.w, h: spec.h };
    // Başqa nisbət seçilibsə uzun tərəfi spesifikasiyanın uzun tərəfinə bərabərləşdir
    const long = Math.max(spec.w, spec.h);
    return ratio >= 1
      ? { w: long, h: Math.round(long / ratio) }
      : { w: Math.round(long * ratio), h: long };
  })();

  /** Kətanı blob-a çevir (şəffaflıq lazımdırsa PNG, əks halda daha yüngül format). */
  const toBlob = useCallback(async () => {
    const c = document.createElement("canvas");
    c.width = target.w;
    c.height = target.h;
    const ctx = c.getContext("2d");
    paint(ctx, target.w, target.h);

    const needsAlpha = bg === "transparent";
    const type = needsAlpha ? "image/png" : "image/webp";
    const quality = needsAlpha ? undefined : 0.9;
    const blob = await new Promise((res) => c.toBlob(res, type, quality));
    // WebP dəstəklənmirsə JPEG-ə düş
    if (!blob || (!needsAlpha && blob.type !== "image/webp")) {
      return new Promise((res) => c.toBlob(res, needsAlpha ? "image/png" : "image/jpeg", 0.9));
    }
    return blob;
  }, [paint, target.w, target.h, bg]);

  // Təxmini fayl ölçüsünü göstər (dəyişikliklərdən sonra gecikməli)
  useEffect(() => {
    if (!img) return undefined;
    const t = setTimeout(async () => {
      const b = await toBlob().catch(() => null);
      if (b) setOutSize(b.size);
    }, 350);
    return () => clearTimeout(t);
  }, [img, toBlob]);

  const confirm = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const ext = blob.type.split("/")[1].replace("jpeg", "jpg");
    const base = (file?.name || "sekil").replace(/\.[^.]+$/, "");
    onDone(new File([blob], `${base}.${ext}`, { type: blob.type }));
  };

  const kb = outSize ? Math.round(outSize / 1024) : null;
  const bgOpt = BACKGROUNDS.find((b) => b.id === bg);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div className="ba-pop flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Başlıq */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
              <CropIcon className="h-4 w-4 text-blue-900" /> Şəkli tənzimlə
            </h2>
            {spec && (
              <p className="mt-0.5 truncate text-xs text-gray-500">
                {spec.where} · <span className="font-semibold text-gray-700">{specSummary(spec)}</span>
              </p>
            )}
          </div>
          <button onClick={onCancel} className="flex-none text-gray-400 transition hover:text-gray-700" aria-label="Bağla">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {!img ? (
            <div className="flex h-64 items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Şəkil yüklənir…
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {/* Kətan — sabit çərçivə, şəkil altında hərəkət edir */}
              <div
                className="relative touch-none overflow-hidden rounded-xl border-2 border-dashed border-blue-300"
                style={{ background: bgOpt?.css || bg, width: frameW, height: frameH, cursor: "grab" }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
              >
                <canvas ref={canvasRef} className="block select-none" />
                {/* Üçdə-bir bələdçiləri */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-y-0 left-1/3 w-px bg-white/40" />
                  <div className="absolute inset-y-0 left-2/3 w-px bg-white/40" />
                  <div className="absolute inset-x-0 top-1/3 h-px bg-white/40" />
                  <div className="absolute inset-x-0 top-2/3 h-px bg-white/40" />
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Şəkli sürüşdürərək yerini dəyiş · təkərlə böyüt-kiçilt
              </p>

              {/* İdarəetmə */}
              <div className="w-full max-w-lg space-y-4">
                {/* Zoom */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setZoom((z) => clamp(z / 1.15, 0.2, 6))}
                    className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50"
                    aria-label="Kiçilt"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <input
                    type="range" min="0.2" max="6" step="0.01" value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-900"
                  />
                  <button
                    onClick={() => setZoom((z) => clamp(z * 1.15, 0.2, 6))}
                    className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50"
                    aria-label="Böyüt"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-right font-mono text-xs text-gray-500">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                {/* Yerləşdirmə rejimi */}
                <div>
                  <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Yerləşdirmə (object-fit)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "cover", t: "Doldur (cover)", d: "Çərçivəni doldurur, artığı kəsilir" },
                      { id: "contain", t: "Sığdır (contain)", d: "Tam görünür, boşluq fonla dolur" },
                    ].map((o) => (
                      <button
                        key={o.id}
                        onClick={() => { setFit(o.id); setOff({ x: 0, y: 0 }); setZoom(1); }}
                        className={`rounded-lg border p-2.5 text-left transition ${
                          fit === o.id
                            ? "border-blue-900 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className={`text-sm font-semibold ${fit === o.id ? "text-blue-900" : "text-gray-700"}`}>
                          {o.t}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">{o.d}</div>
                      </button>
                    ))}
                  </div>
                  {spec && fit !== spec.fit && (
                    <p className="mt-1.5 text-xs font-medium text-amber-600">
                      Bu sahə üçün tövsiyə: <b>{spec.fit === "cover" ? "Doldur" : "Sığdır"}</b>
                    </p>
                  )}
                </div>

                {/* Nisbət */}
                <div>
                  <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">Nisbət</div>
                  <div className="flex flex-wrap gap-1.5">
                    {RATIOS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => { setRatioId(r.id); setOff({ x: 0, y: 0 }); }}
                        className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                          ratioId === r.id ? "bg-blue-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {r.id === "spec" && spec ? `${spec.w}×${spec.h}` : r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fon — yalnız contain rejimində məna daşıyır */}
                {fit === "contain" && (
                  <div>
                    <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                      Boşluğun fonu
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {BACKGROUNDS.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setBg(b.id)}
                          title={b.label}
                          className={`h-8 w-8 rounded-lg border-2 transition ${
                            bg === b.id ? "border-blue-900 ring-2 ring-blue-200" : "border-gray-200"
                          }`}
                          style={{ background: b.css }}
                        />
                      ))}
                      <span className="self-center text-xs text-gray-500">{bgOpt?.label}</span>
                    </div>
                  </div>
                )}

                {/* Döndər / sıfırla */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setRot((r) => (r + 270) % 360)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Sola
                  </button>
                  <button
                    onClick={() => setRot((r) => (r + 90) % 360)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <RotateCw className="h-3.5 w-3.5" /> Sağa
                  </button>
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <Maximize2 className="h-3.5 w-3.5" /> Sıfırla
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alt panel */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
          <div className="text-xs text-gray-500">
            Çıxış: <span className="font-mono font-semibold text-gray-700">{target.w}×{target.h}</span>
            {kb != null && <> · ~<span className="font-semibold">{kb} KB</span></>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              İmtina
            </button>
            <button
              onClick={confirm}
              disabled={!img || busy}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {busy ? "Yüklənir…" : "Kəs və yüklə"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
