"use client";

// React
import { useState } from "react";

// Components
import { confirmDialog, notify } from "@/components";

// Store
import { useAdminCreateMutation, useAdminUpdateMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import { editableDoc } from "./helpers";

/**
 * MVP redaktor: sənəd JSON kimi redaktə olunur. Hər açılışda yenidən mount
 * olur, ona görə mətn vəziyyəti ilkin dəyərdən qurulur.
 */
export default function JsonEditorModal({ resource, item, title, onClose }) {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(editableDoc(item), null, 2));
  const [jsonError, setJsonError] = useState("");
  const [jsonDirty, setJsonDirty] = useState(false);
  const [createItem] = useAdminCreateMutation();
  const [updateItem] = useAdminUpdateMutation();

  // JSON redaktorunu bağla — dəyişiklik varsa təsdiq istə.
  const closeJsonEditor = async () => {
    if (jsonDirty) {
      const ok = await confirmDialog({
        tone: "warning",
        title: "Çıxılsın?",
        text: "Yadda saxlanılmamış dəyişikliklər var — çıxsanız itəcək.",
        confirmText: "Bəli, çıx",
        cancelText: "Ləğv et",
      });
      if (!ok) return;
    }
    onClose();
  };

  const save = async () => {
    let body;
    try {
      body = JSON.parse(jsonText);
      setJsonError("");
    } catch (e) {
      setJsonError("JSON düzgün deyil: " + e.message);
      return;
    }
    try {
      if (item?._id) {
        await updateItem({ resource, id: item._id, data: body }).unwrap();
      } else {
        await createItem({ resource, data: body }).unwrap();
      }
      onClose();
      notify.success("Yadda saxlanıldı");
    } catch (err) {
      notify.error(apiErrorMessage(err, "Yadda saxlanmadı"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && closeJsonEditor()}>
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">{item?._id ? "Redaktə et" : "Yeni element"} — {title}</h2>
          <button onClick={closeJsonEditor} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <p className="mb-3 text-xs text-gray-500">
            Sənəd JSON formatında redaktə olunur. Sahə adları üçün mövcud elementlərə bax.
          </p>
          <textarea
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setJsonDirty(true); }}
            spellCheck={false}
            className="h-96 w-full rounded-lg border border-gray-200 p-3 font-mono text-xs outline-none focus:border-blue-500"
          />
          {jsonError && <div className="mt-2 text-sm font-semibold text-red-600">{jsonError}</div>}
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={closeJsonEditor} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">İmtina</button>
          <button onClick={save} className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800">Yadda saxla</button>
        </div>
      </div>
    </div>
  );
}
