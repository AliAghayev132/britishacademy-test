"use client";

// ── MenuItem admin form ──
// Bespoke create/edit form for the editable navigation. Items are hard-deleted
// (no isDeleted / slug). Matches the BranchForm style.

// React
import { useState } from "react";

// Store
import { useAdminListQuery, useAdminCreateMutation, useAdminUpdateMutation } from "@/store";

// Lib
import { buildPath, ROUTE_SLUGS } from "@/lib";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import {
  Overlay,
  Field,
  TextInput,
  NumberInput,
  NativeSelect,
  Toggle,
  SectionTitle,
  toId,
} from "./kit";
import { LocalizedInput, toLoc, trimLoc, locAz, confirmLocalized } from "./Localized";

// «dropdown» və «mega» məzmunu AVTOMATİK qurulur (ölkələr / kurs kateqoriyaları);
// adi açılan menyu üçün «Link» seçib altına bənd əlavə etmək kifayətdir.
const TYPE_OPTIONS = [
  { value: "link", label: "Link (alt bəndi varsa — açılan menyu)" },
  { value: "dropdown", label: "Xaricdə təhsil ölkələri (avtomatik)" },
  { value: "mega", label: "Kurslar mega menyusu (avtomatik)" },
];

/** Saytın sabit səhifələri — link yazmaq əvəzinə seçmək üçün. */
const PAGE_NAMES = {
  haqqimizda: "Haqqımızda", kurslar: "Kurslar", muellimler: "Müəllimlər", filiallar: "Filiallar",
  "xaricde-tehsil": "Xaricdə təhsil", layiheler: "Layihələr", telebelerimiz: "Tələbələrimiz",
  bloq: "Bloq", elaqe: "Əlaqə", testler: "Testlər", "mexfilik-siyaseti": "Məxfilik siyasəti",
};
const PAGE_OPTIONS = [
  { value: "/", label: "Ana səhifə" },
  ...Object.keys(ROUTE_SLUGS).map((k) => ({ value: `/${k}`, label: PAGE_NAMES[k] || k })),
];

/**
 * Linkin hər dildə ünvanı. Saytın öz səhifələrinin BİRİNCİ hissəsi avtomatik
 * tərcümə olunur (/bloq → /en/blog); kurs, kateqoriya, bloq yazısı kimi
 * bazadan gələn hissə isə hər dildə eyni qalır.
 */
function LinkPreview({ href }) {
  const h = href.trim();
  if (!h) return null;
  if (!h.startsWith("/")) {
    return <p className="mt-1.5 text-xs text-gray-400">Xarici link — hər dildə eyni ünvan açılır.</p>;
  }
  const first = h.split("/").filter(Boolean)[0];
  const known = !first || ROUTE_SLUGS[first];
  return (
    <div className="mt-1.5 space-y-0.5 text-xs">
      {["az", "en", "ru"].map((l) => (
        <div key={l} className="flex gap-2">
          <span className="w-6 font-semibold uppercase text-gray-400">{l}</span>
          <code className="text-gray-600">{buildPath(h, l)}</code>
        </div>
      ))}
      {!known && (
        <p className="pt-1 text-amber-600">
          «/{first}» saytın tanınan səhifələrindən deyil — EN/RU-da tərcümə olunmayacaq.
        </p>
      )}
    </div>
  );
}

const LOCATION_OPTIONS = [
  { value: "header", label: "Header" },
  { value: "footer", label: "Footer" },
  { value: "mobile", label: "Mobil" },
];

/**
 * `defaults` — yeni bənd üçün ilkin dəyərlər (ağacdakı «+ alt bənd» düyməsi
 * üst bəndi və yeri, sonuncu sıranı ötürür).
 */
