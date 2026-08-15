"use client";

// ── MenuItem admin form ──
// Bespoke create/edit form for the editable navigation. Items are hard-deleted
// (no isDeleted / slug). Matches the BranchForm style.

// React
import { useState } from "react";
// Data (RTK Query)
import {
  useAdminListQuery,
  useAdminCreateMutation,
  useAdminUpdateMutation,
} from "@/store/api/adminApi";
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

const TYPE_OPTIONS = [
  { value: "link", label: "Link" },
  { value: "dropdown", label: "Dropdown" },
  { value: "mega", label: "Mega menyu" },
];

const LOCATION_OPTIONS = [
  { value: "header", label: "Header" },
  { value: "footer", label: "Footer" },
  { value: "mobile", label: "Mobil" },
];

export function MenuItemForm({ item, onClose }) {
  const isEdit = Boolean(item?._id);

  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();

  // Other menu items, for the parent picker (exclude self when editing).
  const { data: menuData } = useAdminListQuery({
    resource: "menu-items",
    limit: 100,
  });
  const parentOptions = (menuData?.data?.items || [])
    .filter((m) => m._id !== item?._id)
    .map((m) => ({ value: m._id, label: locAz(m.label) }));

  const [label, setLabel] = useState(toLoc(item?.label));
  const [href, setHref] = useState(item?.href || "");
  const [type, setType] = useState(item?.type || "link");
  const [location, setLocation] = useState(item?.location || "header");
  const [parent, setParent] = useState(toId(item?.parent));
  const [order, setOrder] = useState(
    item?.order != null ? String(item.order) : "0",
  );
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
      setError(err?.data?.message || "Xəta baş verdi");
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
            label="Link (href)"
            info="Dropdown/mega üçün boş buraxıla bilər"
          >
            <TextInput
              value={href}
              placeholder="/kurslar"
              onChange={(e) => setHref(e.target.value)}
            />
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
              onChange={(e) => setLocation(e.target.value)}
            />
          </Field>
          <Field
            label="Üst bənd"
            info="Boş = üst səviyyə; seçsən alt-bənd olur"
            className="sm:col-span-2"
          >
            <NativeSelect
              value={parent}
              placeholder="Yoxdur (üst səviyyə)"
              options={parentOptions}
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
