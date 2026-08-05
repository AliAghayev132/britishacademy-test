"use client";

// ── Blog category form ──
// Small create/edit form for the BlogCategory model (the chip filter on Bloq).

import { useState } from "react";
import {
  Overlay,
  Field,
  TextInput,
  NumberInput,
  Toggle,
  SectionTitle,
} from "./kit";
import {
  useAdminCreateMutation,
  useAdminUpdateMutation,
} from "@/store/api/adminApi";

export function BlogCategoryForm({ item, onClose }) {
  const isEdit = Boolean(item?._id);

  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();
  const saving = creating || updating;

  const [error, setError] = useState("");

  const [name, setName] = useState(item?.name || "");
  const [slug, setSlug] = useState(item?.slug || "");
  const [color, setColor] = useState(item?.color || "#2E6BE6");
  const [order, setOrder] = useState(item?.order ?? 0);
  const [isActive, setIsActive] = useState(isEdit ? Boolean(item?.isActive) : true);

  const handleSave = async () => {
    setError("");

    const data = {
      name: name.trim(),
      color: color || "#2E6BE6",
      order: Number(order) || 0,
      isActive,
    };

    if (slug.trim()) data.slug = slug.trim();

    try {
      if (isEdit) {
        await update({ resource: "blog-categories", id: item._id, data }).unwrap();
      } else {
        await create({ resource: "blog-categories", data }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Xəta baş verdi");
    }
  };

  // ── Preview (category chip) ──
  const preview = (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold"
      style={{ borderColor: color, color }}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {name || "Kateqoriya"}
    </span>
  );

  return (
    <Overlay
      title={isEdit ? "Kateqoriyanı redaktə et" : "Yeni kateqoriya"}
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      error={error}
      preview={preview}
    >
      <section className="space-y-4">
        <SectionTitle>Əsas</SectionTitle>
        <Field label="Ad" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Slug (linki)" info="Boş buraxsan avtomatik yaranır">
          <TextInput
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="tehsil-xeberleri"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Rəng" info="Çip rəngi">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-full cursor-pointer rounded-lg border border-gray-300 bg-white p-1"
            />
          </Field>
          <Field label="Sıra">
            <NumberInput value={order} onChange={(e) => setOrder(e.target.value)} />
          </Field>
        </div>
        <div className="pt-1">
          <Toggle checked={isActive} onChange={setIsActive} label="Aktiv" />
        </div>
      </section>
    </Overlay>
  );
}
