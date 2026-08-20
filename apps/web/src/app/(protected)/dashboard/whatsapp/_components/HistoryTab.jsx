"use client";

// ── Göndəriş tarixçəsi ──

import { QueryState } from "@/components/ui/QueryState";
import { useWhatsappMessagesQuery } from "@/store/api/adminApi";
import { STATUS_BADGE, fmt } from "./shared";

export function HistoryTab({ page, onPage }) {
  const { data, isFetching, isError, error, refetch } = useWhatsappMessagesQuery({ page, limit: 20 });
  const items = data?.data?.items || [];
  const pagination = data?.data?.pagination;
  const firstLoad = isFetching && items.length === 0;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {firstLoad || isError || items.length === 0 ? (
        <QueryState
          isLoading={firstLoad && !isError}
          isError={isError}
          error={error}
          onRetry={refetch}
          isEmpty={items.length === 0}
          emptyText="Hələ mesaj göndərilməyib."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Nömrə</th>
                <th className="hidden px-4 py-3 md:table-cell">Mesaj</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 sm:table-cell">Tarix</th>
              </tr>
            </thead>
            <tbody className={isFetching ? "opacity-60" : ""}>
              {items.map((m, i) => {
                const b = STATUS_BADGE[m.status] || STATUS_BADGE.sent;
                return (
                  <tr
                    key={m._id}
                    className="ba-row border-t border-gray-100"
                    style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-gray-900">+{m.phone}</td>
                    <td className="hidden max-w-md truncate px-4 py-3 text-gray-500 md:table-cell">
                      {m.body || (m.media?.filename ? `📎 ${m.media.filename}` : "—")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${b.cls}`}>
                        {b.label}
                      </span>
                      {m.error && <div className="mt-1 text-xs text-red-500">{m.error}</div>}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-gray-500 sm:table-cell">
                      {fmt(m.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex flex-wrap justify-center gap-2 border-t border-gray-100 p-3">
          {Array.from({ length: Math.min(pagination.pages, 12) }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => onPage(n)}
              className={`h-8 w-8 rounded-lg text-sm font-semibold transition ${
                n === pagination.page
                  ? "bg-blue-900 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
