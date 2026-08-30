"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Cədvəl səhifələməsi — məzmunun altında YAPIŞQAN (sticky) və sağa düzülü.
 *
 * Əvvəl hər səhifə öz kodunu təkrarlayırdı: mərkəzə düzülmüş və adi axında.
 * Uzun siyahılarda istifadəçi səhifələməni görmək üçün sona qədər sürüşdürməli
 * olurdu. İndi ekranın altında qalır və həmişə görünür.
 *
 * `position: fixed` işlətmirik — o, sidebar-ın üstünə düşərdi. `sticky bottom-0`
 * məzmun sahəsinin içində qalır və layout-u pozmur.
 *
 * Çox səhifə olanda hamısı çap olunmur: ilk, son, cari ± 1 və aralarda «…».
 * 60 səhifəlik loq siyahısında 60 düymə çap etmək həm görünüş, həm performans
 * baxımından pisdir.
 */

/** Göstəriləcək səhifə nömrələri (və boşluq nişanları). */
function windowed(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const out = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);

  if (from > 2) out.push("…");
  for (let n = from; n <= to; n += 1) out.push(n);
  if (to < pages - 1) out.push("…");
  out.push(pages);
  return out;
}

const btn =
  "grid h-9 min-w-9 place-items-center rounded-lg px-2 text-sm font-semibold transition";

export function Pagination({ page = 1, pages = 1, onChange, total }) {
  if (!pages || pages <= 1) return null;

  const go = (n) => {
    if (n < 1 || n > pages || n === page) return;
    onChange?.(n);
  };

  return (
    <div className="sticky bottom-0 z-10 mt-4 flex items-center justify-end gap-2 border-t border-gray-100 bg-white/95 px-1 py-3 backdrop-blur">
      {typeof total === "number" && (
        <span className="mr-auto pl-1 text-xs text-gray-400">
          {total} nəticə · səhifə {page}/{pages}
        </span>
      )}

      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        aria-label="Əvvəlki səhifə"
        className={`${btn} border border-gray-200 bg-white text-gray-600 disabled:opacity-40`}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {windowed(page, pages).map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-gray-400">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => go(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${btn} ${
              n === page
                ? "bg-blue-900 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            {n}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= pages}
        aria-label="Növbəti səhifə"
        className={`${btn} border border-gray-200 bg-white text-gray-600 disabled:opacity-40`}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
