"use client";

// Icons
import { Search, X } from "lucide-react";

/**
 * Bölmə axtarışı sahəsi. Yığılmış sidebar-da yalnız ikon düyməsi qalır.
 * Vəziyyət `useSidebarSearch`-dədir — bu komponent yalnız göstərir.
 */
export default function SidebarSearchBox({ open, inputRef, query, onQuery, onKeyDown, onClear, onExpand }) {
  return (
    <div className="border-b border-gray-100 px-3 py-2.5">
      {open ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Bölmə axtar…"
            aria-label="Bölmə axtar"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-16 text-sm font-medium text-gray-700 outline-none transition focus:border-[#00157A] focus:bg-white"
          />
          {query ? (
            <button
              type="button"
              onClick={onClear}
              aria-label="Təmizlə"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-gray-400">
              Ctrl K
            </kbd>
          )}
        </div>
      ) : (
        // Yığılmış sidebar-da sahə sığmır — ikon onu açıb fokus verir.
        <button
          type="button"
          onClick={onExpand}
          title="Bölmə axtar (Ctrl+K)"
          aria-label="Bölmə axtar"
          className="flex w-full items-center justify-center rounded-xl py-2 text-gray-500 transition hover:bg-gray-100 hover:text-[#00157A]"
        >
          <Search className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
