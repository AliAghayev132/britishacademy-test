"use client";

// ── CourseCategory admin form ──
// Bespoke create/edit form for the self-referencing course-category tree that
// mirrors the "Xidmətlər" mega-menu. Matches the BranchForm style.

import { useState } from "react";
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
import {
  useAdminListQuery,
  useAdminCreateMutation,
  useAdminUpdateMutation,
} from "@/store/api/adminApi";

export function CourseCategoryForm({ item, onClose }) {
  const isEdit = Boolean(item?._id);

  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();

  // Other categories, for the parent picker (exclude self when editing).
  const { data: catData } = useAdminListQuery({
    resource: "course-categories",
    limit: 100,
  });
  const parentOptions = (catData?.data?.items || [])
    .filter((c) => c._id !== item?._id)
    .map((c) => ({ value: c._id, label: c.name }));

  const [name, setName] = useState(item?.name || "");
  const [slug, setSlug] = useState(item?.slug || "");
  const [icon, setIcon] = useState(item?.icon || "");
  const [parent, setParent] = useState(toId(item?.parent));
  const [order, setOrder] = useState(
    item?.order != null ? String(item.order) : "0",
  );
  const [isActive, setIsActive] = useState(
    isEdit ? Boolean(item?.isActive) : true,
  );

  const [error, setError] = useState("");

  const saving = creating || updating;

  const onSave = async () => {
    setError("");

    const data = {
      name: name.trim(),
      icon: icon.trim(),
      parent: parent || null,
      order: Number(order) || 0,
      isActive,
    };

    // Slug is optional — the API generates one when omitted.
    const slugVal = slug.trim();
    if (slugVal) data.slug = slugVal;

    try {
      if (isEdit) {
        await update({
          resource: "course-categories",
          id: item._id,
          data,
        }).unwrap();
      } else {
        await create({ resource: "course-categories", data }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Xəta baş verdi");
    }
  };

  return (
    <Overlay
      title={isEdit ? "Kateqoriyanı redaktə et" : "Yeni kateqoriya"}
      onClose={onClose}
      onSave={onSave}
      saving={saving}
      error={error}
    >
      <section className="space-y-4">
        <SectionTitle>Əsas</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Ad" required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field
            label="Slug (linki)"
            info="Boş buraxsan avtomatik yaranır"
          >
            <TextInput
              value={slug}
              placeholder="dil-kurslari"
              onChange={(e) => setSlug(e.target.value)}
            />
          </Field>
          <Field label="İkon" info="Emoji, məs. 📚 və ya ikon adı">
            <TextInput
              value={icon}
              placeholder="📚"
              onChange={(e) => setIcon(e.target.value)}
            />
          </Field>
          <Field
            label="Üst kateqoriya"
            info="Boş = kök səviyyə (mega-menyunun başlığı)"
          >
            <NativeSelect
              value={parent}
              placeholder="Yoxdur (kök)"
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
            <Toggle checked={isActive} onChange={setIsActive} label="Aktiv" />
          </div>
        </div>
      </section>
    </Overlay>
  );
}
