"use client";

// React
import { useState } from "react";
// Data
import { useAdminListQuery, useAdminUpdateMutation } from "@/store/api/adminApi";
// UI
import { notify } from "@/components/ui/feedback";
import { QueryState } from "@/components/ui/QueryState";
import { pickAz, thumbOf, isImagePath } from "@/lib/adminResources";
import { getImageUrl } from "@/utils/getImageUrl";
// Icons
import { Check, Search, FileVideo } from "lucide-react";

/**
 * «Ana səhifədə göstərilənlər» seçicisi.
 *
 * Əvvəl bunun üçün hər resursun öz siyahısına keçmək lazım gəlirdi — kurslar
 * bir səhifədə, ölkələr başqasında, rəylər üçüncüdə. İstifadəçi ana səhifəni
 * qurarkən dörd yer arasında gedib-gəlirdi.
 *
 * Burada seçim birbaşa edilir: klik → isFeatured dəyişir → siyahı yenilənir.
 * Ayrıca «yadda saxla» yoxdur, çünki hər klik müstəqil əməliyyatdır.
 *
 * `limit` — ana səhifədə göstərilən maksimum say (getHome ilə eyni). Seçim
 * limitdən çox olanda xəbərdarlıq verilir, çünki artığı görünməyəcək.
 */
export function FeaturedPicker({ resource, limit, filter, titleField = "title", subField }) {
  const [q, setQ] = useState("");

  const { data, isLoading, isError, error, refetch, isFetching } = useAdminListQuery({
    resource,
    page: 1,
    limit: 100,
    ...(filter || {}),
  });
  const [update] = useAdminUpdateMutation();

  const items = data?.data?.items || [];
  const featured = items.filter((i) => i.isFeatured);

  const norm = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ə/g, "e");

  const shown = q
    ? items.filter((i) => norm(pickAz(i[titleField]) + " " + pickAz(i[subField])).includes(norm(q)))
    : items;

  const toggle = async (item) => {
    try {
      await update({
        resource,
        id: item._id,
        data: { isFeatured: !item.isFeatured },
      }).unwrap();
    } catch (err) {
      notify.error(err?.data?.message || "Dəyişmədi");
    }
  };

  if (isLoading || isError || items.length === 0) {
    return (
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={items.length === 0}
        emptyText="Element tapılmadı."
      />
    );
  }

  const over = limit && featured.length > limit;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Axtar…"
            className="w-56 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <span
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            over ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-800"
          }`}
        >
          Seçilib: {featured.length}
          {limit ? ` · ana səhifədə ${Math.min(featured.length, limit)} / ${limit}` : ""}
        </span>

        {over && (
          <span className="text-xs text-amber-700">
            Artıq olan {featured.length - limit} element görünməyəcək.
          </span>
        )}
        {limit && featured.length < limit && (
          <span className="text-xs text-gray-400">
            Qalan {limit - featured.length} yer avtomatik tamamlanır.
          </span>
        )}
      </div>

      <div className={`grid gap-2 sm:grid-cols-2 ${isFetching ? "opacity-60" : ""}`}>
        {shown.map((item) => {
          const on = item.isFeatured;
          const thumb = thumbOf(item);
          return (
            <button
              key={item._id}
              type="button"
              onClick={() => toggle(item)}
              className={`flex items-center gap-3 rounded-lg border p-2.5 text-left transition ${
                on
                  ? "border-blue-900 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span
                className={`grid h-5 w-5 flex-none place-items-center rounded border ${
                  on ? "border-blue-900 bg-blue-900 text-white" : "border-gray-300 bg-white"
                }`}
              >
                {on && <Check className="h-3.5 w-3.5" />}
              </span>

              {thumb &&
                (isImagePath(thumb) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={getImageUrl(thumb)}
                    alt=""
                    loading="lazy"
                    className="h-9 w-9 flex-none rounded-md border border-gray-200 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                  />
                ) : (
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-md border border-gray-200 bg-gray-50 text-gray-400">
                    <FileVideo className="h-4 w-4" />
                  </span>
                ))}

              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm ${on ? "font-semibold text-blue-900" : "text-gray-700"}`}>
                  {pickAz(item[titleField]) || "—"}
                </span>
                {subField && (
                  <span className="block truncate text-xs text-gray-400">
                    {pickAz(item[subField])}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 && (
        <p className="py-6 text-center text-sm text-gray-400">Axtarışa uyğun nəticə yoxdur.</p>
      )}
    </div>
  );
}
