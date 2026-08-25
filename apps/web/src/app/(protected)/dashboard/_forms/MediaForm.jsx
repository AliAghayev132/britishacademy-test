"use client";

// ── Media form ──
// Media kitabxanası üçün upload-əsaslı form (əvvəllər xam JSON redaktoru
// açılırdı — "media json istəyir" problemi). Fayl yüklənir, url + filename
// avtomatik təyin olunur.

// React
import { useState } from "react";
// Data (RTK Query)
import { useAdminCreateMutation, useAdminUpdateMutation } from "@/store/api/adminApi";
// Local
import { Overlay, Field, TextInput, NativeSelect } from "./kit";
import { LocalizedInput, toLoc, trimLoc } from "./Localized";
import { FileUpload } from "@/components/ui/FileUpload";
import { IMAGE_SPECS } from "@/lib/imageSpecs";

const TYPE_OPTIONS = [
  { value: "image", label: "Şəkil" },
  { value: "video", label: "Video" },
];

export function MediaForm({ item, onClose }) {
  const isEdit = Boolean(item?._id);

  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();
  const saving = creating || updating;

  const [type, setType] = useState(item?.type || "image");
  const [url, setUrl] = useState(item?.url || "");
  const [alt, setAlt] = useState(toLoc(item?.alt));
  const [error, setError] = useState("");

  const onSave = async () => {
    setError("");
    if (!url.trim()) {
      setError("Əvvəlcə fayl yükləyin");
      return;
    }
    const filename = url.split("/").pop() || "media";
    const data = { url: url.trim(), filename, alt: trimLoc(alt), type };
    try {
      if (isEdit) {
        await update({ resource: "media", id: item._id, data }).unwrap();
      } else {
        await create({ resource: "media", data }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Xəta baş verdi");
    }
  };

  return (
    <Overlay
      localized
      title={isEdit ? "Medianı redaktə et" : "Yeni media"}
      onClose={onClose}
      onSave={onSave}
      saving={saving}
      error={error}
    >
      <section className="space-y-4">
        <Field label="Növ">
          <NativeSelect
            options={TYPE_OPTIONS}
            value={type}
            onChange={(e) => { setType(e.target.value); setUrl(""); }}
          />
        </Field>
        <Field label={type === "video" ? "Video" : "Şəkil"} required info="Şəkil ≤30MB, video ≤100MB">
          <FileUpload
            value={url}
            onChange={setUrl}
            kind={type}
            spec={type === "image" ? IMAGE_SPECS.mediaLibrary : undefined}
          />
        </Field>
        <Field label="Alt mətn (təsvir)" info="3 dildə — SEO və əlçatanlıq üçün qısa təsvir">
          <LocalizedInput value={alt} onChange={setAlt} placeholder="Şəkli təsvir edən mətn" />
        </Field>
      </section>
    </Overlay>
  );
}
