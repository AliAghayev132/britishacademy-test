"use client";

// ── Layihə forması ──
//
// Xaricdə təhsil (DestinationForm) ilə eyni quruluşdadır: başlıq, şüar, giriş
// mətni, rich-text məzmun, faktlar və SEO.
//
// FƏRQ: müraciət düyməsi. Layihə səhifəsində müraciət YALNIZ oradan edilir,
// ona görə düymənin görünüb-görünməməsi və mətni layihənin özündə saxlanılır.
// Bəzi layihələr yalnız məlumat xarakterlidir — onlarda düymə olmamalıdır.

// React
import { useState } from "react";
// Data (RTK Query)
import { useAdminCreateMutation, useAdminUpdateMutation } from "@/store/api/adminApi";
// Local
import {
  Overlay,
  Field,
  TextInput,
  NumberInput,
  Toggle,
  SectionTitle,
  AddButton,
  RemoveButton,
} from "./kit";
import { LocalizedInput, LocalizedEditor, toLoc, trimLoc, locAz, confirmLocalized } from "./Localized";
import { SeoFields } from "./SeoFields";
import { FileUpload } from "@/components/ui/FileUpload";
import { IMAGE_SPECS } from "@/lib/imageSpecs";

const emptyFact = () => ({ label: toLoc(""), value: toLoc("") });

