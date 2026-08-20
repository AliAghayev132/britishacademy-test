"use client";

// ── Qoşulma tabı ──
// Üç vəziyyət: qoşulub · QR/kod gözlənilir · qoşulmayıb (başlatma formaları).

import { useState } from "react";
import { MessageSquare, Loader2, Smartphone, KeyRound } from "lucide-react";
import { input, label, fmt } from "./shared";

function InfoCard({ title, value, mono }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
      <div className="text-xs font-bold uppercase tracking-wide text-gray-500">{title}</div>
      <div className={`mt-1 text-sm font-semibold text-gray-900 ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </div>
    </div>
  );
}

export function ConnectTab({ status, onInit, initing }) {
  const [pairPhone, setPairPhone] = useState("");
  const { isReady, isInitializing, qrDataUrl, pairingCode, hasSession } = status;
  const busy = initing || isInitializing;

  // ── Qoşulub ──
  if (isReady) {
    return (
      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-3">
        <InfoCard title="Hesab" value={status.connectedAs} />
        <InfoCard title="Nömrə" value={status.phoneNumber ? `+${status.phoneNumber}` : null} mono />
        <InfoCard title="Qoşulub" value={fmt(status.readyAt)} />
      </div>
    );
  }

  // ── Qoşulma gözlənilir (QR və ya kod) ──
  if (qrDataUrl || pairingCode) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-700">
          {pairingCode ? <KeyRound className="h-6 w-6" /> : <Smartphone className="h-6 w-6" />}
        </div>

        {pairingCode ? (
          <>
            <h3 className="text-base font-bold text-gray-900">Qoşulma kodu</h3>
            <p className="mt-1 max-w-md text-center text-sm text-gray-600">
              Telefonda <b>WhatsApp → Linked devices → Link with phone number</b> seçin
              və bu kodu daxil edin:
            </p>
            <div className="ba-pop mt-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50 px-5 py-4 font-mono text-xl font-bold tracking-[0.25em] text-emerald-700 sm:px-8 sm:py-5 sm:text-3xl sm:tracking-[0.3em]">
              {pairingCode}
            </div>
          </>
        ) : (
          <>
            <h3 className="text-base font-bold text-gray-900">QR kodu skan edin</h3>
            <p className="mt-1 max-w-md text-center text-sm text-gray-600">
              Telefonda <b>WhatsApp → Linked devices → Link a device</b>.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="WhatsApp QR kodu"
              /* Kiçik ekranda 288px + padding daşırdı — mobil üçün kiçildilir. */
              className="ba-pop mt-5 h-56 w-56 rounded-2xl border-4 border-emerald-500 bg-white p-2 sm:h-72 sm:w-72 sm:p-3"
            />
          </>
        )}
      </div>
    );
  }

  // ── Qoşulmayıb ──
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <p className="text-sm text-gray-600">
        {hasSession
          ? "Saxlanmış sessiya var — «Qoşul» düyməsi QR olmadan bərpa edəcək."
          : "Qoşulmaq üçün iki üsul var: QR kodu skan edin, ya da telefon nömrəsi ilə qoşulma kodu alın."}
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <button
          onClick={() => onInit({})}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
          {hasSession ? "Qoşul" : "QR ilə qoşul"}
        </button>

        <div className="flex items-end gap-2">
          <div>
            <label className={label}>və ya nömrə ilə kod al</label>
            <input
              value={pairPhone}
              onChange={(e) => setPairPhone(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="994501234567"
              maxLength={12}
              className={`${input} w-44 font-mono sm:w-48`}
            />
          </div>
          <button
            onClick={() => onInit({ pairPhone })}
            disabled={busy || pairPhone.length < 9}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" /> Kod al
          </button>
        </div>
      </div>

      <ul className="mt-6 space-y-1.5 text-sm text-gray-500">
        <li>• Server yenidən başlayanda sessiya varsa <b>avtomatik qoşulur</b> — QR lazım olmur.</li>
        <li>• Hər dəqiqə vəziyyət yoxlanılır, bağlantı düşsə özü bərpa edir.</li>
        <li>• «Bağla» sessiyanı saxlayır, «Sessiyanı sil» tam çıxışdır.</li>
      </ul>
    </div>
  );
}
