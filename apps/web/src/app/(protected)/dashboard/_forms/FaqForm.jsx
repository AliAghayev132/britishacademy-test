"use client";

// ── FAQ admin form ──
// Bespoke create/edit form for a site-wide FAQ (resource "faqs"). Uses the
// shared form kit so it stays consistent with the other admin forms.

import { useState } from "react";
import {
  Overlay,
  Field,
  TextInput,
  NumberInput,
  TextArea,
  Toggle,
  SectionTitle,
} from "./kit";
import {
  useAdminCreateMutation,
  useAdminUpdateMutation,
} from "@/store/api/adminApi";

export function FaqForm({ item, onClose }) {
  const isEdit = Boolean(item?._id);

  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();

  const [question, setQuestion] = useState(item?.question || "");
  const [answer, setAnswer] = useState(item?.answer || "");
  const [group, setGroup] = useState(item?.group || "");
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
    if (!question.trim()) return setError("Sual tələb olunur");
    if (!answer.trim()) return setError("Cavab tələb olunur");

    const data = {
      question: question.trim(),
      answer: answer.trim(),
      order: Number(order) || 0,
      isActive,
    };
    // Prune empty optional group.
    const groupVal = group.trim();
    if (groupVal) data.group = groupVal;

    try {
      if (isEdit) {
        await update({ resource: "faqs", id: item._id, data }).unwrap();
      } else {
        await create({ resource: "faqs", data }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Xəta baş verdi");
    }
  };

  // Live preview: an open Q/A accordion row.
  const preview = (
    <div className="mx-auto max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-sm font-bold text-gray-900">
          {question || "Sualınız buraya yazılır?"}
        </span>
        <span className="text-gray-400">−</span>
      </div>
      <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
        {answer || "Cavab mətni buraya yazılır."}
      </div>
    </div>
  );

  return (
    <Overlay
      title={isEdit ? "Sualı redaktə et" : "Yeni sual"}
      onClose={onClose}
      onSave={onSave}
      saving={saving}
      error={error}
      preview={preview}
    >
      <section className="space-y-4">
        <SectionTitle>Məzmun</SectionTitle>
        <Field label="Sual" required>
          <TextInput
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </Field>
        <Field label="Cavab" required>
          <TextArea
            rows={4}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <SectionTitle>Parametrlər</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Qrup"
            info="Sualları qruplaşdırmaq üçün, məs. Qeydiyyat, Ödəniş (istəyə bağlı)"
          >
            <TextInput
              value={group}
              placeholder="Qeydiyyat"
              onChange={(e) => setGroup(e.target.value)}
            />
          </Field>
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
