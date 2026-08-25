"use client";

// ── Blog post form ──
// Bespoke create/edit form covering the whole BlogPost model. Body is HTML
// (TipTap-produced on the real site); here it's a plain HTML textarea.

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
  TextArea,
  NativeSelect,
  SectionTitle,
  toId,
} from "./kit";
import { FileUpload } from "@/components/ui/FileUpload";
import { IMAGE_SPECS } from "@/lib/imageSpecs";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { SeoFields } from "./SeoFields";
import { LocalizedInput, LocalizedEditor, toLoc, trimLoc, locAz, confirmLocalized } from "./Localized";
// Utils
import { getImageUrl } from "@/utils/getImageUrl";

const STATUS_OPTIONS = [
  { value: "draft", label: "Qaralama" },
  { value: "published", label: "Dərc edilmiş" },
  { value: "archived", label: "Arxivləşdirilmiş" },
];

export function BlogPostForm({ item, onClose }) {
  const isEdit = Boolean(item?._id);

  const { data: catData } = useAdminListQuery({ resource: "blog-categories", limit: 100 });
  const categoryOptions = (catData?.data?.items || []).map((c) => ({
    value: c._id,
    label: locAz(c.name),
  }));

  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();
  const saving = creating || updating;

  const [error, setError] = useState("");

  // ── Basic ──
  const [title, setTitle] = useState(toLoc(item?.title));
  const [slug, setSlug] = useState(item?.slug || "");
  const [excerpt, setExcerpt] = useState(toLoc(item?.excerpt));
  const [cover, setCover] = useState(item?.cover || "");
  const [category, setCategory] = useState(toId(item?.category));
  const [status, setStatus] = useState(item?.status || "draft");
  // Teqlər hər dil üçün vergüllə ayrılmış mətndir ({ az, en, ru }).
  const [tags, setTags] = useState(
    toLoc(Array.isArray(item?.tags) ? item.tags.join(", ") : item?.tags),
  );
  const [readMinutes, setReadMinutes] = useState(item?.readMinutes ?? 3);
  const [content, setContent] = useState(toLoc(item?.content));

  // ── SEO ──
  const [seo, setSeo] = useState(item?.seo || {});

  // ── Save ──
  const handleSave = async () => {
    setError("");

    const guard = await confirmLocalized([
      { label: "Başlıq", value: title, required: true },
      { label: "Qısa təsvir", value: excerpt },
      { label: "Məzmun", value: content },
    ]);
    if (!guard.ok) {
      if (guard.error) setError(guard.error);
      return;
    }

    const data = {
      title: trimLoc(title),
      excerpt: trimLoc(excerpt),
      cover: cover.trim(),
      status,
      readMinutes: Number(readMinutes) || 0,
      content: trimLoc(content),
      tags: trimLoc(tags),
      seo,
    };

    if (slug.trim()) data.slug = slug.trim();
    if (category) data.category = category;

    try {
      if (isEdit) {
        await update({ resource: "blog-posts", id: item._id, data }).unwrap();
      } else {
        await create({ resource: "blog-posts", data }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Xəta baş verdi");
    }
  };

  // ── Preview (blog post card) ──
  const categoryLabel = categoryOptions.find((o) => o.value === category)?.label;
  const preview = (
    <div className="max-w-sm overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={getImageUrl(cover)} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-gray-100" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
          {categoryLabel && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
              {categoryLabel}
            </span>
          )}
          <span>{Number(readMinutes) || 0} dəq</span>
        </div>
        <h3 className="mt-2 text-lg font-bold text-gray-900">{locAz(title) || "Başlıq"}</h3>
        {locAz(excerpt) && <p className="mt-1 text-sm text-gray-600">{locAz(excerpt)}</p>}
        {locAz(content) && (
          <div
            className="bz-body mt-4"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(locAz(content)) }}
          />
        )}
      </div>
    </div>
  );

  return (
    <Overlay
      localized
      title={isEdit ? "Məqaləni redaktə et" : "Yeni məqalə"}
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      error={error}
      preview={preview}
      wide
    >
      {/* ── Əsas ── */}
      <section className="space-y-4">
        <SectionTitle>Əsas</SectionTitle>
        <Field label="Başlıq" required info="3 dildə — AZ mütləqdir">
          <LocalizedInput value={title} onChange={setTitle} />
        </Field>
        <Field label="Slug (linki)" info="Boş buraxsan avtomatik yaranır">
          <TextInput
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="ielts-hazirliq-melumatlari"
          />
        </Field>
        <Field label="Qısa təsvir (excerpt)" info="3 dildə">
          <LocalizedInput value={excerpt} onChange={setExcerpt} multiline rows={2} />
        </Field>
        <Field label="Örtük şəkli (cover)">
          <FileUpload value={cover} onChange={setCover} kind="image" spec={IMAGE_SPECS.blogCover} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Kateqoriya">
            <NativeSelect
              options={categoryOptions}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Seçilməyib"
            />
          </Field>
          <Field label="Status">
            <NativeSelect
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </Field>
          <Field label="Oxu müddəti (dəq)">
            <NumberInput
              value={readMinutes}
              onChange={(e) => setReadMinutes(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Teqlər" info="3 dildə — vergüllə ayır, məs: IELTS, təhsil, viza">
          <LocalizedInput
            value={tags}
            onChange={setTags}
            placeholder="IELTS, təhsil, viza"
          />
        </Field>
      </section>

      {/* ── Məzmun ── */}
      <section className="space-y-4">
        <SectionTitle>Məzmun</SectionTitle>
        <Field label="Məzmun" info="3 dildə">
          <LocalizedEditor value={content} onChange={setContent} />
        </Field>
      </section>

      {/* ── SEO ── */}
      <SeoFields value={seo} onChange={setSeo} />
    </Overlay>
  );
}
