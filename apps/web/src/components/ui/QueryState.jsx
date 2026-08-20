"use client";

// ── Sorğu vəziyyəti (yüklənir / xəta / boş) ──
// RTK Query sorğularının üç vəziyyətini bir yerdə idarə edir. Bundan əvvəl
// admin səhifələri yalnız `isLoading` yoxlayırdı — API çökəndə istifadəçi
// SONSUZ «Yüklənir…» görürdü, nə xəta mesajı, nə də yenidən cəhd düyməsi.
//
// İki istifadə üsulu:
//   1) Sarğı kimi:  <QueryState {...q} isEmpty={!items.length}><table/></QueryState>
//   2) Erkən çıxış: const s = queryGuard({...}); if (s) return s;

import { AlertCircle, RefreshCw, Loader2, Inbox } from "lucide-react";

/** RTK Query xətasından oxunaqlı mesaj çıxar. */
export function errorText(error) {
  if (!error) return "Naməlum xəta";
  if (error.status === "FETCH_ERROR") return "Serverə qoşulmaq alınmadı — internet və ya API işləmir.";
  if (error.status === "PARSING_ERROR") return "Server gözlənilməz cavab qaytardı.";
  if (error.status === 401) return "Sessiya bitib — yenidən daxil olun.";
  if (error.status === 403) return "Bu əməliyyat üçün icazəniz yoxdur.";
  if (error.status === 404) return "Məlumat tapılmadı.";
  if (typeof error.status === "number" && error.status >= 500) {
    return "Serverdə xəta baş verdi. Bir azdan yenidən cəhd edin.";
  }
  return error?.data?.message || "Məlumat yüklənmədi";
}

function Shell({ children }) {
  return <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">{children}</div>;
}

export function LoadingState({ text = "Yüklənir…" }) {
  return (
    <Shell>
      <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
      <p className="text-sm text-gray-500">{text}</p>
    </Shell>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <Shell>
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-600">
        <AlertCircle className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-gray-900">Məlumat yüklənmədi</p>
      <p className="max-w-sm text-sm text-gray-500">{errorText(error)}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" /> Yenidən cəhd et
        </button>
      )}
    </Shell>
  );
}

export function EmptyState({ text = "Heç nə tapılmadı." }) {
  return (
    <Shell>
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-gray-100 text-gray-400">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="text-sm text-gray-500">{text}</p>
    </Shell>
  );
}

/**
 * Sarğı: uşaqları yalnız data hazır olduqda render edir.
 *
 * @param {boolean} isLoading  ilk yüklənmə
 * @param {boolean} isError    sorğu uğursuz oldu
 * @param {object}  error      RTK Query xəta obyekti
 * @param {Function} onRetry   adətən `refetch`
 * @param {boolean} isEmpty    data gəldi, amma boşdur
 */
export function QueryState({
  isLoading, isError, error, onRetry, isEmpty,
  loadingText, emptyText, children,
}) {
  if (isLoading) return <LoadingState text={loadingText} />;
  if (isError) return <ErrorState error={error} onRetry={onRetry} />;
  if (isEmpty) return <EmptyState text={emptyText} />;
  return children;
}
