"use client";

// ── File upload ──
// Replaces raw URL inputs. Uploads an image/video to the media API with a real
// progress bar (long uploads show %), stores the returned URL. Shows a preview
// + "change" / "remove" once uploaded.

// React
import { useRef, useState } from "react";
// Utils
import { uploadWithProgress } from "@/utils/uploadWithProgress";
import { getImageUrl } from "@/utils/getImageUrl";
import { API_URL } from "@/lib/variables";
// Icons
import { UploadCloud, X } from "lucide-react";

export function FileUpload({ value, onChange, kind = "image" }) {
  const inputRef = useRef(null);
  const [pct, setPct] = useState(null); // null = idle
  const [err, setErr] = useState("");

  const isVideo = kind === "video";
  const endpoint = isVideo ? "/api/media/upload-video" : "/api/media/upload-image";
  const fieldName = isVideo ? "video" : "image";
  const uploading = pct !== null;

  const pick = () => inputRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setPct(0);
    try {
      const fd = new FormData();
      fd.append(fieldName, file);
      const res = await uploadWithProgress(`${API_URL}${endpoint}`, fd, (p) => setPct(p));
      const url = res?.data?.url;
      if (!url) throw new Error("Server URL qaytarmadı");
      onChange(url);
    } catch (e2) {
      setErr(e2?.message || "Yüklənmə alınmadı");
    } finally {
      setPct(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept={isVideo ? "video/*" : "image/*"} onChange={onFile} className="hidden" />

      {value && !uploading ? (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-2">
          {isVideo ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={getImageUrl(value)} className="h-14 w-24 rounded bg-black object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getImageUrl(value)} alt="" className="h-14 w-14 rounded object-cover" />
          )}
          <div className="min-w-0 flex-1 truncate text-xs text-gray-500">{value}</div>
          <button type="button" onClick={pick} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50">Dəyiş</button>
          <button type="button" onClick={() => onChange("")} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" aria-label="Sil"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-5 text-sm font-medium text-gray-500 transition-colors hover:border-[#00157A] hover:text-[#00157A] disabled:opacity-60"
        >
          <UploadCloud className="h-5 w-5" />
          {uploading ? `Yüklənir… ${pct}%` : isVideo ? "Video yüklə" : "Şəkil yüklə"}
        </button>
      )}

      {uploading && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-[#00157A] transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      {err && <div className="mt-1 text-xs font-semibold text-red-600">{err}</div>}
    </div>
  );
}
