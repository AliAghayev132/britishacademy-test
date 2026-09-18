"use client";

// ── Shared form kit ──
// Small Tailwind primitives used by the bespoke admin forms (teacher, branch,
// course wizard). Keeps the three forms visually consistent without pulling in
// a form library.

// React
import { useCallback, useRef, useState } from "react";

// Icons
import { X, Eye, Pencil, ChevronDown, Check, Search } from "lucide-react";

// Components
import { InfoTip, confirmDialog } from "@/components";

// Hooks
import { useDismiss } from "@/hooks";

// Lib
import { FormDirtyContext, useMarkDirty } from "@/lib";

// Local
import { LocalizedFormProvider, LocaleSwitcher, GlobalAiBar } from "./Localized";

// ── Constants ──
export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Coerce a value that may be an id string or a populated {_id} doc → id string. */
export const toId = (v) => (v && typeof v === "object" ? v._id : v) || "";

const base =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 disabled:bg-gray-100";

// Seçim qutusu və açar ümumi komponentlərdir (components/ui) — kit adları
// formalarda dəyişməsin deyə saxlanılır.
export { Select as NativeSelect, Switch as Toggle } from "@/components";

// ── Inputs ──
export const TextInput = ({ className, ...p }) => <input {...p} className={`${base} ${className || ""}`} />;
export const NumberInput = ({ className, ...p }) => <input type="number" {...p} className={`${base} ${className || ""}`} />;
export const TextArea = ({ className, ...p }) => <textarea {...p} className={`${base} ${className || ""}`} />;


// Mətn yazılan idarəetmə — label klikində fokuslanacaq element.
const FIELD_CONTROL =
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea, select';

/**
 * `<label>` klikini brauzer İLK «label-ə bağlana bilən» elementə ötürür —
 * `<button>` da onlardandır. Nəticədə başlığa klik InfoTip-i açırdı, AI
 * düyməsini basırdı və ya çip siyahısında birinci çipi seçirdi. Başlığa (və
 * sahənin boş yerinə) klikdə defolt ötürməni ləğv edib mətn sahəsini özümüz
 * fokuslayırıq; real idarəetmələrə klik toxunulmaz qalır.
 */
function focusFieldControl(e) {
  if (e.target.closest("button, a, input, textarea, select, [contenteditable='true']")) return;
  e.preventDefault();
  e.currentTarget.querySelector(FIELD_CONTROL)?.focus();
}

/**
 * @param {"label"|"div"} [as]
 *   Sahə adətən `<label>`-dir — başlığa vurmaq içindəki input-u fokuslayır.
 *
 *   AMMA `<label>`-in içində CONTENTEDITABLE (TipTap redaktoru) işləmir:
 *   Chrome label-ə düşən `mousedown`-u «bağlı idarəetməni fokusla» əməliyyatı
 *   kimi tutub susdurur, contenteditable div isə label-ə bağlana bilən element
 *   deyil — nəticədə klik heç yerə getmir, kursor qoyulmur. İstifadəçi
 *   yazmağa çalışır, 4-5 klikdən sonra (ikiqat/üçqat klik mətn seçməsi ilə)
 *   təsadüfən alınır. BÜTÜN 6 formada — bloq, kurs, ölkə, səhifə, layihə,
 *   müəllim — eyni nasazlıq var idi.
 *
 *   Belə sahələr üçün `as="div"` verilir; itirilən yeganə şey başlığa
 *   klikləmə rahatlığıdır, redaktorda onsuz da mənasızdır.
 */
export function Field({ label, hint, required, info, children, className, as = "label" }) {
  const Tag = as;
  return (
    <Tag className={`block ${className || ""}`} onClick={as === "label" ? focusFieldControl : undefined}>
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500">*</span>}
        {info && <InfoTip text={info} />}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </Tag>
  );
}


