"use client";

// ── File upload ──
// Xam URL sahələrini əvəz edir. Şəkil/video media API-yə real gedişat çubuğu
// ilə yüklənir, qayıdan URL saxlanılır.
//
// `spec` verilsə (lib/imageSpecs.js) iki şey əlavə olunur:
//   1) sahənin altında "harada görünür + tövsiyə olunan ölçü" yazısı
//   2) fayl seçiləndən sonra KƏSMƏ dialoqu — nisbət kilidli, object-fit
//      (cover/contain) seçimi, zoom, döndərmə, fon rəngi
// Beləcə admin şəklin saytda necə görünəcəyini əvvəlcədən görür və düzgün
// ölçüdə yükləyir (əvvəl istənilən ölçü gedirdi, kart-kart fərqli görünürdü).

// React
import { useRef, useState } from "react";
// UI
import { ImageCropper } from "./ImageCropper";
// Utils
import { uploadWithProgress } from "@/utils/uploadWithProgress";
import { getImageUrl } from "@/utils/getImageUrl";
import { API_URL } from "@/lib/variables";
import { specSummary } from "@/lib/imageSpecs";
// Icons
import { UploadCloud, X, Crop, Info } from "lucide-react";

export function FileUpload({ value, onChange, kind = "image", spec }) {
  const inputRef = useRef(null);
  const [pct, setPct] = useState(null); // null = boşdayanma
  const [err, setErr] = useState("");
  const [cropFile, setCropFile] = useState(null); // kəsmə gözləyən fayl

  const isVideo = kind === "video";
  const endpoint = isVideo ? "/api/media/upload-video" : "/api/media/upload-image";
  const fieldName = isVideo ? "video" : "image";
  const uploading = pct !== null;
  const canCrop = !isVideo && Boolean(spec);

  const pick = () => inputRef.current?.click();

  /** Faylı serverə göndər. */
  const upload = async (file) => {
    setErr("");
    setPct(0);
    try {
      const fd = new FormData();
      fd.append(fieldName, file);
      const res = await uploadWithProgress(`${API_URL}${endpoint}`, fd, (p) => setPct(p));
      const url = res?.data?.url;
      if (!url) throw new Error("Server URL qaytarmadı");
      onChange(url);
      setCropFile(null);
    } catch (e) {
      setErr(e?.message || "Yüklənmə alınmadı");
    } finally {
      setPct(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Spesifikasiya varsa əvvəlcə kəsmə dialoqu açılır.
    if (canCrop) {
      setCropFile(file);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    await upload(file);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={isVideo ? "video/*" : "image/*"}
        onChange={onFile}
        className="hidden"
      />

      {value && !uploading ? (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-2">
          {isVideo ? (
            <video src={getImageUrl(value)} className="h-14 w-24 rounded bg-black object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getImageUrl(value)}
              alt=""
              className={`h-14 w-14 rounded bg-gray-50 ${spec?.fit === "contain" ? "object-contain p-1" : "object-cover"}`}
            />
          )}
          <div className="min-w-0 flex-1 truncate text-xs text-gray-500">{value}</div>
          <button
            type="button"
            onClick={pick}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Dəyiş
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50"
            aria-label="Sil"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-5 text-sm font-medium text-gray-500 transition-colors hover:border-[#00157A] hover:text-[#00157A] disabled:opacity-60"
        >
          {canCrop ? <Crop className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
          {uploading ? `Yüklənir… ${pct}%` : isVideo ? "Video yüklə" : canCrop ? "Şəkil seç və kəs" : "Şəkil yüklə"}
        </button>
      )}

      {/* Spesifikasiya — admin harada nə görünəcəyini bilsin */}
      {spec && (
        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-gray-500">
          <Info className="mt-0.5 h-3 w-3 flex-none text-gray-400" />
          <span>
            <span className="font-semibold text-gray-700">{specSummary(spec)}</span>
            {" — "}{spec.where}
            {spec.note && <span className="block text-gray-400">{spec.note}</span>}
          </span>
        </div>
      )}

      {uploading && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-[#00157A] transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      {err && <div className="mt-1 text-xs font-semibold text-red-600">{err}</div>}

      {cropFile && (
        <ImageCropper
          file={cropFile}
          spec={spec}
          busy={uploading}
          onCancel={() => setCropFile(null)}
          onDone={upload}
        />
      )}
    </div>
  );
}
