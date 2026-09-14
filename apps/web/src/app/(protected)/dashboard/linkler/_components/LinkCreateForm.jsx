"use client";

// React
import { useState } from "react";

// Icons
import { Link2, Plus } from "lucide-react";

// Components
import { notify } from "@/components";

// Store
import { useAdminCreateMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import { SITE_URL, slugify } from "./linkUrl";

const input =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#00157A] focus:ring-2 focus:ring-[#00157A]/10";

/** Yeni izlənilən link formu. */
export default function LinkCreateForm() {
  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [form, setForm] = useState({ code: "", target: "", title: "", note: "" });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const code = slugify(form.code);
    if (!code) {
      notify.error("Kod boş ola bilməz");
      return;
    }
    if (!form.target.trim()) {
      notify.error("Hədəf ünvan boş ola bilməz");
      return;
    }
    try {
      await create({ resource: "short-links", data: { ...form, code } }).unwrap();
      notify.success("Link yaradıldı");
      setForm({ code: "", target: "", title: "", note: "" });
    } catch (err) {
      // Kod təkrarlanırsa Mongo unikal indeks səhvi qaytarır — anlaşılan mesaja çevir.
      const msg = apiErrorMessage(err, "");
      notify.error(/duplicate|E11000/i.test(msg) ? "Bu kod artıq işlənir" : msg || "Yaradıla bilmədi");
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-6">
      <h1 className="flex items-center gap-2 text-base font-bold text-gray-900">
        <Link2 className="h-5 w-5 text-gray-400" />
        Yeni izlənilən link
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Reklam kanalı üçün ayrıca link yarat — klikləri buradan detallı izləyəcəksən.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            Kod
          </label>
          <div className="flex items-center gap-2">
            <span className="flex-none font-mono text-xs text-gray-400">{SITE_URL}/r/</span>
            <input
              className={input}
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder="ig-sentyabr"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">Yalnız kiçik hərf, rəqəm və tire.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            Hədəf ünvan
          </label>
          <input
            className={input}
            value={form.target}
            onChange={(e) => set("target", e.target.value)}
            placeholder="/kurslar/ielts-kurslari"
          />
          <p className="mt-1 text-xs text-gray-400">
            Saytdaxili ünvan (“/” ilə) və ya tam https:// linki.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            Kampaniyanın adı
          </label>
          <input
            className={input}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Instagram — sentyabr endirimi"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            Qeyd
          </label>
          <input
            className={input}
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder="Büdcə 200 AZN, 10–20 sentyabr"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={creating}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#00157A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#001a99] disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
        {creating ? "Yaradılır…" : "Link yarat"}
      </button>
    </form>
  );
}
