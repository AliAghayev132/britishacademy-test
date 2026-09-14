"use client";

// React
import { useEffect, useId, useRef, useState } from "react";

// Icons
import { Check, ChevronDown, Search } from "lucide-react";

// Hooks
import { useAnchoredPosition, useDismiss } from "@/hooks";

// Lib
import { useMarkDirty } from "@/lib";

const base =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 disabled:bg-gray-100";

const norm = (s) => String(s || "").toLocaleLowerCase("az");

/**
 * Brend dizaynlı seçim qutusu — native `<select>` əvəzi.
 *
 * Native `onChange={(e) => e.target.value}` müqaviləsi saxlanılır ki, mövcud
 * formalar dəyişmədən keçsin. 4-dən çox variantda axtarış sahəsi çıxır. Menyu
 * `position: fixed` ilə açılır — modalın `overflow`-u onu kəsmir.
 *
 * Klaviatura: ↓/Enter/Boşluq açır, ↑↓ gəzir, Enter seçir, Escape/Tab bağlayır.
 * Əvvəlki versiya yalnız siçanla işləyirdi.
 *
 * @param {{ value: string, label: string, color?: string }[]} options
 */
export function Select({ options = [], placeholder, value, onChange, disabled, className, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const listId = useId();
  const markDirty = useMarkDirty();

  const searchable = options.length > 4;
  const selected = options.find((o) => String(o.value) === String(value ?? ""));
  const filtered = searchable && q ? options.filter((o) => norm(o.label).includes(norm(q))) : options;
  // Klaviatura siyahısı: boş seçim (placeholder) + süzülmüş variantlar.
  const items = placeholder !== undefined ? [{ value: "", label: placeholder, empty: true }, ...filtered] : filtered;

  useDismiss(open, () => setOpen(false), [triggerRef, menuRef]);
  const coords = useAnchoredPosition(open, triggerRef, { matchWidth: true });

  // Aktiv variant görünən sahədə qalsın.
  useEffect(() => {
    if (!open || active < 0) return;
    menuRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const openMenu = () => {
    if (disabled) return;
    setQ("");
    setActive(Math.max(0, items.findIndex((o) => String(o.value) === String(value ?? ""))));
    setOpen(true);
  };

  const choose = (v) => {
    if (String(v) !== String(value ?? "")) markDirty();
    onChange?.({ target: { value: v } });
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[active]) choose(items[active].value);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className={`relative ${className || ""}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={`${base} flex items-center justify-between gap-2 bg-white text-left ${disabled ? "opacity-60" : "cursor-pointer"}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.color && <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: selected.color }} />}
          <span
            className={`truncate ${selected ? "text-gray-900" : "text-gray-400"}`}
            style={selected?.color ? { color: selected.color, fontWeight: 600 } : undefined}
          >
            {selected ? selected.label : placeholder || "Seç…"}
          </span>
        </span>
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
              {/* data-no-dirty: axtarış yazısı formanı «dəyişib» saymasın */}
              <input
                data-no-dirty
                autoFocus
                value={q}
                onChange={(e) => { setQ(e.target.value); setActive(0); }}
                onKeyDown={onKeyDown}
                placeholder="Axtar…"
                aria-label="Variantlarda axtar"
                className="w-full text-sm text-gray-900 outline-none"
              />
            </div>
          )}
          <div id={listId} role="listbox" className="max-h-56 overflow-auto py-1">
            {items.map((o, i) => {
              const on = !o.empty && String(o.value) === String(value ?? "");
              return (
                <button
                  key={o.empty ? "__empty" : o.value}
                  type="button"
                  role="option"
                  aria-selected={on}
                  data-index={i}
                  tabIndex={-1}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o.value)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                    o.empty ? "text-gray-400" : on ? "font-semibold text-[#00157A]" : "text-gray-700"
                  } ${i === active ? "bg-blue-50" : ""}`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {o.color && <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: o.color }} />}
                    <span className="truncate">{o.label}</span>
                  </span>
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
