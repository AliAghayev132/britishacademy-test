"use client";

// ── Page admin form ──
// Bespoke create/edit form for editorial pages (Haqqımızda, Əlaqə copy, …).
// Supports simple {heading, body} content blocks + SEO. Matches BranchForm style.

// React
import { useState } from "react";
// Data (RTK Query)
import {
  useAdminCreateMutation,
  useAdminUpdateMutation,
} from "@/store/api/adminApi";
// Local
import {
  Overlay,
  Field,
  TextInput,
  NumberInput,
  TextArea,
  Toggle,
  SectionTitle,
  AddButton,
  RemoveButton,
} from "./kit";
import { SeoFields } from "./SeoFields";

const emptyBlock = { heading: "", body: "" };

export function PageForm({ item, onClose }) {
  const isEdit = Boolean(item?._id);
  const isSystem = Boolean(item?.isSystem);

  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();

  const [title, setTitle] = useState(item?.title || "");
  const [slug, setSlug] = useState(item?.slug || "");
  const [h1, setH1] = useState(item?.h1 || "");
  const [lead, setLead] = useState(item?.lead || "");

  const [blocks, setBlocks] = useState(
    Array.isArray(item?.content) && item.content.length
      ? item.content.map((b) => ({
          heading: b.heading || "",
          body: b.body || "",
        }))
      : [],
  );

  const [seo, setSeo] = useState(item?.seo || {});

  const [order, setOrder] = useState(
    item?.order != null ? String(item.order) : "0",
  );
  const [isActive, setIsActive] = useState(
    isEdit ? Boolean(item?.isActive) : true,
  );

  const [error, setError] = useState("");

  // ── Content block helpers ──
  const addBlock = () => setBlocks((rows) => [...rows, { ...emptyBlock }]);
  const removeBlock = (i) =>
    setBlocks((rows) => rows.filter((_, idx) => idx !== i));
  const setBlock = (i, key, val) =>
    setBlocks((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)),
    );

  const saving = creating || updating;

  const onSave = async () => {
    setError("");

    const data = {
      title: title.trim(),
      h1: h1.trim(),
      lead: lead.trim(),
      order: Number(order) || 0,
      isActive,
      seo,
      // Simple paragraph blocks; prune empty rows.
      content: blocks
        .map((b) => ({
          type: "paragraph",
          heading: b.heading.trim(),
          body: b.body.trim(),
        }))
        .filter((b) => b.heading || b.body),
    };

    // Slug is optional — the API generates one when omitted.
    const slugVal = slug.trim();
    if (slugVal) data.slug = slugVal;

    try {
      if (isEdit) {
        await update({ resource: "pages", id: item._id, data }).unwrap();
      } else {
        await create({ resource: "pages", data }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Xəta baş verdi");
    }
  };

  return (
    <Overlay
      title={isEdit ? "Səhifəni redaktə et" : "Yeni səhifə"}
      subtitle={
        isSystem ? "Sistem səhifəsi — slug dəyişdirilə bilməz" : undefined
      }
      onClose={onClose}
      onSave={onSave}
      saving={saving}
      error={error}
      wide
    >
      {/* 1. Əsas */}
      <section className="space-y-4">
        <SectionTitle>Əsas</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Başlıq" required>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          {isSystem ? (
            <Field
              label="Slug (linki)"
              info="Sistem səhifəsi — kod bu slug-a bağlıdır, dəyişmək olmaz"
            >
              <TextInput value={slug} disabled />
            </Field>
          ) : (
            <Field label="Slug (linki)" info="Boş buraxsan avtomatik yaranır">
              <TextInput
                value={slug}
                placeholder="haqqimizda"
                onChange={(e) => setSlug(e.target.value)}
              />
            </Field>
          )}
          <Field label="H1 başlıq" info="Səhifədə görünən əsas başlıq">
            <TextInput value={h1} onChange={(e) => setH1(e.target.value)} />
          </Field>
          <Field label="Sıra" info="Kiçik rəqəm əvvəldə görünür">
            <NumberInput
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </Field>
          <Field label="Giriş mətni (lead)" className="sm:col-span-2">
            <TextArea
              rows={3}
              value={lead}
              onChange={(e) => setLead(e.target.value)}
            />
          </Field>
        </div>
      </section>

      {/* 2. Məzmun blokları */}
      <section className="space-y-4">
        <SectionTitle right={<AddButton onClick={addBlock}>Blok</AddButton>}>
          Məzmun blokları
        </SectionTitle>
        {blocks.length === 0 && (
          <p className="text-sm text-gray-400">Hələ blok əlavə edilməyib.</p>
        )}
        <div className="space-y-3">
          {blocks.map((b, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                <Field label={`Başlıq ${i + 1}`}>
                  <TextInput
                    value={b.heading}
                    onChange={(e) => setBlock(i, "heading", e.target.value)}
                  />
                </Field>
                <Field label="Mətn">
                  <TextArea
                    rows={4}
                    value={b.body}
                    onChange={(e) => setBlock(i, "body", e.target.value)}
                  />
                </Field>
              </div>
              <div className="pt-8">
                <RemoveButton onClick={() => removeBlock(i)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SEO */}
      <SeoFields value={seo} onChange={setSeo} />

      {/* 4. Parametrlər */}
      <section className="space-y-4">
        <SectionTitle>Parametrlər</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center">
            <Toggle checked={isActive} onChange={setIsActive} label="Aktiv" />
          </div>
        </div>
      </section>
    </Overlay>
  );
}
