"use client";

// React
import { useMemo } from "react";

// Components
import { QueryState } from "@/components";

// Lib
import { thumbOf } from "@/lib";

// Local
import ResourceRow from "./ResourceRow";

/** Resurs siyahısının cədvəli (yüklənmə/xəta/boş vəziyyəti daxil). */
export default function ResourceTable({ query, items, page, cfg, resource, canReorder, hasFeatured, actions }) {
  const { isLoading, isFetching, isError, error, refetch } = query;

  // Önizləmə sütunu yalnız siyahıda şəkli olan element varsa göstərilir —
  // filial/FAQ kimi şəkilsiz resurslarda boş sütun yer tutmasın.
  const showThumb = items.some((i) => thumbOf(i));
  const hasActive = useMemo(() => items.some((i) => "isActive" in i), [items]);
  const cols = { canReorder, showThumb, hasFeatured, hasActive };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {isLoading || isError || items.length === 0 ? (
        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={refetch}
          isEmpty={items.length === 0}
          emptyText={"Heç nə tapılmadı."}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {canReorder && <th className="w-24 px-4 py-3">Sıra</th>}
                {showThumb && <th className="w-16 px-4 py-3">Önizləmə</th>}
                <th className="px-4 py-3">Ad</th>
                <th className="hidden px-4 py-3 md:table-cell">Detal</th>
                {hasFeatured && <th className="px-4 py-3">Ana səhifə</th>}
                {hasActive && <th className="px-4 py-3">Status</th>}
                <th className="px-4 py-3 text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className={isFetching ? "opacity-60" : ""}>
              {items.map((item, i) => (
                <ResourceRow
                  key={item._id}
                  item={item}
                  i={i}
                  total={items.length}
                  page={page}
                  cfg={cfg}
                  resource={resource}
                  cols={cols}
                  actions={actions}
                  isFetching={isFetching}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
