"use client";

// ── İki mərhələli göndəriş təsdiqi ──
//
// Toplu göndəriş geri qaytarıla bilməyən əməliyyatdır: minlərlə mesaj gedir,
// WhatsApp nömrəni bloklaya bilər, e-poçt spam siyahısına düşə bilər. Ona görə
// adi «Bəli/Xeyr» dialoqu kifayət etmir.
//
// Addım 1 — XÜLASƏ: kanal, alıcı sayı, etibarsız sətirlər, mesajın önizləməsi
//           və ilk 10 alıcı göstərilir (server `preview` cavabından).
// Addım 2 — YAZILI TƏSDİQ: istifadəçi alıcı sayını əl ilə yazmalıdır.
//           Rəqəm uyğun gəlmirsə düymə açılmır — «Enter-Enter» ilə səhvən
//           göndərmək mümkün deyil.
//
// Serverdə üçüncü qapı var: `confirm: true` olmayan sorğu rədd edilir.

import { useState } from "react";
import { AlertTriangle, Loader2, Send, X, ArrowRight, Timer } from "lucide-react";
import { fmtDuration } from "./shared";

export function ConfirmSend({ preview, channel, template, subject, onCancel, onConfirm, sending }) {
  const [step, setStep] = useState(1);
  const [typed, setTyped] = useState("");

  const total = preview?.total || 0;
  const isEmail = channel === "email";
  const channelLabel = isEmail ? "E-poçt" : "WhatsApp";
  const matches = typed.trim() === String(total);

  return (
    <div className="ba-fade fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="ba-pop flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Başlıq */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Təsdiq {step}/2
          </h2>
          <button onClick={onCancel} className="text-gray-400 transition hover:text-gray-700" aria-label="Bağla">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-auto p-6">
          {step === 1 ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Kanal" value={channelLabel} />
                <Stat label="Alıcı" value={total} accent />
                <Stat label="Ötürülən" value={preview?.invalidCount || 0} />
              </div>

              {/* Müddət: 500 alıcı × 6 saniyə = 50 dəqiqə. Admin bunu
                  BAŞLAMAZDAN əvvəl bilməlidir — göndəriş dayandırılana və ya
                  bitənə qədər ikincisi başlaya bilmir. */}
              {preview?.delaySec > 0 && (
                <p className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
                  <Timer className="h-4 w-4 flex-none" />
                  <span>
                    Fasilə <b>{preview.delaySec} san</b> — göndəriş təxminən{" "}
                    <b>{fmtDuration(preview.etaSec)}</b> çəkəcək.
                  </span>
                </p>
              )}

              {preview?.duplicates > 0 && (
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  {preview.duplicates} təkrar alıcı siyahıdan çıxarıldı.
                </p>
              )}

              {preview?.invalidCount > 0 && (
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  <p className="font-semibold">{preview.invalidCount} sətir göndərilməyəcək:</p>
                  <ul className="mt-1 max-h-28 space-y-0.5 overflow-auto text-xs">
                    {preview.invalid?.slice(0, 20).map((x, i) => (
                      <li key={i}>
                        <span className="font-mono">{x.input || "(boş)"}</span> — {x.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {preview?.sample?.length > 0 && (
                <div>
                  <div className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                    İlk alıcılar
                  </div>
                  <div className="max-h-32 overflow-auto rounded-lg border border-gray-100">
                    {preview.sample.map((r, i) => (
                      <div key={i} className="flex justify-between gap-3 border-b border-gray-50 px-3 py-1.5 text-sm last:border-0">
                        <span className="truncate text-gray-700">{r.name || "—"}</span>
                        <span className="font-mono text-gray-500">{r.to}</span>
                      </div>
                    ))}
                    {total > preview.sample.length && (
                      <div className="px-3 py-1.5 text-xs text-gray-400">
                        …və daha {total - preview.sample.length} alıcı
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Göndəriləcək mesaj
                </div>
                {isEmail && subject && (
                  <p className="mb-1 text-sm font-semibold text-gray-900">Mövzu: {subject}</p>
                )}
                <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  {template}
                </pre>
                <p className="mt-1 text-xs text-gray-400">
                  {"{{ad}}"} kimi dəyişənlər hər alıcı üçün ayrıca doldurulacaq.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                <p className="font-semibold">Bu əməliyyat geri qaytarıla bilməz.</p>
                <p className="mt-1">
                  {total} alıcıya <b>{channelLabel}</b> mesajı göndəriləcək.
                  {!isEmail && " Kütləvi göndəriş WhatsApp nömrənizin bloklanma riskini artırır."}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Təsdiq üçün alıcı sayını yazın: <b className="font-mono">{total}</b>
                </label>
                <input
                  autoFocus
                  value={typed}
                  onChange={(e) => setTyped(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={String(total)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-mono text-lg outline-none focus:border-blue-500"
                />
                {typed && !matches && (
                  <p className="mt-1 text-xs font-medium text-red-600">Rəqəm uyğun gəlmir.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Alt panel */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={step === 1 ? onCancel : () => setStep(1)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            {step === 1 ? "İmtina" : "Geri"}
          </button>

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!total}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              Davam et <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onConfirm}
              disabled={!matches || sending}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Başladılır…" : `${total} alıcıya göndər`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-center">
      <div className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-0.5 text-lg font-bold ${accent ? "text-blue-900" : "text-gray-900"}`}>
        {value}
      </div>
    </div>
  );
}
