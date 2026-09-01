"use client";

// React
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
// Icons
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * Tarix seçici — brend dizaynı ilə.
 *
 * Niyə native `<input type="date">` kifayət etmir: açılan təqvim brauzerə
 * görə tamam fərqli görünür (Chrome, Firefox və Safari üç ayrı dizayn verir),
 * dili ƏMƏLİYYAT SİSTEMİNDƏN götürür — yəni admin panel azərbaycanca olsa da
 * təqvim ingiliscə açıla bilir — və stil verilə bilmir.
 *
 * Dəyər formatı native input ilə eynidir: "YYYY-MM-DD", ona görə mövcud
 * formalar dəyişmədən keçir.
 *
 * Menyu portal ilə render olunur ki, modal və ya `overflow: hidden` olan
 * konteynerin içində kəsilməsin.
 */

const WD = ["B.e", "Ç.a", "Çərş", "C.a", "Cümə", "Şən", "Baz"];
const MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
  "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const parse = (v) => {
  if (!v) return null;
  const [y, m, d] = String(v).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

/** Ayın şəbəkəsi — bazar ertəsindən başlayan 6 sıra (42 gün). */
function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  // JS-də həftə bazardan başlayır (0); bizdə bazar ertəsi.
  const lead = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - lead);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Tarix seçin",
  min,
  max,
  className = "",
}) {
  const selected = parse(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => selected || new Date());
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  // Açılanda seçilmiş tarixin ayına qayıt; mövqeyi hesabla. Portal olduğu
  // üçün yerləşdirmə bizim üzərimizdədir.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- açılış anında: görünüş ayı və menyu mövqeyi yalnız DOM ölçüldükdən sonra bilinir
    if (selected) setView(selected);
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom;
    setCoords({
      left: Math.min(r.left, window.innerWidth - 300),
      top: below > 340 ? r.bottom + 6 : undefined,
      bottom: below > 340 ? undefined : window.innerHeight - r.top + 6,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Kənara klik və Escape ilə bağlanma.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const days = useMemo(() => monthGrid(view.getFullYear(), view.getMonth()), [view]);
  const today = toISO(new Date());
  const minD = parse(min);
  const maxD = parse(max);

  const pick = (d) => {
    onChange?.(toISO(d));
    setOpen(false);
  };

  const clear = () => {
    onChange?.("");
    setOpen(false);
  };

  const shift = (n) => setView((v) => new Date(v.getFullYear(), v.getMonth() + n, 1));

  const label = selected
    ? `${selected.getDate()} ${MONTHS[selected.getMonth()]} ${selected.getFullYear()}`
    : placeholder;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm transition hover:border-gray-300 focus:border-blue-500 focus:outline-none ${className}`}
      >
        <Calendar className="h-4 w-4 flex-none text-gray-400" />
        <span className={selected ? "text-gray-900" : "text-gray-400"}>{label}</span>
        {selected && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Tarixi sil"
            onClick={(e) => {
              e.stopPropagation();
              onChange?.("");
            }}
            className="ml-auto rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {open && coords && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={popRef}
              style={{
                position: "fixed",
                left: coords.left,
                top: coords.top,
                bottom: coords.bottom,
                zIndex: 90,
              }}
              className="w-[286px] rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
            >
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => shift(-1)}
                  aria-label="Əvvəlki ay"
                  className="grid h-7 w-7 place-items-center rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-gray-900">
                  {MONTHS[view.getMonth()]} {view.getFullYear()}
                </span>
                <button
                  type="button"
                  onClick={() => shift(1)}
                  aria-label="Növbəti ay"
                  className="grid h-7 w-7 place-items-center rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-0.5">
                {WD.map((w) => (
                  <div key={w} className="grid h-7 place-items-center text-[11px] font-bold text-gray-400">
                    {w}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {days.map((d) => {
                  const iso = toISO(d);
                  const other = d.getMonth() !== view.getMonth();
                  const isSel = selected && iso === toISO(selected);
                  const disabled = (minD && d < minD) || (maxD && d > maxD);
                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={disabled}
                      onClick={() => pick(d)}
                      className={`grid h-8 place-items-center rounded-lg text-sm transition ${
                        isSel
                          ? "bg-blue-900 font-bold text-white"
                          : other
                            ? "text-gray-300 hover:bg-gray-50"
                            : "text-gray-700 hover:bg-gray-100"
                      } ${iso === today && !isSel ? "ring-1 ring-blue-300" : ""} ${
                        disabled ? "cursor-not-allowed opacity-30 hover:bg-transparent" : ""
                      }`}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                <button
                  type="button"
                  onClick={() => pick(new Date())}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-blue-900 hover:bg-blue-50"
                >
                  Bu gün
                </button>
                <button
                  type="button"
                  onClick={clear}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100"
                >
                  Sıfırla
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
