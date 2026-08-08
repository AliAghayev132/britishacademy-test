"use client";

// ── Shared form kit ──
// Small Tailwind primitives used by the bespoke admin forms (teacher, branch,
// course wizard). Keeps the three forms visually consistent without pulling in
// a form library.

// React
import { useEffect, useRef, useState } from "react";
// UI / kit
import { InfoTip } from "@/components/ui/InfoTip";
import { confirmDialog } from "@/components/ui/feedback";
// Icons
import { X, Eye, Pencil, ChevronDown, Check, Search } from "lucide-react";

// ── Constants ──
export const WEEKDAYS = [
  { v: 1, l: "B.e" }, { v: 2, l: "Ç.a" }, { v: 3, l: "Çərş" },
  { v: 4, l: "C.a" }, { v: 5, l: "Cümə" }, { v: 6, l: "Şənbə" }, { v: 7, l: "Bazar" },
];
export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const FORMATS = [
  { value: "group", label: "Qrup" },
  { value: "individual", label: "Fərdi" },
];

/** Coerce a value that may be an id string or a populated {_id} doc → id string. */
export const toId = (v) => (v && typeof v === "object" ? v._id : v) || "";

const base =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 disabled:bg-gray-100";

// ── Inputs ──
export const TextInput = ({ className, ...p }) => <input {...p} className={`${base} ${className || ""}`} />;
export const NumberInput = ({ className, ...p }) => <input type="number" {...p} className={`${base} ${className || ""}`} />;
export const TextArea = ({ className, ...p }) => <textarea {...p} className={`${base} ${className || ""}`} />;

// Custom dropdown (keeps the native `onChange={(e)=>e.target.value}` contract so
// every form keeps working). Options render with a custom design; lists longer
// than 4 get a search box. Positioned fixed so it never clips inside the modal.
export function NativeSelect({ options = [], placeholder, value, onChange, disabled, className }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const searchable = options.length > 4;
  const selected = options.find((o) => String(o.value) === String(value ?? ""));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const toggle = () => {
    if (disabled) return;
    if (open) return setOpen(false);
    const r = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const up = spaceBelow < 280 && r.top > spaceBelow;
    setCoords({ left: r.left, width: r.width, top: up ? undefined : r.bottom + 4, bottom: up ? window.innerHeight - r.top + 4 : undefined });
    setQ("");
    setOpen(true);
  };
  const choose = (v) => { onChange?.({ target: { value: v } }); setOpen(false); };

  const norm = (s) => String(s || "").toLowerCase();
  const filtered = searchable && q ? options.filter((o) => norm(o.label).includes(norm(q))) : options;

  return (
    <div className={`relative ${className || ""}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={`${base} flex items-center justify-between gap-2 bg-white text-left ${disabled ? "opacity-60" : "cursor-pointer"}`}
      >
        <span className={`truncate ${selected ? "text-gray-900" : "text-gray-400"}`}>{selected ? selected.label : (placeholder || "Seç…")}</span>
        <ChevronDown className={`h-4 w-4 flex-none text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && coords && (
        <div
          ref={menuRef}
          style={{ position: "fixed", left: coords.left, width: coords.width, top: coords.top, bottom: coords.bottom, zIndex: 120 }}
          className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl"
        >
          {searchable && (
            <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
              <Search className="h-3.5 w-3.5 flex-none text-gray-400" />
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Axtar…" className="w-full text-sm text-gray-900 outline-none" />
            </div>
          )}
          <div className="max-h-56 overflow-auto py-1">
            {placeholder !== undefined && (
              <button type="button" onClick={() => choose("")} className="flex w-full items-center px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-50">{placeholder}</button>
            )}
            {filtered.map((o) => {
              const on = String(o.value) === String(value ?? "");
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => choose(o.value)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${on ? "bg-blue-50 font-semibold text-[#00157A]" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <span className="truncate">{o.label}</span>
                  {on && <Check className="h-4 w-4 flex-none text-[#00157A]" />}
                </button>
              );
            })}
            {filtered.length === 0 && <div className="px-3 py-3 text-center text-sm text-gray-400">Tapılmadı</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export function Field({ label, hint, required, info, children, className }) {
  return (
    <label className={`block ${className || ""}`}>
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500">*</span>}
        {info && <InfoTip text={info} />}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-blue-900" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

/** Multi-select rendered as toggleable chips. value = array of ids. */
export function MultiSelectChips({ options = [], value = [], onChange, empty }) {
  const set = new Set(value.map(String));
  const toggle = (id) => {
    const next = new Set(set);
    if (next.has(String(id))) next.delete(String(id)); else next.add(String(id));
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

// ── Modal shell ──
// `preview` (optional node) enables a "Test kimi göstər" toggle that flips the
// body to a live preview before saving.
export function Overlay({ title, subtitle, onClose, onSave, saving, error, wide, preview, children }) {
  const [showPreview, setShowPreview] = useState(false);
  const [dirty, setDirty] = useState(false);

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
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && requestClose()}>
        <div className={`flex max-h-[92vh] w-full ${wide ? "max-w-4xl" : "max-w-2xl"} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}>
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
            </div>
            <button onClick={requestClose} className="text-gray-400 hover:text-gray-700" aria-label="Bağla"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 space-y-6 overflow-auto p-6" onInput={() => setDirty(true)} onChange={() => setDirty(true)}>{children}</div>
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
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
    </>
  );
}

/** Small "+ add" / remove helpers for repeatable rows. */
export function AddButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:border-blue-500 hover:text-blue-700">
      + {children}
    </button>
  );
}

export function RemoveButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="rounded-lg border border-gray-200 p-1.5 text-red-500 hover:bg-red-50" aria-label="Sil">
      <X className="h-4 w-4" />
    </button>
  );
}
