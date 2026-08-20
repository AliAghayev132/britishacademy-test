"use client";

// ── Teacher form ──
// Bespoke admin form covering the whole Teacher model. Uses the shared kit
// primitives and the RTK Query admin hooks. Renders inside <Overlay>.

// React
import { useState } from "react";
// Data (RTK Query)
import {
  useAdminLookupsQuery,
  useAdminCreateMutation,
  useAdminUpdateMutation,
} from "@/store/api/adminApi";
// Local
import {
  Overlay,
  Field,
  TextInput,
  NumberInput,
  MultiSelectChips,
  Toggle,
  SectionTitle,
  AddButton,
  RemoveButton,
  toId,
} from "./kit";
import { FileUpload } from "@/components/ui/FileUpload";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { SeoFields } from "./SeoFields";
import { LocalizedInput, LocalizedEditor, toLoc, trimLoc, locAz, confirmLocalized } from "./Localized";
// Utils
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

  // ── Basic ── (fullName/title/bio çoxdillidir)
  const [fullName, setFullName] = useState(toLoc(item?.fullName));
  const [title, setTitle] = useState(toLoc(item?.title));
  const [slug, setSlug] = useState(item?.slug || "");
  const [photo, setPhoto] = useState(item?.photo || "");
  const [color, setColor] = useState(item?.color || "#2E6BE6");
  const [bio, setBio] = useState(toLoc(item?.bio));

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
  const [seo, setSeo] = useState(item?.seo || {});

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

    const guard = await confirmLocalized([
      { label: "Ad Soyad", value: fullName, required: true },
      { label: "Başlıq", value: title },
      { label: "Bio", value: bio },
    ]);
    if (!guard.ok) {
      if (guard.error) setError(guard.error);
      return;
    }

    const body = {
      fullName: trimLoc(fullName),
      title: trimLoc(title),
      photo: photo.trim(),
      color: color || "#2E6BE6",
      bio: trimLoc(bio),
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
      seo,
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

  // ── Preview (as it will look on the site) — AZ variantı ──
  const azName = locAz(fullName).trim();
  const azTitle = locAz(title).trim();
  const azBio = locAz(bio);
  const preview = (
    <div className="flex flex-wrap items-center gap-4">
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
          {(azName[0] || "?").toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <div className="truncate text-lg font-bold text-gray-900">
          {azName || "Ad Soyad"}
        </div>
        {azTitle && (
          <div className="truncate text-sm text-gray-500">{azTitle}</div>
        )}
      </div>
      {azBio && (
        <div
          className="bz-body mt-4 basis-full"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(azBio) }}
        />
      )}
    </div>
  );

  return (
    <Overlay
      localized
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
          <Field label="Ad Soyad" required info="3 dildə — AZ mütləqdir">
            <LocalizedInput
              value={fullName}
              onChange={setFullName}
              placeholder="Aygün Məmmədova"
            />
          </Field>
          <Field label="Başlıq" hint="Məs: IELTS 8.5 · İngilis dili">
            <LocalizedInput
              value={title}
              onChange={setTitle}
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
        <Field label="Bio" info="3 dildə">
          <LocalizedEditor value={bio} onChange={setBio} />
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
                <LocalizedInput
                  value={c.title}
                  onChange={(v) => updateCertificate(i, { title: v })}
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
                <LocalizedInput
                  value={s.label}
                  onChange={(v) => updateStat(i, { label: v })}
                  placeholder="Təcrübə"
                />
              </Field>
              <Field label="Dəyər" className="flex-1">
                <LocalizedInput
                  value={s.value}
                  onChange={(v) => updateStat(i, { value: v })}
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
      <SeoFields value={seo} onChange={setSeo} />

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
