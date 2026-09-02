"use client";

// ── Tarix aralığı — TƏK sahə görünüşü ──
//
// Əvvəl «Başlanğıc» və «Bitiş» iki ayrı input idi və filtr sətrində çox yer
// tuturdu. İndi hər ikisi bir çərçivənin içindədir: vizual olaraq tək sahədir,
// amma daxildə mövcud `DatePicker` təkrar istifadə olunur — təqvim məntiqi,
// portal yerləşdirməsi və klaviatura davranışı bir yerdə qalır.
//
// `min`/`max` çarpaz bağlanır: başlanğıc bitişdən sonra, bitiş başlanğıcdan
// əvvəl seçilə bilmir.

import { DatePicker } from "./DatePicker";
import { X } from "lucide-react";

export function DateRangePicker({ from, to, onFrom, onTo, className = "" }) {
  const has = Boolean(from || to);

  return (
    <div
      className={`flex items-center rounded-lg border border-gray-200 bg-white transition focus-within:border-blue-500 hover:border-gray-300 ${className}`}
    >
      <div className="min-w-0 flex-1">
        <DatePicker
          value={from}
          onChange={onFrom}
          placeholder="Başlanğıc"
          max={to || undefined}
          className="!border-0 !bg-transparent hover:!border-0 focus:!border-0"
        />
      </div>

      <span className="select-none px-0.5 text-gray-300">—</span>

      <div className="min-w-0 flex-1">
        <DatePicker
          value={to}
          onChange={onTo}
          placeholder="Bitiş"
          min={from || undefined}
          className="!border-0 !bg-transparent hover:!border-0 focus:!border-0"
        />
      </div>

      {has && (
        <button
          type="button"
          onClick={() => {
            onFrom("");
            onTo("");
          }}
          aria-label="Tarix aralığını təmizlə"
          className="mr-2 grid h-5 w-5 flex-none place-items-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
