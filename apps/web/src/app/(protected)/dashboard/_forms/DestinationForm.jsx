"use client";

// ── Destination form ──
// Bespoke create/edit form covering the whole Destination model (study-abroad
// country / scholarship programme). Follows the teacher/branch form pattern.

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
import { FileUpload } from "@/components/ui/FileUpload";
import { SeoFields } from "./SeoFields";
import { LocalizedInput, LocalizedEditor, toLoc, trimLoc, locAz, confirmLocalized } from "./Localized";
// Utils
import { getImageUrl } from "@/utils/getImageUrl";

export function DestinationForm({ item, onClose }) {
  const isEdit = Boolean(item?._id);

  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();
  const saving = creating || updating;

  const [error, setError] = useState("");

  // ── Basic ──
  const [country, setCountry] = useState(toLoc(item?.country));
  const [region, setRegion] = useState(toLoc(item?.region));
  const [slug, setSlug] = useState(item?.slug || "");
  const [color, setColor] = useState(item?.color || "#2E6BE6");
  const [tagline, setTagline] = useState(toLoc(item?.tagline));
  const [lead, setLead] = useState(toLoc(item?.lead));
  const [image, setImage] = useState(item?.image || "");
  const [contentHtml, setContentHtml] = useState(toLoc(item?.contentHtml));

  // ── Facts (label/value) ──
  const [facts, setFacts] = useState(
    (item?.facts || []).map((f) => ({ label: f.label || "", value: f.value || "" })),
  );

  // ── Universities (name/city/url) ──
  const [universities, setUniversities] = useState(
    (item?.universities || []).map((u) => ({
      name: u.name || "",
      city: u.city || "",
      url: u.url || "",
    })),
  );

  // ── SEO ──
  const [seo, setSeo] = useState(item?.seo || {});

  // ── Parameters ──
  const [isScholarship, setIsScholarship] = useState(Boolean(item?.isScholarship));
  const [isFeatured, setIsFeatured] = useState(Boolean(item?.isFeatured));
  const [order, setOrder] = useState(item?.order ?? 0);
  const [isActive, setIsActive] = useState(isEdit ? Boolean(item?.isActive) : true);

  // ── Fact row helpers ──
  const addFact = () => setFacts((rows) => [...rows, { label: "", value: "" }]);
  const updateFact = (i, patch) =>
    setFacts((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeFact = (i) => setFacts((rows) => rows.filter((_, idx) => idx !== i));

  // ── University row helpers ──
  const addUniversity = () =>
    setUniversities((rows) => [...rows, { name: "", city: "", url: "" }]);
  const updateUniversity = (i, patch) =>
    setUniversities((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  const removeUniversity = (i) =>
    setUniversities((rows) => rows.filter((_, idx) => idx !== i));

  // ── Save ──
  const handleSave = async () => {
    setError("");

    const guard = await confirmLocalized([
      { label: "Ölkə", value: country, required: true },
      { label: "Region", value: region },
      { label: "Şüar", value: tagline },
      { label: "Giriş mətni", value: lead },
      { label: "Məzmun", value: contentHtml },
    ]);
    if (!guard.ok) {
      if (guard.error) setError(guard.error);
      return;
    }

    const data = {
      country: trimLoc(country),
      region: trimLoc(region),
      color: color || "#2E6BE6",
      tagline: trimLoc(tagline),
      lead: trimLoc(lead),
      image: image.trim(),
      contentHtml: trimLoc(contentHtml),
      isScholarship,
      isFeatured,
      order: Number(order) || 0,
      isActive,
      seo,
      facts: facts
        .filter((f) => f.label.trim() && f.value.trim())
        .map((f) => ({ label: f.label.trim(), value: f.value.trim() })),
      universities: universities
        .filter((u) => u.name.trim())
        .map((u) => ({ name: u.name.trim(), city: u.city.trim(), url: u.url.trim() })),
    };

    // Slug only when set — server auto-generates otherwise.
    if (slug.trim()) data.slug = slug.trim();

    try {
      if (isEdit) {
        await update({ resource: "destinations", id: item._id, data }).unwrap();
      } else {
        await create({ resource: "destinations", data }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Xəta baş verdi");
    }
  };

  // ── Preview (destination card) ──
  const preview = (
    <div
      className="max-w-sm overflow-hidden rounded-2xl border bg-white shadow-sm"
      style={{ borderColor: color }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={getImageUrl(image)} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full" style={{ backgroundColor: color }} />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900">{locAz(country) || "Ölkə"}</h3>
          {isScholarship && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              Təqaüd
            </span>
          )}
        </div>
        {locAz(region) && <p className="text-xs font-medium text-gray-400">{locAz(region)}</p>}
        {locAz(tagline) && (
          <p className="mt-1 text-sm font-semibold" style={{ color }}>
            {locAz(tagline)}
          </p>
        )}
        {locAz(lead) && <p className="mt-2 text-sm text-gray-600">{locAz(lead)}</p>}
        {locAz(contentHtml) && (
          <div
            className="bz-body mt-4"
            dangerouslySetInnerHTML={{ __html: locAz(contentHtml) }}
          />
        )}
      </div>
    </div>
  );

  return (
    <Overlay
      title={isEdit ? "İstiqaməti redaktə et" : "Yeni istiqamət"}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Ölkə" required info="3 dildə — AZ mütləqdir">
            <LocalizedInput
              value={country}
              onChange={setCountry}
              placeholder="Böyük Britaniya"
            />
          </Field>
          <Field label="Region" info="3 dildə — məs: Avropa, Şimali Amerika">
            <LocalizedInput
              value={region}
              onChange={setRegion}
              placeholder="Avropa"
            />
          </Field>
          <Field label="Rəng" info="Kartın vurğu rəngi (bayraqdan)">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-full cursor-pointer rounded-lg border border-gray-300 bg-white p-1"
            />
          </Field>
          <Field label="Şüar (tagline)" info="3 dildə — qısa cəlbedici ifadə">
            <LocalizedInput
              value={tagline}
              onChange={setTagline}
              placeholder="Ödənişsiz universitetlər"
            />
          </Field>
          <Field
            label="Slug (linki)"
            info="Boş buraxsan avtomatik yaranır"
            className="sm:col-span-2"
          >
            <TextInput
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="boyuk-britaniya"
            />
          </Field>
        </div>
        <Field label="Giriş mətni (lead)" info="3 dildə">
          <LocalizedInput value={lead} onChange={setLead} multiline rows={3} />
        </Field>
        <Field label="Şəkil">
          <FileUpload value={image} onChange={setImage} kind="image" />
        </Field>
      </section>

      {/* ── Məzmun ── */}
      <section className="space-y-4">
        <SectionTitle>Məzmun</SectionTitle>
        <Field label="Məzmun" info="3 dildə">
          <LocalizedEditor value={contentHtml} onChange={setContentHtml} />
        </Field>
      </section>

      {/* ── Faktlar ── */}
      <section className="space-y-4">
        <SectionTitle right={<AddButton onClick={addFact}>Fakt</AddButton>}>
          Faktlar
        </SectionTitle>
        {facts.length === 0 && (
          <p className="text-sm text-gray-400">Fakt əlavə edilməyib</p>
        )}
        <div className="space-y-3">
          {facts.map((f, i) => (
            <div key={i} className="flex items-end gap-3">
              <Field label="Etiket" className="flex-1">
                <TextInput
                  value={f.label}
                  onChange={(e) => updateFact(i, { label: e.target.value })}
                  placeholder="Təhsil dili"
                />
              </Field>
              <Field label="Dəyər" className="flex-1">
                <TextInput
                  value={f.value}
                  onChange={(e) => updateFact(i, { value: e.target.value })}
                  placeholder="İngilis dili"
                />
              </Field>
              <div className="pb-1">
                <RemoveButton onClick={() => removeFact(i)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Universitetlər ── */}
      <section className="space-y-4">
        <SectionTitle
          right={<AddButton onClick={addUniversity}>Universitet</AddButton>}
        >
          Universitetlər
        </SectionTitle>
        {universities.length === 0 && (
          <p className="text-sm text-gray-400">Universitet əlavə edilməyib</p>
        )}
        <div className="space-y-3">
          {universities.map((u, i) => (
            <div key={i} className="flex items-end gap-3">
              <Field label="Ad" className="flex-1">
                <TextInput
                  value={u.name}
                  onChange={(e) => updateUniversity(i, { name: e.target.value })}
                  placeholder="University of Oxford"
                />
              </Field>
              <Field label="Şəhər" className="w-40">
                <TextInput
                  value={u.city}
                  onChange={(e) => updateUniversity(i, { city: e.target.value })}
                  placeholder="Oxford"
                />
              </Field>
              <Field label="Link" className="flex-1">
                <TextInput
                  value={u.url}
                  onChange={(e) => updateUniversity(i, { url: e.target.value })}
                  placeholder="https://…"
                />
              </Field>
              <div className="pb-1">
                <RemoveButton onClick={() => removeUniversity(i)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SEO ── */}
      <SeoFields value={seo} onChange={setSeo} />

      {/* ── Parametrlər ── */}
      <section className="space-y-4">
        <SectionTitle>Parametrlər</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Sıra">
            <NumberInput value={order} onChange={(e) => setOrder(e.target.value)} />
          </Field>
          <div className="flex flex-wrap items-end gap-6 pb-2">
            <Toggle
              checked={isScholarship}
              onChange={setIsScholarship}
              label="Təqaüd"
            />
            <Toggle checked={isFeatured} onChange={setIsFeatured} label="Seçilmiş" />
            <Toggle checked={isActive} onChange={setIsActive} label="Aktiv" />
          </div>
        </div>
      </section>
    </Overlay>
  );
}