/** Multi-select rendered as toggleable chips. value = array of ids. */
export function MultiSelectChips({ options = [], value = [], onChange, empty }) {
  const markDirty = useMarkDirty();
  const set = new Set(value.map(String));
  const toggle = (id) => {
    const next = new Set(set);
    if (next.has(String(id))) next.delete(String(id)); else next.add(String(id));
    markDirty();
    onChange([...next]);
  };
  if (!options.length) return <p className="text-sm text-gray-400">{empty || "Seçim yoxdur"}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = set.has(String(o.value));
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${on ? "border-blue-900 bg-blue-900 text-white" : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function SectionTitle({ children, right }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">{children}</h3>
      {right}
    </div>
  );
}

/**
 * «Aktiv / Deaktiv» açarı — redaktə pəncərəsinin AŞAĞI panelində, «Yadda
 * saxla»nın yanında. Əvvəl hər formada ayrı yerdə idi (bəzən formanın
 * ortasında, SEO-dan sonra) və gözə dəymirdi; indi bütün pəncərələrdə eyni
 * yerdədir. Yaşıl — saytda görünür, boz — gizlidir.
 */
function ActiveSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      title={checked ? "Saytda görünür — gizlətmək üçün kliklə" : "Saytda gizlidir — göstərmək üçün kliklə"}
      className={`inline-flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
        checked ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-50 text-gray-500"
      }`}
    >
      <span className={`relative h-5 w-9 flex-none rounded-full transition ${checked ? "bg-emerald-500" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {checked ? "Aktiv — saytda görünür" : "Deaktiv — saytda gizlidir"}
    </button>
  );
}

// ── Modal shell ──
// `preview` (optional node) enables a "Test kimi göstər" toggle that flips the
// body to a live preview before saving.
// `localized` — çoxdilli sahələr olan formalarda başlıqda qlobal AZ/EN/RU dil
// düyməsini göstərir; bütün LocalizedInput/Editor həmin aktiv dili paylaşır.
// `active` + `onActiveChange` — verilsə aşağı paneldə «Aktiv / Deaktiv» açarı.
export function Overlay({ title, subtitle, onClose, onSave, saving, error, wide, preview, localized, active, onActiveChange, children }) {
  const [showPreview, setShowPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const markDirty = useCallback(() => setDirty(true), []);
  // DOM input/change hadisələri formanı «dəyişib» sayır — amma axtarış
  // qutuları (seçim siyahısı, media kitabxanası) form məlumatı deyil.
  // Onlar `data-no-dirty` ilə işarələnir.
  const onFieldEvent = (e) => {
    if (!e.target.closest?.("[data-no-dirty]")) setDirty(true);
  };
  // Fonda bağlama yalnız basma da fonda BAŞLAYIBSA. Əvvəl sahədə mətn seçib
  // siçanı fonda buraxmaq «klik» sayılır və pəncərə bağlanırdı (audit #29).
  const downOnBackdrop = useRef(false);

  // Bağlamadan öncə — istifadəçi nəsə yazıbsa təsdiq istə (səhvən qırağa
  // kliklədikdə/sürüşdürdükdə işi itirməsin).
  const requestClose = async () => {
    if (dirty) {
      const ok = await confirmDialog({
        tone: "warning",
        title: "Çıxılsın?",
        text: "Yadda saxlanılmamış dəyişikliklər var — çıxsanız itəcək.",
        confirmText: "Bəli, çıx",
        cancelText: "Ləğv et",
      });
      if (!ok) return;
    }
    onClose();
  };

  return (
    <FormDirtyContext.Provider value={markDirty}>
    <LocalizedFormProvider>
      {/* role/aria-modal — həm ekran oxuyucular, həm də testlər modalı
          səhifənin qalanından ayıra bilsin (əvvəl testdə səhifədəki axtarış
          qutusu modalın sahəsi kimi seçilirdi). */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onMouseDown={(e) => { downOnBackdrop.current = e.target === e.currentTarget; }}
        onClick={(e) => {
          if (e.target === e.currentTarget && downOnBackdrop.current) requestClose();
          downOnBackdrop.current = false;
        }}
      >
        <div className={`flex max-h-[92vh] w-full ${wide ? "max-w-4xl" : "max-w-2xl"} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}>
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-gray-900">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
            </div>
            <button onClick={requestClose} className="flex-none text-gray-400 hover:text-gray-700" aria-label="Bağla"><X className="h-5 w-5" /></button>
          </div>
          {/* Çoxdilli formalarda: qlobal dil düyməsi + qlobal AI (hamısını tərcümə/səliqə) */}
          {localized && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-6 py-2">
              <LocaleSwitcher />
              <GlobalAiBar />
            </div>
          )}
          <div className="flex-1 space-y-6 overflow-auto p-6" onInput={onFieldEvent} onChange={onFieldEvent}>{children}</div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              {onActiveChange && (
                <ActiveSwitch
                  checked={Boolean(active)}
                  // Açar düymədir — input/change hadisəsi yaratmır, ona görə
                  // «yadda saxlanmayıb» işarəsi əl ilə qoyulur.
                  onChange={(v) => {
                    onActiveChange(v);
                    markDirty();
                  }}
                />
              )}
              {preview && (
                <button
                  onClick={() => setShowPreview(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4" /> Test kimi göstər
                </button>
              )}
              {error && <span className="text-sm font-semibold text-red-600">{error}</span>}
            </div>
            <div className="flex gap-3">
              <button onClick={requestClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">İmtina</button>
              <button onClick={onSave} disabled={saving} className="rounded-lg bg-[#00157A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#00105e] disabled:opacity-60">
                {saving ? "Saxlanılır…" : "Yadda saxla"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen, site-styled preview (opens as a separate page, not the modal) */}
      {preview && showPreview && (
        <div className="fixed inset-0 z-[70] overflow-auto bg-white" style={{ fontFamily: "'Nunito Sans', system-ui, sans-serif" }}>
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-5 py-3 backdrop-blur">
            <span className="text-sm font-semibold text-gray-500">Önizləmə (test){title ? ` — ${title}` : ""}</span>
            <button onClick={() => setShowPreview(false)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#00157A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00105e]">
              <Pencil className="h-4 w-4" /> Redaktəyə qayıt
            </button>
          </div>
          <div className="mx-auto max-w-5xl px-6 py-10">{preview}</div>
        </div>
      )}
    </LocalizedFormProvider>
    </FormDirtyContext.Provider>
  );
}

/**
 * Formanı «dəyişib» işarələyən adi düymə. Forma komponenti Overlay-i özü
 * render edir, ona görə öz gövdəsində `useMarkDirty()` boş kontekst alır —
 * işarələmə Overlay-in İÇİNDƏ render olunan komponentdə olmalıdır.
 */
export function DirtyButton({ onClick, type = "button", ...props }) {
  const markDirty = useMarkDirty();
  return <button type={type} {...props} onClick={(e) => { markDirty(); onClick?.(e); }} />;
}

/** Small "+ add" / remove helpers for repeatable rows. */
export function AddButton({ onClick, children }) {
  const markDirty = useMarkDirty();
  return (
    <button type="button" onClick={(e) => { markDirty(); onClick?.(e); }} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:border-blue-500 hover:text-blue-700">
      + {children}
    </button>
  );
}

export function RemoveButton({ onClick }) {
  const markDirty = useMarkDirty();
  return (
    <button type="button" onClick={(e) => { markDirty(); onClick?.(e); }} className="rounded-lg border border-gray-200 p-1.5 text-red-500 hover:bg-red-50" aria-label="Sil">
      <X className="h-4 w-4" />
    </button>
  );
}
