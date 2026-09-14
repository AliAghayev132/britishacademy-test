"use client";

// Local
import { Checkbox } from "../Checkbox";
import { ColorInput } from "../ColorInput";
import { Slider } from "../Slider";
import QrChoice from "./QrChoice";
import QrRow from "./QrRow";
import qrStudioConfig from "./qrStudioConfig";

const { SIZES, MODULE_STYLES, EYE_STYLES, SWATCHES } = qrStudioConfig;

/** Ölçü, forma, rəng, fon və alt yazı tənzimləmələri. */
export default function QrStylePanel({ o, set, title }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <QrRow label="Ölçü (px)" hint="SVG-yə təsir etmir — o, vektordur.">
          <QrChoice options={SIZES} value={o.size} onChange={(v) => set("size", v)} />
        </QrRow>
        <QrRow label="Kənar boşluq" hint="Standart 4 moduldur; azaldılsa skan çətinləşir.">
          <Slider
            min={0}
            max={8}
            value={o.margin}
            onChange={(e) => set("margin", Number(e.target.value))}
            className="w-full"
            ariaLabel="Kənar boşluq"
          />
        </QrRow>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <QrRow label="Nöqtə forması">
          <QrChoice
            options={MODULE_STYLES}
            value={o.moduleStyle}
            onChange={(v) => set("moduleStyle", v)}
          />
        </QrRow>
        <QrRow label="Künc gözləri">
          <QrChoice options={EYE_STYLES} value={o.eyeStyle} onChange={(v) => set("eyeStyle", v)} />
        </QrRow>
      </div>

      <QrRow label="Rəng" hint="Tünd rəng açıq fonda olmalıdır — əks halda skaner kodu tanımır.">
        <div className="flex flex-wrap items-center gap-2">
          <ColorInput
            value={o.dark}
            onChange={(e) => set("dark", e.target.value)}
            className="h-9 w-14"
            ariaLabel="QR rəngi"
          />
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set("dark", c)}
              style={{ background: c }}
              title={c}
              className={`h-7 w-7 rounded-full border-2 transition ${
                String(o.dark || "").toLowerCase() === c.toLowerCase()
                  ? "border-gray-900"
                  : "border-white shadow-sm"
              }`}
            />
          ))}
        </div>
      </QrRow>

      <div className="grid gap-4 sm:grid-cols-2">
        <QrRow label="Fon">
          <div className="flex items-center gap-2">
            <ColorInput
              value={o.light}
              onChange={(e) => set("light", e.target.value)}
              disabled={o.transparent}
              className="h-9 w-14"
              ariaLabel="Fon rəngi"
            />
            <Checkbox
              checked={o.transparent}
              onChange={(v) => set("transparent", v)}
              label="Şəffaf (PNG/SVG)"
              className="text-xs font-semibold text-gray-600"
            />
          </div>
        </QrRow>
        <QrRow label="Alt yazı" hint="Şəklin altına yazılır — afişada nə üçün olduğu bilinsin.">
          <input
            value={o.caption}
            onChange={(e) => set("caption", e.target.value.slice(0, 60))}
            placeholder={title || "Skan et"}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[#00157A] focus:ring-2 focus:ring-[#00157A]/10"
          />
        </QrRow>
      </div>
    </>
  );
}
