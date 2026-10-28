"use client";

// React
import { useMemo, useState } from "react";

// Icons
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Plus,
  CornerDownRight,
} from "lucide-react";

// Components
import { QueryState, confirmDialog, notify } from "@/components";

// Store
import {
  useAdminListQuery,
  useAdminUpdateMutation,
  useAdminDeleteMutation,
  useAdminReorderMutation,
} from "@/store";

// Lib
import { buildPath } from "@/lib";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import { MenuItemForm } from "../../_forms/MenuItemForm";
import { locAz } from "../../_forms/Localized";

/**
 * Menyu redaktoru — ağac görünüşü.
 *
 * Əvvəl menyu ümumi cədvəldə düz siyahı idi: hansı bəndin hansının altında
 * olduğu görünmürdü, sıranı dəyişmək üçün hər bəndə rəqəm yazmaq lazım idi.
 * İndi saytdakı kimi iki səviyyəli ağacdır: üst bənd açılır, alt bəndlər
 * içindədir; sıra oxlarla, alt bənd «+» ilə əlavə olunur.
 *
 * Sıra QONŞULAR arasında dəyişir (eyni üst bəndin uşaqları və ya üst
 * səviyyə). Server göndərilən id-lərin öz yerləri arasında yerdəyişmə edir
 * (planReorder) — digər bəndlərin sırası pozulmur.
 */

const LOCATIONS = [
  { key: "header", label: "Yuxarı menyu" },
  { key: "footer", label: "Footer" },
  { key: "mobile", label: "Mobil" },
];

const TYPE_BADGE = {
  mega: { label: "Kurslar mega menyusu", cls: "bg-indigo-50 text-indigo-700" },
  dropdown: { label: "Ölkələr (avtomatik)", cls: "bg-violet-50 text-violet-700" },
};

const idOf = (v) => (v && typeof v === "object" ? v._id : v) || null;
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
const missingLangs = (label) => ["en", "ru"].filter((l) => !String(label?.[l] || "").trim());

