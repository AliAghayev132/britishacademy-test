"use client";

// React
import { useState } from "react";

// Icons
import { Download, Copy, Check } from "lucide-react";

// Hooks
import { useFlash } from "@/hooks";

// Lib
import { planQr, renderSvg, drawQr, loadImage, downloadBlob } from "@/lib";

// Local
import { notify } from "../feedback";

/**
 * Endirmə (PNG/SVG/JPG) və şəkli buferə kopyalama.
 *
 * @param {object} opts  həll olunmuş çəkiliş parametrləri (logo data URL ilə)
 * @param {number} size  plan hesablanmayanda fayl adına düşən ölçü
 */
export default function QrExportActions({ value, name, opts, plan, size }) {
  const [copied, flashCopied] = useFlash(false);
  const [busy, setBusy] = useState("");

  const raster = async (mime, ext) => {
    setBusy(ext);
    try {
      const p = planQr(value, opts);
      const img = await loadImage(opts.logo);
      const canvas = document.createElement("canvas");
      drawQr(canvas, p, img, mime === "image/jpeg");
      const blob = await new Promise((res) => canvas.toBlob(res, mime, 0.92));
      if (!blob) throw new Error("Şəkil hazırlanmadı");
      return blob;
    } finally {
      setBusy("");
    }
  };

  const save = async (fmt) => {
    const base = `qr-${name || "link"}`;
    try {
      if (fmt === "svg") {
        const blob = new Blob([renderSvg(value, opts)], { type: "image/svg+xml;charset=utf-8" });
        downloadBlob(blob, `${base}.svg`);
        return;
      }
      const mime = fmt === "jpg" ? "image/jpeg" : "image/png";
      const blob = await raster(mime, fmt);
      downloadBlob(blob, `${base}-${plan?.width || size}.${fmt}`);
    } catch (e) {
      notify.error(e?.message || "Endirilə bilmədi");
    }
  };

  const copyImage = async () => {
    try {
      const blob = await raster("image/png", "copy");
      await navigator.clipboard.write([new window.ClipboardItem({ "image/png": blob })]);
      flashCopied();
    } catch {
      notify.error("Brauzer şəkil kopyalamağı dəstəkləmir — faylı endir");
    }
  };

  return (
    <>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["png", "PNG"],
          ["svg", "SVG"],
          ["jpg", "JPG"],
        ].map(([fmt, label]) => (
          <button
            key={fmt}
            onClick={() => save(fmt)}
            disabled={busy === fmt}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#00157A] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#001a99] disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            {busy === fmt ? "…" : label}
          </button>
        ))}
      </div>
      <button
        onClick={copyImage}
        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" /> Kopyalandı
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> Şəkli kopyala
          </>
        )}
      </button>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-gray-400">
        SVG vektordur — çapda istənilən ölçüyə böyüdülə bilər.
        JPG şəffaflığı saxlamır.
      </p>
    </>
  );
}
