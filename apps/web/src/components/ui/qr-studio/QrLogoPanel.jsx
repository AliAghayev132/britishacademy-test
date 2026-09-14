"use client";

// React
import { useRef } from "react";

// Icons
import { Upload } from "lucide-react";

// Local
import { notify } from "../feedback";
import { Slider } from "../Slider";
import QrChoice from "./QrChoice";
import QrRow from "./QrRow";
import qrStudioConfig from "./qrStudioConfig";

const { LOGO_SHAPES } = qrStudioConfig;

/**
 * Ortadakı logo: hazır nişan/logo, öz faylı, ölçü və altlıq forması.
 *
 * @param {Function} setCustomData  yüklənmiş faylın data URL-i studiyada saxlanılır
 */
export default function QrLogoPanel({ o, set, setCustomData, logoData, logoMax, logoSafe }) {
  const fileRef = useRef(null);

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return notify.error("Yalnız şəkil faylı");
    if (file.size > 2 * 1024 * 1024) return notify.error("Şəkil 2 MB-dan böyük olmamalıdır");
    const fr = new FileReader();
    fr.onload = () => {
      setCustomData(String(fr.result));
      set("logoKey", "custom");
    };
    fr.onerror = () => notify.error("Fayl oxunmadı");
    fr.readAsDataURL(file);
  };

  return (
    <>
      <QrRow
        label="Ortadakı logo"
        hint="Kvadrat nişan mərkəzdə ən yaxşı oturur — uzun logo eyni təhlükəsizlikdə daha kiçik qalır."
      >
        <div className="flex flex-wrap gap-1.5">
          {[
            ["none", "Yoxdur"],
            ["shield", "Nişan"],
            ["logo", "Logo"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => set("logoKey", key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                o.logoKey === key
                  ? "border-[#00157A] bg-[#00157A] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              o.logoKey === "custom"
                ? "border-[#00157A] bg-[#00157A] text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <Upload className="h-3.5 w-3.5" /> Yüklə
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={pickFile}
            className="hidden"
          />
        </div>
      </QrRow>

      {logoData && (
        <div className="grid gap-4 sm:grid-cols-2">
          <QrRow
            label={`Logo ölçüsü — ${Math.round(Math.min(o.logoScale, logoMax) * 100)}%`}
            hint={`Təhlükəsiz hədd ${Math.round(logoSafe * 100)}%.`}
          >
            <Slider
              min={8}
              max={Math.round(logoMax * 100)}
              value={Math.round(Math.min(o.logoScale, logoMax) * 100)}
              onChange={(e) => set("logoScale", Number(e.target.value) / 100)}
              className="w-full"
              ariaLabel="Logo ölçüsü"
            />
          </QrRow>
          <QrRow label="Logo altlığı">
            <QrChoice
              options={LOGO_SHAPES}
              value={o.logoShape}
              onChange={(v) => set("logoShape", v)}
            />
          </QrRow>
        </div>
      )}
    </>
  );
}
