"use client";

// ── Partner admin form ──
// Bespoke create/edit form for corporate partner logos in the
// "Tərəfdaşlarımız" strip. Media uses FileUpload (never raw URL inputs).

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
  Toggle,
  SectionTitle,
} from "./kit";
import { FileUpload } from "@/components/ui/FileUpload";
// Utils
import { getImageUrl } from "@/utils/getImageUrl";

export function PartnerForm({ item, onClose }) {
  const isEdit = Boolean(item?._id);

  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();

  const [name, setName] = useState(item?.name || "");
  const [logo, setLogo] = useState(item?.logo || "");
  const [url, setUrl] = useState(item?.url || "");
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
      logo: logo.trim(),
      order: Number(order) || 0,
      isActive,
    };

    // Prune empty optional url.
    const urlVal = url.trim();
    if (urlVal) data.url = urlVal;

    try {
      if (isEdit) {
        await update({ resource: "partners", id: item._id, data }).unwrap();
      } else {
        await create({ resource: "partners", data }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Xəta baş verdi");
    }
  };

  // Live preview chip shown via Overlay's "Test kimi göstər" toggle.
  const preview = (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getImageUrl(logo)}
          alt={name || "Partner"}
          className="h-12 w-12 rounded object-contain"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
          logo
        </div>
      )}
      <span className="text-sm font-semibold text-gray-800">
        {name || "Partnyor adı"}
      </span>
    </div>
  );

  return (
    <Overlay
      title={isEdit ? "Partnyoru redaktə et" : "Yeni partnyor"}
      onClose={onClose}
      onSave={onSave}
      saving={saving}
      error={error}
      preview={preview}
    >
      <section className="space-y-4">
        <SectionTitle>Əsas</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Ad" required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Sayt (url)" info="Loqoya klikləyəndə açılan ünvan">
            <TextInput
              value={url}
              placeholder="https://…"
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>
          <Field label="Loqo" className="sm:col-span-2">
            <FileUpload value={logo} onChange={setLogo} kind="image" />
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
