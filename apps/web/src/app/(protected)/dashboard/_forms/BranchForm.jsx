"use client";

// ── Branch admin form ──
// Bespoke create/edit form covering the whole Branch model. Uses the shared
// form kit for layout so it stays consistent with the teacher/course forms.

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
import { IMAGE_SPECS } from "@/lib/imageSpecs";
import { SeoFields } from "./SeoFields";
import { LocalizedInput, toLoc, trimLoc, locAz, confirmLocalized } from "./Localized";

const emptyHour = { days: "", from: "", to: "" };

export function BranchForm({ item, onClose }) {
  const isEdit = Boolean(item?._id);

  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();

  const [name, setName] = useState(toLoc(item?.name));
  const [slug, setSlug] = useState(item?.slug || "");
  const [address, setAddress] = useState(toLoc(item?.address));
  const [district, setDistrict] = useState(toLoc(item?.district));
  const [metro, setMetro] = useState(toLoc(item?.metro));

  const [phone, setPhone] = useState(item?.phone || "");
  const [whatsapp, setWhatsapp] = useState(item?.whatsapp || "");
  const [email, setEmail] = useState(item?.email || "");

  const [workingHours, setWorkingHours] = useState(
    Array.isArray(item?.workingHours) && item.workingHours.length
      ? item.workingHours.map((h) => ({
          days: toLoc(h.days),
          from: h.from || "",
          to: h.to || "",
        }))
      : [],
  );

  const [lat, setLat] = useState(
    item?.coords?.lat != null ? String(item.coords.lat) : "",
  );
  const [lng, setLng] = useState(
    item?.coords?.lng != null ? String(item.coords.lng) : "",
  );
  const [mapEmbedUrl, setMapEmbedUrl] = useState(item?.mapEmbedUrl || "");

  const [images, setImages] = useState(
    Array.isArray(item?.images) && item.images.length ? [...item.images] : [],
  );

  const [seo, setSeo] = useState(item?.seo || {});

  const [isMain, setIsMain] = useState(Boolean(item?.isMain));
  const [order, setOrder] = useState(
    item?.order != null ? String(item.order) : "0",
  );
  const [isActive, setIsActive] = useState(
    isEdit ? Boolean(item?.isActive) : true,
  );

  const [error, setError] = useState("");

  // ── Working hours helpers ──
  const addHour = () => setWorkingHours((rows) => [...rows, { ...emptyHour }]);
  const removeHour = (i) =>
    setWorkingHours((rows) => rows.filter((_, idx) => idx !== i));
  const setHour = (i, key, val) =>
    setWorkingHours((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)),
    );

  // ── Image helpers ──
  const addImage = () => setImages((rows) => [...rows, ""]);
  const removeImage = (i) =>
    setImages((rows) => rows.filter((_, idx) => idx !== i));
  const setImage = (i, val) =>
    setImages((rows) => rows.map((r, idx) => (idx === i ? val : r)));

  const saving = creating || updating;

  const onSave = async () => {
    setError("");

    const guard = await confirmLocalized([
      { label: "Ad", value: name, required: true },
      { label: "Ünvan", value: address, required: true },
      { label: "Rayon", value: district },
    ]);
    if (!guard.ok) {
      if (guard.error) setError(guard.error);
      return;
    }

    const data = {
      name: trimLoc(name),
      address: trimLoc(address),
      district: trimLoc(district),
      metro: trimLoc(metro),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      mapEmbedUrl: mapEmbedUrl.trim(),
      isMain,
      order: Number(order) || 0,
      isActive,
      seo,
      // Prune blank rows.
      workingHours: workingHours
        .map((h) => ({
          days: trimLoc(h.days),
          from: h.from.trim(),
          to: h.to.trim(),
        }))
        .filter((h) => h.days || h.from || h.to),
      // Prune blank URLs.
      images: images.map((u) => u.trim()).filter(Boolean),
    };

    // Only send slug when set — server auto-generates from the name otherwise.
    if (slug.trim()) data.slug = slug.trim();

    // Omit coords entirely if both are empty; otherwise send parsed numbers.
    const latVal = lat.trim();
    const lngVal = lng.trim();
    if (latVal !== "" || lngVal !== "") {
      data.coords = {};
      if (latVal !== "") data.coords.lat = Number(latVal);
      if (lngVal !== "") data.coords.lng = Number(lngVal);
    }

    try {
      if (isEdit) {
        await update({ resource: "branches", id: item._id, data }).unwrap();
      } else {
        await create({ resource: "branches", data }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Xəta baş verdi");
    }
  };

  // ── Preview (as it will look on the site) ──
  const preview = (
    <div className="space-y-3">
      <div className="text-lg font-bold text-gray-900">
        {locAz(name).trim() || "Filial adı"}
        {isMain && (
          <span className="ml-2 rounded-full bg-blue-900 px-2 py-0.5 text-xs font-semibold text-white">
            Baş ofis
          </span>
        )}
      </div>
      {locAz(address).trim() && (
        <div className="text-sm text-gray-500">
          {locAz(address).trim()}
          {locAz(district).trim() ? ` · ${locAz(district).trim()}` : ""}
          {locAz(metro).trim() ? ` · ${locAz(metro).trim()} m.` : ""}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {phone.trim() && (
          <span className="rounded-lg bg-blue-900 px-3 py-1.5 text-sm font-semibold text-white">
            Zəng et
          </span>
        )}
        {whatsapp.trim() && (
          <span className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white">
            WhatsApp
          </span>
        )}
      </div>
    </div>
  );

  return (
    <Overlay
      localized
      title={isEdit ? "Filialı redaktə et" : "Yeni filial"}
      onClose={onClose}
      onSave={onSave}
      saving={saving}
      error={error}
      preview={preview}
      wide
    >
      {/* 1. Əsas */}
      <section className="space-y-4">
        <SectionTitle>Əsas</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Ad" required info="3 dildə — AZ mütləqdir">
            <LocalizedInput value={name} onChange={setName} />
          </Field>
          <Field label="Slug (linki)" info="Boş buraxsan addan avtomatik yaranır">
            <TextInput
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="nizami"
            />
          </Field>
          <Field label="Ünvan" required info="3 dildə — AZ mütləqdir">
            <LocalizedInput value={address} onChange={setAddress} />
          </Field>
          <Field label="Rayon" info="3 dildə">
            <LocalizedInput value={district} onChange={setDistrict} />
          </Field>
          <Field label="Metro" info="Ən yaxın metro stansiyası">
            <LocalizedInput value={metro} onChange={setMetro} />
          </Field>
        </div>
      </section>

      {/* 2. Əlaqə */}
      <section className="space-y-4">
        <SectionTitle>Əlaqə</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Telefon">
            <TextInput
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field
            label="WhatsApp"
            info="yalnız rəqəmlər, wa.me linki üçün"
            hint="yalnız rəqəmlər, məs. 994552124151"
          >
            <TextInput
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </Field>
          <Field label="E-poçt" className="sm:col-span-2">
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        </div>
      </section>

      {/* 3. İş saatları */}
      <section className="space-y-4">
        <SectionTitle right={<AddButton onClick={addHour}>Saat</AddButton>}>
          İş saatları
        </SectionTitle>
        {workingHours.length === 0 && (
          <p className="text-sm text-gray-400">Hələ saat əlavə edilməyib.</p>
        )}
        <div className="space-y-3">
          {workingHours.map((h, i) => (
            <div key={i} className="flex items-end gap-3">
              <Field label="Günlər" className="flex-1">
                <LocalizedInput
                  value={h.days}
                  placeholder="B.e–Cümə"
                  onChange={(v) => setHour(i, "days", v)}
                />
              </Field>
              <Field label="Başlanğıc" className="w-28">
                <TextInput
                  value={h.from}
                  placeholder="09:00"
                  onChange={(e) => setHour(i, "from", e.target.value)}
                />
              </Field>
              <Field label="Bitiş" className="w-28">
                <TextInput
                  value={h.to}
                  placeholder="21:00"
                  onChange={(e) => setHour(i, "to", e.target.value)}
                />
              </Field>
              <div className="pb-1">
                <RemoveButton onClick={() => removeHour(i)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Xəritə/koordinat */}
      <section className="space-y-4">
        <SectionTitle>Xəritə/koordinat</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Enlik (lat)">
            <NumberInput
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </Field>
          <Field label="Uzunluq (lng)">
            <NumberInput
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </Field>
          <Field
            label="Xəritə embed URL"
            info="Google Maps → Paylaş → Xəritəni yerləşdir (iframe src)"
            className="sm:col-span-2"
          >
            <TextArea
              rows={3}
              value={mapEmbedUrl}
              onChange={(e) => setMapEmbedUrl(e.target.value)}
            />
          </Field>
        </div>
      </section>

      {/* 5. Şəkillər */}
      <section className="space-y-4">
        <SectionTitle right={<AddButton onClick={addImage}>Şəkil</AddButton>}>
          Şəkillər
        </SectionTitle>
        {images.length === 0 && (
          <p className="text-sm text-gray-400">Hələ şəkil əlavə edilməyib.</p>
        )}
        <div className="space-y-3">
          {images.map((url, i) => (
            <div key={i} className="flex items-end gap-3">
              <Field label={`Şəkil ${i + 1}`} className="flex-1">
                <FileUpload
                  value={url}
                  onChange={(u) => setImage(i, u)}
                  kind="image"
                  spec={IMAGE_SPECS.branchImage}
                />
              </Field>
              <div className="pb-1">
                <RemoveButton onClick={() => removeImage(i)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. SEO */}
      <SeoFields value={seo} onChange={setSeo} />

      {/* 7. Parametrlər */}
      <section className="space-y-4">
        <SectionTitle>Parametrlər</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center">
            <Toggle checked={isMain} onChange={setIsMain} label="Baş ofis" />
          </div>
          <Field label="Sıra" info="Kiçik rəqəm əvvəl göstərilir">
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
