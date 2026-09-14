"use client";

// Local
import { FeaturedPicker } from "../FeaturedPicker";

/** «Məzmun seçimi» tabındakı resurslar. */
const PICKERS = [
  { key: "courses", label: "Kurslar", resource: "courses", limit: 6, title: "title", sub: "slug" },
  { key: "destinations", label: "Ölkələr", resource: "destinations", limit: 8, title: "country", sub: "tagline" },
  { key: "projects", label: "Layihələr", resource: "projects", limit: 6, title: "title", sub: "tagline" },
  { key: "videos", label: "Video rəylər", resource: "testimonials", limit: 8, title: "name", sub: "achievement", filter: { type: "video" } },
  { key: "testimonials", label: "Yazılı rəylər", resource: "testimonials", limit: 6, title: "name", sub: "achievement", filter: { type: "text" } },
  { key: "teachers", label: "Müəllimlər", resource: "teachers", limit: 8, title: "fullName", sub: "title" },
];

/**
 * «Məzmun seçimi» tabı. `picker` vəziyyəti səhifədə qalır — tablar arasında
 * gedib-gələndə seçilmiş resurs sıfırlanmasın.
 */
export function ContentPanel({ picker, setPicker }) {
  const active = PICKERS.find((p) => p.key === picker);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {PICKERS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPicker(p.key)}
            className={`rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition ${
              picker === p.key
                ? "border-[#00157A] bg-[#00157A] text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs text-gray-500">
          Kliklə seçin — dəyişiklik <b>dərhal</b> saxlanılır, ayrıca «yadda
          saxla» lazım deyil.
        </p>
        <FeaturedPicker
          key={active.key}
          resource={active.resource}
          limit={active.limit}
          filter={active.filter}
          titleField={active.title}
          subField={active.sub}
        />
      </div>
    </div>
  );
}
