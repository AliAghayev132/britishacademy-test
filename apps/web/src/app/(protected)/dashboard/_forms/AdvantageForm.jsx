"use client";

// ── Advantage admin form ──
// Bespoke create/edit form for an "Üstünlüklərimiz" card (resource "advantages").
// Uses the shared form kit so it stays consistent with the other admin forms.

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
} from "./kit";
import { LocalizedInput, toLoc, trimLoc, locAz, confirmLocalized } from "./Localized";

export function AdvantageForm({ item, onClose }) {
  const isEdit = Boolean(item?._id);

  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();

  const [title, setTitle] = useState(toLoc(item?.title));
  const [text, setText] = useState(toLoc(item?.text));
  const [color, setColor] = useState(item?.color || "#7C4DFF");
  const [icon, setIcon] = useState(item?.icon || "");
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

    const guard = await confirmLocalized([
      { label: "Başlıq", value: title, required: true },
      { label: "Mətn", value: text },
    ]);
    if (!guard.ok) {
      if (guard.error) setError(guard.error);
      return;
    }

    const data = {
      title: trimLoc(title),
      text: trimLoc(text),
      color: color.trim() || "#7C4DFF",
      order: Number(order) || 0,
      isActive,
    };
    const iconVal = icon.trim();
    if (iconVal) data.icon = iconVal;

    try {
      if (isEdit) {
        await update({ resource: "advantages", id: item._id, data }).unwrap();
      } else {
        await create({ resource: "advantages", data }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Xəta baş verdi");
    }
  };

  // Live preview: the advantage card as it renders on the homepage.
  const preview = (
    <div className="mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
        style={{ backgroundColor: `${color}1a`, color }}
      >
        {icon || "★"}
      </div>
      <h4 className="text-base font-bold text-gray-900">
        {locAz(title) || "Üstünlük başlığı"}
      </h4>
      {locAz(text) && <p className="mt-2 text-sm text-gray-600">{locAz(text)}</p>}
    </div>
  );

  return (
    <Overlay
      localized
      title={isEdit ? "Üstünlüyü redaktə et" : "Yeni üstünlük"}
      onClose={onClose}
      onSave={onSave}
      saving={saving}
      error={error}
      preview={preview}
    >
      <section className="space-y-4">
        <SectionTitle>Məzmun</SectionTitle>
        <Field label="Başlıq" required info="3 dildə — AZ mütləqdir">
          <LocalizedInput value={title} onChange={setTitle} />
        </Field>
        <Field label="Mətn" info="3 dildə">
          <LocalizedInput value={text} onChange={setText} multiline rows={3} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="İkon"
            info="Emoji və ya ikon adı, məs. 🎓 (istəyə bağlı)"
          >
            <TextInput
              value={icon}
              placeholder="🎓"
              onChange={(e) => setIcon(e.target.value)}
            />
          </Field>
          <Field label="Rəng" info="Kartın vurğu rəngi">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-lg border border-gray-300"
              />
              <TextInput
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>Parametrlər</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Sıra" info="Kiçik rəqəm əvvəldə göstərilir">
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