export function MenuItemForm({ item, defaults = {}, onClose }) {
  const isEdit = Boolean(item?._id);

  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();

  const { data: menuData } = useAdminListQuery({
    resource: "menu-items",
    limit: 100,
  });
  const all = menuData?.data?.items || [];

  const [label, setLabel] = useState(toLoc(item?.label));
  const [href, setHref] = useState(item?.href || "");
  const [type, setType] = useState(item?.type || "link");
  const [location, setLocation] = useState(item?.location || defaults.location || "header");
  const [parent, setParent] = useState(toId(item?.parent) || defaults.parent || "");
  const [order, setOrder] = useState(
    item?.order != null ? String(item.order) : String(defaults.order ?? 0),
  );

  // Menyu İKİ səviyyəlidir: üst bənd yalnız eyni yerdəki ÜST SƏVİYYƏ bənd ola
  // bilər. Öz alt bəndləri olan bənd başqasının altına keçə bilməz — üçüncü
  // səviyyə saytda göstərilmir, bəndlər səssizcə yox olardı.
  const hasChildren = isEdit && all.some((m) => toId(m.parent) === item._id);
  const parentOptions = all
    .filter((m) => !m.parent && m._id !== item?._id && m.location === location)
    .map((m) => ({ value: m._id, label: locAz(m.label) }));
  // Model field is `isVisible` (menu items have no isActive/isDeleted).
  const [isVisible, setIsVisible] = useState(
    isEdit ? Boolean(item?.isVisible) : true,
  );

  const [error, setError] = useState("");

  const saving = creating || updating;

  const onSave = async () => {
    setError("");

    const guard = await confirmLocalized([{ label: "Başlıq", value: label, required: true }]);
    if (!guard.ok) {
      if (guard.error) setError(guard.error);
      return;
    }

    const data = {
      label: trimLoc(label),
      href: href.trim(),
      type,
      location,
      parent: parent || null,
      order: Number(order) || 0,
      isVisible,
    };

    try {
      if (isEdit) {
        await update({
          resource: "menu-items",
          id: item._id,
          data,
        }).unwrap();
      } else {
        await create({ resource: "menu-items", data }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Xəta baş verdi"));
    }
  };

  return (
    <Overlay
      localized
      title={isEdit ? "Menyu bəndini redaktə et" : "Yeni menyu bəndi"}
      onClose={onClose}
      onSave={onSave}
      saving={saving}
      error={error}
    >
      <section className="space-y-4">
        <SectionTitle>Əsas</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Başlıq" required info="3 dildə — AZ mütləqdir">
            <LocalizedInput value={label} onChange={setLabel} />
          </Field>
          <Field
            label="Link"
            info="Siyahıdan səhifə seçin və ya özünüz yazın. AZ ünvanı yazılır — EN/RU avtomatik çevrilir."
          >
            <TextInput
              value={href}
              placeholder="/bloq"
              list="menu-link-pages"
              onChange={(e) => setHref(e.target.value)}
            />
            <datalist id="menu-link-pages">
              {PAGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </datalist>
            <LinkPreview href={href} />
          </Field>
          <Field label="Növ" info="Link, açılan menyu və ya mega menyu">
            <NativeSelect
              value={type}
              options={TYPE_OPTIONS}
              onChange={(e) => setType(e.target.value)}
            />
          </Field>
          <Field label="Yerləşmə" info="Hansı menyuda görünsün">
            <NativeSelect
              value={location}
              options={LOCATION_OPTIONS}
              onChange={(e) => {
                setLocation(e.target.value);
                setParent(""); // üst bənd başqa yerə aid ola bilməz
              }}
            />
          </Field>
          <Field
            label="Üst bənd"
            info={hasChildren ? "Bu bəndin öz alt bəndləri var — başqasının altına keçə bilməz" : "Boş = üst səviyyə; seçsəniz həmin bəndin açılan menyusunda görünür"}
            className="sm:col-span-2"
          >
            <NativeSelect
              value={parent}
              placeholder="Yoxdur (üst səviyyə)"
              options={hasChildren ? [] : parentOptions}
              disabled={hasChildren}
              onChange={(e) => setParent(e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>Parametrlər</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Sıra" info="Kiçik rəqəm əvvəldə görünür">
            <NumberInput
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </Field>
          <div className="flex items-center">
            <Toggle
              checked={isVisible}
              onChange={setIsVisible}
              label="Görünsün"
            />
          </div>
        </div>
      </section>
    </Overlay>
  );
}