export function ProjectForm({ item, onClose }) {
  const isEdit = Boolean(item?._id);

  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();
  const saving = creating || updating;

  const [error, setError] = useState("");

  const [title, setTitle] = useState(toLoc(item?.title));
  const [slug, setSlug] = useState(item?.slug || "");
  const [tagline, setTagline] = useState(toLoc(item?.tagline));
  const [lead, setLead] = useState(toLoc(item?.lead));
  const [contentHtml, setContentHtml] = useState(toLoc(item?.contentHtml));
  const [image, setImage] = useState(item?.image || "");
  const [color, setColor] = useState(item?.color || "#00157A");

  const [facts, setFacts] = useState(
    (item?.facts || []).map((f) => ({ label: toLoc(f.label), value: toLoc(f.value) })),
  );

  const [applyEnabled, setApplyEnabled] = useState(isEdit ? Boolean(item?.applyEnabled) : true);
  const [applyLabel, setApplyLabel] = useState(toLoc(item?.applyLabel));

  const [seo, setSeo] = useState(item?.seo || {});
  const [isFeatured, setIsFeatured] = useState(Boolean(item?.isFeatured));
  const [order, setOrder] = useState(item?.order ?? 0);
  const [isActive, setIsActive] = useState(isEdit ? Boolean(item?.isActive) : true);

  const addFact = () => setFacts((p) => [...p, emptyFact()]);
  const removeFact = (i) => setFacts((p) => p.filter((_, x) => x !== i));
  const setFact = (i, key, v) =>
    setFacts((p) => p.map((f, x) => (x === i ? { ...f, [key]: v } : f)));

  const handleSave = async () => {
    setError("");

    const guard = await confirmLocalized([
      { label: "Başlıq", value: title, required: true },
      { label: "Şüar", value: tagline },
      { label: "Giriş mətni", value: lead },
    ]);
    if (!guard.ok) {
      if (guard.error) setError(guard.error);
      return;
    }

    const data = {
      title: trimLoc(title),
      tagline: trimLoc(tagline),
      lead: trimLoc(lead),
      contentHtml: trimLoc(contentHtml),
      image: image.trim(),
      color: color || "#00157A",
      applyEnabled,
      applyLabel: trimLoc(applyLabel),
      isFeatured,
      order: Number(order) || 0,
      isActive,
      seo,
      // Boş sətirli faktlar atılır — səhifədə boş sətir kimi görünərdi.
      facts: facts.filter((f) => locAz(f.label).trim() && locAz(f.value).trim()),
    };

    // Slug yalnız doldurulubsa göndərilir — əks halda server özü qurur.
    if (slug.trim()) data.slug = slug.trim();

    try {
      if (isEdit) await update({ resource: "projects", id: item._id, data }).unwrap();
      else await create({ resource: "projects", data }).unwrap();
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Xəta baş verdi");
    }
  };

  const preview = (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: `${color}33`, background: `${color}0A` }}
    >
      <div className="text-sm font-bold text-gray-900">{locAz(title) || "Layihə adı"}</div>
      {locAz(tagline) && <div className="mt-0.5 text-xs text-gray-500">{locAz(tagline)}</div>}
    </div>
  );

  return (
    <Overlay
      localized
      title={isEdit ? "Layihəni redaktə et" : "Yeni layihə"}
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      error={error}
      preview={preview}
      wide
    >
      <section className="space-y-4">
        <SectionTitle>Əsas</SectionTitle>
        <Field label="Başlıq" required info="3 dildə — AZ mütləqdir">
          <LocalizedInput value={title} onChange={setTitle} />
        </Field>
        <Field label="Şüar (tagline)" info="3 dildə — kartda başlığın altında görünür">
          <LocalizedInput value={tagline} onChange={setTagline} />
        </Field>
        <Field label="Giriş mətni (lead)" info="3 dildə">
          <LocalizedInput value={lead} onChange={setLead} multiline rows={3} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Slug (linki)" info="Boş buraxsan avtomatik yaranır">
            <TextInput value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="yay-dusergesi" />
          </Field>
          <Field label="Rəng" info="Kartın vurğu rəngi">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-full cursor-pointer rounded-lg border border-gray-300 bg-white p-1"
            />
          </Field>
        </div>
        <Field label="Şəkil" info="Kartın və səhifənin başındakı şəkil">
          <FileUpload value={image} onChange={setImage} kind="image" spec={IMAGE_SPECS.blogCover} />
        </Field>
      </section>

      <section className="space-y-4">
        <SectionTitle>Məzmun</SectionTitle>
        <Field label="Ətraflı məzmun" info="3 dildə">
          <LocalizedEditor value={contentHtml} onChange={setContentHtml} />
        </Field>
      </section>

      <section className="space-y-4">
        <SectionTitle right={<AddButton onClick={addFact}>Fakt</AddButton>}>
          Faktlar
        </SectionTitle>
        {facts.length === 0 && (
          <p className="text-sm text-gray-400">Məsələn: müddət, iştirakçı sayı, yer.</p>
        )}
        {facts.map((f, i) => (
          <div key={i} className="flex items-end gap-2">
            <Field label="Etiket" className="flex-1">
              <LocalizedInput value={f.label} onChange={(v) => setFact(i, "label", v)} />
            </Field>
            <Field label="Dəyər" className="flex-1">
              <LocalizedInput value={f.value} onChange={(v) => setFact(i, "value", v)} />
            </Field>
            <RemoveButton onClick={() => removeFact(i)} />
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <SectionTitle>Müraciət</SectionTitle>
        <p className="-mt-2 text-xs text-gray-500">
          Müraciət yalnız bu layihənin öz səhifəsindən edilir — ümumi müraciət
          formasında layihə seçimi yoxdur.
        </p>
        <Toggle
          checked={applyEnabled}
          onChange={setApplyEnabled}
          label="Müraciət düyməsi göstərilsin"
        />
        {applyEnabled && (
          <Field label="Düymənin adı" info="3 dildə — boş qalsa «Müraciət et» işlənir">
            <LocalizedInput value={applyLabel} onChange={setApplyLabel} placeholder="Layihəyə qoşul" />
          </Field>
        )}
      </section>

      <SeoFields
        value={seo}
        onChange={setSeo}
        context={{ kind: "layihə", title, body: [tagline, lead, contentHtml] }}
      />

      <section className="space-y-4">
        <SectionTitle>Göstərilmə</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Sıra">
            <NumberInput value={order} onChange={(e) => setOrder(e.target.value)} />
          </Field>
        </div>
        <Toggle checked={isFeatured} onChange={setIsFeatured} label="Ana səhifədə göstər" />
        <Toggle checked={isActive} onChange={setIsActive} label="Aktiv" />
      </section>
    </Overlay>
  );
}