export default function MenuItemsPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminListQuery({ resource: "menu-items", limit: 100 });
  const [update] = useAdminUpdateMutation();
  const [remove] = useAdminDeleteMutation();
  const [reorder] = useAdminReorderMutation();

  const [location, setLocation] = useState("header");
  const [open, setOpen] = useState(() => new Set());
  const [editing, setEditing] = useState(null); // null | { item?, defaults? }

  const items = useMemo(() => data?.data?.items || [], [data]);
  const maxOrder = items.reduce((m, i) => Math.max(m, i.order ?? 0), 0);

  // Ağac: üst səviyyə + hər birinin uşaqları (sıraya görə).
  const tree = useMemo(() => {
    const here = items.filter((i) => i.location === location);
    return here
      .filter((i) => !idOf(i.parent))
      .sort(byOrder)
      .map((p) => ({ ...p, children: here.filter((c) => idOf(c.parent) === p._id).sort(byOrder) }));
  }, [items, location]);

  const counts = Object.fromEntries(LOCATIONS.map((l) => [l.key, items.filter((i) => i.location === l.key).length]));

  const toggle = (id) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allOpen = tree.length > 0 && tree.every((p) => !p.children.length || open.has(p._id));
  const toggleAll = () => setOpen(allOpen ? new Set() : new Set(tree.filter((p) => p.children.length).map((p) => p._id)));

  const move = async (siblings, index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= siblings.length) return;
    const ids = siblings.map((s) => s._id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await reorder({ resource: "menu-items", ids }).unwrap();
    } catch (err) {
      notify.error(apiErrorMessage(err, "Sıra dəyişmədi"));
    }
  };

  const toggleVisible = async (item) => {
    try {
      await update({ resource: "menu-items", id: item._id, data: { isVisible: !item.isVisible } }).unwrap();
    } catch (err) {
      notify.error(apiErrorMessage(err, "Dəyişmədi"));
    }
  };

  const del = async (item, childCount) => {
    const ok = await confirmDialog({
      tone: "error",
      title: "Bənd silinsin?",
      text: childCount
        ? `«${locAz(item.label)}» və onun ${childCount} alt bəndi silinəcək.`
        : `«${locAz(item.label)}» menyudan silinəcək.`,
      confirmText: "Sil",
      cancelText: "İmtina",
    });
    if (!ok) return;
    try {
      // Alt bəndlər əvvəl — yoxsa üst bəndsiz qalıb heç yerdə görünməzdilər.
      const kids = items.filter((i) => idOf(i.parent) === item._id);
      for (const k of kids) await remove({ resource: "menu-items", id: k._id }).unwrap();
      await remove({ resource: "menu-items", id: item._id }).unwrap();
      notify.success("Silindi");
    } catch (err) {
      notify.error(apiErrorMessage(err, "Silinmədi"));
    }
  };

  const addTop = () => setEditing({ defaults: { location, order: maxOrder + 1 } });
  const addChild = (parent) => {
    setOpen((s) => new Set(s).add(parent._id));
    setEditing({ defaults: { location, parent: parent._id, order: maxOrder + 1 } });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Menyu yeri" className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
          {LOCATIONS.map((l) => (
            <button
              key={l.key}
              role="tab"
              aria-selected={location === l.key}
              onClick={() => setLocation(l.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                location === l.key ? "bg-[#00157A] text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {l.label}
              <span className={`ml-1.5 text-xs ${location === l.key ? "text-white/70" : "text-gray-400"}`}>{counts[l.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {tree.some((p) => p.children.length) && (
            <button
              type="button"
              onClick={toggleAll}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300"
            >
              {allOpen ? "Hamısını bağla" : "Hamısını aç"}
            </button>
          )}
          <button
            type="button"
            onClick={addTop}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00157A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00157A]/90"
          >
            <Plus className="h-4 w-4" /> Yeni bənd
          </button>
        </div>
      </div>

      {isLoading || isError ? (
        <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} />
      ) : tree.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          Bu menyuda hələ bənd yoxdur.
        </div>
      ) : (
        <ul className={`space-y-2 ${isFetching ? "opacity-70" : ""}`}>
          {tree.map((p, i) => {
            const isOpen = open.has(p._id);
            const auto = TYPE_BADGE[p.type];
            return (
              <li key={p._id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <Row
                  item={p}
                  onToggle={p.children.length ? () => toggle(p._id) : null}
                  isOpen={isOpen}
                  badge={
                    auto ? (
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${auto.cls}`}>{auto.label}</span>
                    ) : p.children.length ? (
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                        Açılan menyu · {p.children.length}
                      </span>
                    ) : null
                  }
                  first={i === 0}
                  last={i === tree.length - 1}
                  onUp={() => move(tree, i, -1)}
                  onDown={() => move(tree, i, 1)}
                  onVisible={() => toggleVisible(p)}
                  onEdit={() => setEditing({ item: p })}
                  onDelete={() => del(p, p.children.length)}
                  onAddChild={auto ? null : () => addChild(p)}
                />
                {isOpen && p.children.length > 0 && (
                  <ul className="border-t border-gray-100 bg-gray-50/60 py-1">
                    {p.children.map((c, j) => (
                      <li key={c._id}>
                        <Row
                          item={c}
                          child
                          first={j === 0}
                          last={j === p.children.length - 1}
                          onUp={() => move(p.children, j, -1)}
                          onDown={() => move(p.children, j, 1)}
                          onVisible={() => toggleVisible(c)}
                          onEdit={() => setEditing({ item: c })}
                          onDelete={() => del(c, 0)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-xs text-gray-400">
        Linklər AZ ünvanı ilə yazılır, EN/RU versiyası avtomatik çevrilir (məs. /bloq → /en/blog). Gizlədilən bənd
        saytda görünmür, amma silinmir.
      </p>

      {editing && <MenuItemForm item={editing.item} defaults={editing.defaults} onClose={() => setEditing(null)} />}
    </div>
  );
}

function IconBtn({ label, onClick, disabled, children, tone = "gray" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-lg transition disabled:pointer-events-none disabled:opacity-25 ${
        tone === "red" ? "text-red-500 hover:bg-red-50" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ item, child, onToggle, isOpen, badge, first, last, onUp, onDown, onVisible, onEdit, onDelete, onAddChild }) {
  const missing = missingLangs(item.label);
  const href = item.href || "";
  return (
    <div className={`flex items-center gap-2 px-3 py-2 ${child ? "pl-6" : ""} ${item.isVisible ? "" : "opacity-55"}`}>
      {child ? (
        <CornerDownRight className="h-4 w-4 flex-none text-gray-300" />
      ) : onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Bağla" : "Aç"}
          className="grid h-8 w-8 flex-none place-items-center rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
        </button>
      ) : (
        <span className="w-8 flex-none" />
      )}

      <button type="button" onClick={onToggle || onEdit} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-semibold text-gray-900 ${child ? "text-sm" : ""}`}>{locAz(item.label) || "—"}</span>
          {badge}
          {!item.isVisible && <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">Gizli</span>}
          {missing.length > 0 && (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700" title="Bu dillərdə başlıq yazılmayıb — AZ göstəriləcək">
              {missing.map((l) => l.toUpperCase()).join(", ")} yoxdur
            </span>
          )}
        </div>
        {href && (
          <div className="mt-0.5 truncate text-xs text-gray-400" title={["az", "en", "ru"].map((l) => buildPath(href, l)).join("  ·  ")}>
            {href.startsWith("/") ? (
              <>
                {buildPath(href, "az")} <span className="text-gray-300">·</span> {buildPath(href, "en")}{" "}
                <span className="text-gray-300">·</span> {buildPath(href, "ru")}
              </>
            ) : (
              href
            )}
          </div>
        )}
      </button>

      <div className="flex flex-none items-center">
        {onAddChild && (
          <button
            type="button"
            onClick={onAddChild}
            aria-label="Alt bənd əlavə et"
            className="mr-1 inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 hover:border-blue-500 hover:text-blue-700"
          >
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Alt bənd</span>
          </button>
        )}
        <IconBtn label="Yuxarı" onClick={onUp} disabled={first}>
          <ChevronUp className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Aşağı" onClick={onDown} disabled={last}>
          <ChevronDown className="h-4 w-4" />
        </IconBtn>
        <IconBtn label={item.isVisible ? "Gizlət" : "Göstər"} onClick={onVisible}>
          {item.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </IconBtn>
        <IconBtn label="Redaktə et" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Sil" onClick={onDelete} tone="red">
          <Trash2 className="h-4 w-4" />
        </IconBtn>
      </div>
    </div>
  );
}
