"use client";

// ── Tək mesaj modalı ──

import { useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { input, label } from "./shared";

export function SendModal({ onClose, onSend, sending }) {
  const [form, setForm] = useState({ phone: "", message: "" });

  const submit = async (e) => {
    e.preventDefault();
    const ok = await onSend(form);
    if (ok) setForm({ phone: "", message: "" });
  };

  return (
    <div
      className="ba-fade fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ba-pop flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">Yeni mesaj</h2>
          <button onClick={onClose} className="text-gray-400 transition hover:text-gray-700" aria-label="Bağla">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6">
          <label className="block">
            <span className={label}>Telefon nömrəsi <span className="text-red-500">*</span></span>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, "") })}
              placeholder="994501234567 və ya 0501234567"
              maxLength={12}
              className={`${input} font-mono`}
            />
          </label>

          <label className="block">
            <span className={label}>Mesaj <span className="text-red-500">*</span></span>
            <textarea
              required
              rows={6}
              maxLength={1000}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Göndərmək istədiyiniz mesajı yazın…"
              className={`${input} resize-none`}
            />
            <span className="mt-1 block text-right text-xs text-gray-400">
              {form.message.length} / 1000
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              İmtina
            </button>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Göndərilir…" : "Göndər"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
