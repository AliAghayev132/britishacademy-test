"use client";

// Icons
import { Pencil, Trash2, CalendarClock, FileVideo, ArrowUp, ArrowDown } from "lucide-react";

// Components
import { ActionsMenu } from "@/components";

// Lib
import { field, thumbOf, isImagePath, getImageUrl } from "@/lib";

// Local
import { PAGE_SIZE } from "./helpers";

/**
 * Cədvəlin tək sətri. `cols` — hansı isteğe bağlı sütunların göstərildiyi,
 * `actions` — səhifədəki mutasiya/naviqasiya funksiyaları.
 */
export default function ResourceRow({ item, i, total, page, cfg, resource, cols, actions, isFetching }) {
  const { canReorder, showThumb, hasFeatured, hasActive } = cols;
  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      {canReorder && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <div className="flex flex-col">
              <MoveBtn
                dir="up"
                onClick={() => actions.move(i, -1)}
                // Səhifənin ilk/son elementi: qonşu yoxdur.
                // Səhifələr arası köçürmə üçün elementi açıb
                // «Sıra» rəqəmini yazmaq lazımdır.
                disabled={i === 0 || isFetching}
              />
              <MoveBtn dir="down" onClick={() => actions.move(i, 1)} disabled={i === total - 1 || isFetching} />
            </div>
            <span className="text-xs font-semibold text-gray-400">
              {(page - 1) * PAGE_SIZE + i + 1}
            </span>
          </div>
        </td>
      )}
      {showThumb && (
        <td className="px-4 py-3">
          <Thumb src={thumbOf(item)} />
        </td>
      )}
      <td className="px-4 py-3 font-medium text-gray-900">{field(item, cfg.title) || "—"}</td>
      <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{String(field(item, cfg.sub) || "").slice(0, 80)}</td>
      {hasFeatured && (
        <td className="px-4 py-3">
          {"isFeatured" in item ? (
            <button
              onClick={() => actions.toggleFeatured(item)}
              title={item.isFeatured ? "Ana səhifədən çıxar" : "Ana səhifədə göstər"}
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.isFeatured ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}
            >
              {item.isFeatured ? "Göstərilir" : "Gizli"}
            </button>
          ) : null}
        </td>
      )}
      {hasActive && (
        <td className="px-4 py-3">
          {"isActive" in item ? (
            <button
              onClick={() => actions.toggleActive(item)}
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}`}
            >
              {item.isActive ? "Aktiv" : "Deaktiv"}
            </button>
          ) : null}
        </td>
      )}
      <td className="px-4 py-3">
        <ActionsMenu
          actions={[
            { label: "Redaktə", icon: Pencil, onClick: () => actions.edit(item) },
            resource === "courses" && {
              label: "Dərs qrafiki",
              icon: CalendarClock,
              onClick: () => actions.schedule(item),
            },
            { label: "Sil", icon: Trash2, tone: "danger", onClick: () => actions.remove(item) },
          ]}
        />
      </td>
    </tr>
  );
}

/** Sıra oxu — siyahıda qonşu elementlə yerini dəyişir. */
function MoveBtn({ dir, onClick, disabled }) {
  const Icon = dir === "up" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={dir === "up" ? "Yuxarı" : "Aşağı"}
      aria-label={dir === "up" ? "Yuxarı köçür" : "Aşağı köçür"}
      className="rounded p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:pointer-events-none disabled:opacity-25"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/**
 * Cədvəldəki kiçik önizləmə. Şəkil deyilsə (video/sənəd) ikon göstərilir,
 * yüklənmə uğursuz olarsa sınıq şəkil əvəzinə boş çərçivə qalır.
 */
function Thumb({ src }) {
  if (!src) {
    return <div className="h-10 w-10 rounded-lg border border-dashed border-gray-200" />;
  }
  if (!isImagePath(src)) {
    return (
      <div className="grid h-10 w-10 place-items-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400">
        <FileVideo className="h-4 w-4" />
      </div>
    );
  }
  return (
    <img
      src={getImageUrl(src)}
      alt=""
      loading="lazy"
      className="h-10 w-10 rounded-lg border border-gray-200 bg-gray-50 object-cover"
      onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
    />
  );
}
