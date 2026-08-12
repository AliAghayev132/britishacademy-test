"use client";

// ── Çoxdilli (AZ/EN/RU) redaktə primitivləri ──
// LocalizedInput/LocalizedEditor: sahəni { az, en, ru } obyekti kimi redaktə edir
// (tab-larla). confirmLocalized: submit-dən öncə AZ mütləqdir, EN/RU boşdursa
// "AZ istifadə olunacaq" təsdiqi alır. Doldurulmayan dil üçün error/warn label.

import { useState } from "react";
import { confirmDialog } from "@/components/ui/feedback";
import TiptapEditor from "@/components/editor/TiptapEditor";

const LOCALES = [
  { key: "az", label: "AZ" },
  { key: "en", label: "EN" },
  { key: "ru", label: "RU" },
];

const base =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 disabled:bg-gray-100";

/** string | { az, en, ru } → { az, en, ru } */
export function toLoc(v) {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return { az: v.az || "", en: v.en || "", ru: v.ru || "" };
  }
  return { az: typeof v === "string" ? v : "", en: "", ru: "" };
}

/** Hər dili trim et (body üçün). */
export function trimLoc(v) {
  const o = toLoc(v);
  return { az: o.az.trim(), en: o.en.trim(), ru: o.ru.trim() };
}

/** AZ variantı (preview üçün). */
export const locAz = (v) => toLoc(v).az;

function Tabs({ value, active, setActive }) {
  return (
    <div className="mb-1.5 flex gap-1">
      {LOCALES.map((l) => {
        const filled = (value[l.key] || "").trim().length > 0;
        const on = active === l.key;
        return (
          <button
            key={l.key}
            type="button"
            onClick={() => setActive(l.key)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition ${on ? "bg-[#00157A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {l.label}
            <span className={`h-1.5 w-1.5 rounded-full ${filled ? "bg-emerald-400" : on ? "bg-white/50" : "bg-gray-300"}`} />
          </button>
        );
      })}
    </div>
  );
}

function EmptyWarn({ value }) {
  const az = (value.az || "").trim();
  const miss = LOCALES.filter((l) => l.key !== "az" && !(value[l.key] || "").trim()).map((l) => l.label);
  if (!az || !miss.length) return null;
  return (
    <div className="mt-1 text-xs font-medium text-amber-600">
      {miss.join(", ")} boşdur — bu dil(lər)də AZ göstəriləcək
    </div>
  );
}

export function LocalizedInput({ value, onChange, placeholder, multiline, rows = 3 }) {
  const v = toLoc(value);
  const [active, setActive] = useState("az");
  const set = (text) => onChange({ ...v, [active]: text });
  return (
    <div>
      <Tabs value={v} active={active} setActive={setActive} />
      {multiline ? (
        <textarea value={v[active]} onChange={(e) => set(e.target.value)} placeholder={placeholder} rows={rows} className={base} />
      ) : (
        <input value={v[active]} onChange={(e) => set(e.target.value)} placeholder={placeholder} className={base} />
      )}
      <EmptyWarn value={v} />
    </div>
  );
}

export function LocalizedEditor({ value, onChange, ...rest }) {
  const v = toLoc(value);
  const [active, setActive] = useState("az");
  const set = (html) => onChange({ ...v, [active]: html });
  return (
    <div>
      <Tabs value={v} active={active} setActive={setActive} />
      {/* key={active} — tab dəyişəndə editor həmin dilin məzmunu ilə remount olur */}
      <TiptapEditor key={active} content={v[active]} onChange={set} {...rest} />
      <EmptyWarn value={v} />
    </div>
  );
}

/**
 * Submit-dən öncə çoxdilli sahələri yoxla.
 *  entries: [{ label, value, required }]
 *  - required sahədə AZ boşdursa → { ok:false, error } (submit bloklanır)
 *  - AZ dolu, EN/RU boşdursa → təsdiq ("AZ istifadə olunacaq")
 */
export async function confirmLocalized(entries) {
  const missAz = entries.filter((e) => e.required && !toLoc(e.value).az.trim());
  if (missAz.length) {
    return { ok: false, error: `${missAz.map((e) => e.label).join(", ")} — Azərbaycan dili mütləqdir` };
  }
  const partial = entries.filter((e) => {
    const o = toLoc(e.value);
    return o.az.trim() && (!o.en.trim() || !o.ru.trim());
  });
  if (partial.length) {
    const ok = await confirmDialog({
      tone: "warning",
      title: "Bəzi dillər boşdur",
      text: `${partial.map((e) => e.label).join(", ")} sahəsində EN və ya RU boşdur. Həmin dillərdə <b>Azərbaycan dili</b> göstəriləcək.<br><br>Davam edilsin?`,
      confirmText: "Bəli, davam et",
      cancelText: "Geri qayıt",
    });
    if (!ok) return { ok: false };
  }
  return { ok: true };
}
