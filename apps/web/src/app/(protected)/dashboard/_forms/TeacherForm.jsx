"use client";

// ── Teacher form ──
// Bespoke admin form covering the whole Teacher model. Uses the shared kit
// primitives and the RTK Query admin hooks. Renders inside <Overlay>.

import { useState } from "react";
import {
  Overlay,
  Field,
  TextInput,
  NumberInput,
  TextArea,
  MultiSelectChips,
  Toggle,
  SectionTitle,
  AddButton,
  RemoveButton,
  toId,
} from "./kit";
import {
  useAdminLookupsQuery,
  useAdminCreateMutation,
  useAdminUpdateMutation,
} from "@/store/api/adminApi";
import { FileUpload } from "@/components/ui/FileUpload";
import { getImageUrl } from "@/utils/getImageUrl";

export function TeacherForm({ item, onClose }) {
  const isEdit = Boolean(item?._id);

  const { data: lookups } = useAdminLookupsQuery();
  const branchOptions = (lookups?.data?.branches || []).map((b) => ({
    value: b._id,
    label: b.name,
  }));

  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();
  const saving = creating || updating;

  const [error, setError] = useState("");

  // ── Basic ──
  const [fullName, setFullName] = useState(item?.fullName || "");
  const [title, setTitle] = useState(item?.title || "");
  const [slug, setSlug] = useState(item?.slug || "");
  const [photo, setPhoto] = useState(item?.photo || "");
  const [color, setColor] = useState(item?.color || "#2E6BE6");
  const [bio, setBio] = useState(item?.bio || "");

  // ── Branches ──
  const [branches, setBranches] = useState(
    (item?.branches || []).map(toId),
  );

  // ── Certificates ──
  const [certificates, setCertificates] = useState(
    (item?.certificates || []).map((c) => ({
      title: c.title || "",
      image: c.image || "",
      year: c.year ?? "",
    })),
  );

  // ── Stats ──
  const [stats, setStats] = useState(
    (item?.stats || []).map((s) => ({
      label: s.label || "",
      value: s.value || "",
    })),
  );

  // ── Intro video ──
  const [introUrl, setIntroUrl] = useState(item?.introVideo?.url || "");
  const [introPoster, setIntroPoster] = useState(item?.introVideo?.poster || "");

  // ── Socials ──
  const [instagram, setInstagram] = useState(item?.socials?.instagram || "");
  const [linkedin, setLinkedin] = useState(item?.socials?.linkedin || "");

  // ── SEO ──
  const [metaTitle, setMetaTitle] = useState(item?.seo?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(
    item?.seo?.metaDescription || "",
  );

  // ── Parameters ──
  const [isFeatured, setIsFeatured] = useState(Boolean(item?.isFeatured));
  const [order, setOrder] = useState(item?.order ?? 0);
  const [isActive, setIsActive] = useState(
    isEdit ? Boolean(item?.isActive) : true,
  );

  // ── Repeatable row helpers ──
  const addCertificate = () =>
    setCertificates((rows) => [...rows, { title: "", image: "", year: "" }]);
  const updateCertificate = (i, patch) =>
    setCertificates((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  const removeCertificate = (i) =>
    setCertificates((rows) => rows.filter((_, idx) => idx !== i));

  const addStat = () => setStats((rows) => [...rows, { label: "", value: "" }]);
  const updateStat = (i, patch) =>
    setStats((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  const removeStat = (i) =>
    setStats((rows) => rows.filter((_, idx) => idx !== i));

  // ── Save ──
  const handleSave = async () => {
    setError("");

    const body = {
      fullName: fullName.trim(),
      title: title.trim(),
      photo: photo.trim(),
      color: color || "#2E6BE6",
      bio,
      branches,
      certificates: certificates
        .filter((c) => c.title.trim())
        .map((c) => ({
          title: c.title.trim(),
          image: c.image.trim(),
          year: c.year === "" ? undefined : Number(c.year),
        })),
      stats: stats
        .filter((s) => s.label.trim() || s.value.trim())
        .map((s) => ({ label: s.label.trim(), value: s.value.trim() })),
      socials: {
        instagram: instagram.trim(),
        linkedin: linkedin.trim(),
      },
      seo: {
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
      },
      isFeatured,
      order: Number(order) || 0,
      isActive,
    };

    // Only send slug when set — server auto-generates from the name otherwise.
    if (slug.trim()) body.slug = slug.trim();

    // Only send introVideo when a url exists.
    if (introUrl.trim()) {
      body.introVideo = { url: introUrl.trim(), poster: introPoster.trim() };
    }

    try {
      if (isEdit) {
        await update({ resource: "teachers", id: item._id, data: body }).unwrap();
      } else {
        await create({ resource: "teachers", data: body }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Xəta baş verdi");
    }
  };

  // ── Preview (as it will look on the site) ──
  const preview = (
    <div className="flex items-center gap-4">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getImageUrl(photo)}
          alt=""
          className="h-20 w-20 rounded-full object-cover"
        />
      ) : (
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
          style={{ background: color || "#2E6BE6" }}
        >
          {(fullName.trim()[0] || "?").toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <div className="truncate text-lg font-bold text-gray-900">
          {fullName.trim() || "Ad Soyad"}
        </div>
        {title.trim() && (
          <div className="truncate text-sm text-gray-500">{title.trim()}</div>
        )}
      </div>
    </div>
  );

  return (
    <Overlay
      title={isEdit ? "Müəllimi redaktə et" : "Yeni müəllim"}
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      error={error}
      preview={preview}
      wide
    >
      {/* ── Əsas ── */}
      <div className="space-y-4">
        <SectionTitle>Əsas</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ad Soyad" required>
            <TextInput
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Aygün Məmmədova"
            />
          </Field>
          <Field label="Başlıq" hint="Məs: IELTS 8.5 · İngilis dili">
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="IELTS 8.5 · İngilis dili"
            />
          </Field>
          <Field label="Slug (linki)" info="Boş buraxsan addan avtomatik yaranır">
            <TextInput
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="aygun-memmedova"
            />
          </Field>
          <Field label="Rəng" info="Şəkil yoxdursa avatar rəngi">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-full cursor-pointer rounded-lg border border-gray-300 bg-white p-1"
            />
          </Field>
        </div>
        <Field label="Şəkil" info="Kvadrat/portret şəkil daha yaxşı görünür">
          <FileUpload
            value={photo}
            onChange={(url) => setPhoto(url)}
            kind="image"
          />
        </Field>
        <Field label="Bio" hint="HTML dəstəklənir">
          <TextArea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </Field>
      </div>

      {/* ── Filiallar ── */}
      <div className="space-y-4">
        <SectionTitle>Filiallar</SectionTitle>
        <MultiSelectChips
          options={branchOptions}
          value={branches}
          onChange={setBranches}
          empty="Filial tapılmadı"
        />
      </div>

      {/* ── Sertifikatlar ── */}
      <div className="space-y-4">
        <SectionTitle
          right={<AddButton onClick={addCertificate}>Sertifikat</AddButton>}
        >
          Sertifikatlar
        </SectionTitle>
        {certificates.length === 0 && (
          <p className="text-sm text-gray-400">Sertifikat əlavə edilməyib</p>
        )}
        <div className="space-y-3">
          {certificates.map((c, i) => (
            <div key={i} className="flex items-end gap-3">
              <Field label="Başlıq" className="flex-1">
                <TextInput
                  value={c.title}
                  onChange={(e) => updateCertificate(i, { title: e.target.value })}
                  placeholder="IELTS Academic"
                />
              </Field>
              <Field label="Şəkil" className="flex-1">
                <FileUpload
                  value={c.image}
                  onChange={(url) => updateCertificate(i, { image: url })}
                  kind="image"
                />
              </Field>
              <Field label="İl" className="w-24">
                <NumberInput
                  value={c.year}
                  onChange={(e) => updateCertificate(i, { year: e.target.value })}
                  placeholder="2023"
                />
              </Field>
              <div className="pb-1">
                <RemoveButton onClick={() => removeCertificate(i)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Statistika ── */}
      <div className="space-y-4">
        <SectionTitle right={<AddButton onClick={addStat}>Göstərici</AddButton>}>
          Statistika
        </SectionTitle>
        {stats.length === 0 && (
          <p className="text-sm text-gray-400">Göstərici əlavə edilməyib</p>
        )}
        <div className="space-y-3">
          {stats.map((s, i) => (
            <div key={i} className="flex items-end gap-3">
              <Field label="Etiket" className="flex-1">
                <TextInput
                  value={s.label}
                  onChange={(e) => updateStat(i, { label: e.target.value })}
                  placeholder="Təcrübə"
                />
              </Field>
              <Field label="Dəyər" className="flex-1">
                <TextInput
                  value={s.value}
                  onChange={(e) => updateStat(i, { value: e.target.value })}
                  placeholder="10 il"
                />
              </Field>
              <div className="pb-1">
                <RemoveButton onClick={() => removeStat(i)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Video (intro) ── */}
      <div className="space-y-4">
        <SectionTitle>Video (intro)</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Video" info="Qısa tanıtım videosu">
            <FileUpload
              value={introUrl}
              onChange={(url) => setIntroUrl(url)}
              kind="video"
            />
          </Field>
          <Field label="Poster" info="Video oynamadan görünən şəkil">
            <FileUpload
              value={introPoster}
              onChange={(url) => setIntroPoster(url)}
              kind="image"
            />
          </Field>
        </div>
      </div>

      {/* ── Sosial ── */}
      <div className="space-y-4">
        <SectionTitle>Sosial</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Instagram">
            <TextInput
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/…"
            />
          </Field>
          <Field label="LinkedIn">
            <TextInput
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/…"
            />
          </Field>
        </div>
      </div>

      {/* ── SEO ── */}
      <div className="space-y-4">
        <SectionTitle>SEO</SectionTitle>
        <Field label="Meta başlıq">
          <TextInput
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
          />
        </Field>
        <Field label="Meta təsvir">
          <TextArea
            rows={2}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </Field>
      </div>

      {/* ── Parametrlər ── */}
      <div className="space-y-4">
        <SectionTitle>Parametrlər</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Sıra" info="Kiçik rəqəm əvvəl göstərilir">
            <NumberInput
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </Field>
          <div className="flex items-end gap-6 pb-2">
            <Toggle
              checked={isFeatured}
              onChange={setIsFeatured}
              label="Seçilmiş"
            />
            <Toggle checked={isActive} onChange={setIsActive} label="Aktiv" />
          </div>
        </div>
      </div>
    </Overlay>
  );
}
