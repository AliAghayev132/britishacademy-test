"use client";

// ── Qoşulma tabı ──
// Üç vəziyyət: qoşulub · QR/kod gözlənilir · qoşulmayıb (başlatma formaları).

// React
import { useState } from "react";

// Icons
import { MessageSquare, Loader2, Smartphone, KeyRound, Power, QrCode } from "lucide-react";

// Utils
import { fmtDateTime } from "@/utils";

// Local
import { input, label } from "./shared";

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

/**
 * İnteqrasiyanın açarı.
 *
 * Söndürüləndə server nə avtomatik bərpa edir, nə QR yaradır — Chromium
 * ümumiyyətlə açılmır. Əvvəl belə açar yox idi: heç kim skan etməsə də
 * whatsapp-web.js hər ~20 saniyədə yeni QR yayırdı, jurnal dolurdu və
 * paneldəki şəkil dayanmadan dəyişirdi.
 */
function AutoSwitch({ autoConnect, onSetAuto, busy }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 grid h-9 w-9 place-items-center rounded-lg ${autoConnect ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
          <Power className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-bold text-gray-900">WhatsApp inteqrasiyası</div>
          <p className="mt-0.5 max-w-lg text-xs text-gray-500">
            {autoConnect
              ? "Açıqdır — server sessiyanı özü bərpa edir və lazım olanda QR yaradır."
              : "Söndürülüb — QR yaradılmır, brauzer açılmır. Sessiya silinmir: açanda QR-siz bərpa olunur."}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={autoConnect}
        aria-label="WhatsApp inteqrasiyası"
        disabled={busy}
        onClick={() => onSetAuto(!autoConnect)}
        className={`relative h-7 w-12 flex-none rounded-full transition disabled:opacity-60 ${autoConnect ? "bg-emerald-500" : "bg-gray-300"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${autoConnect ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

export function ConnectTab({ status, onInit, initing, onSetAuto, settingAuto }) {
  const [pairPhone, setPairPhone] = useState("");
  const { isReady, isInitializing, qrDataUrl, pairingCode, hasSession, qrStopped } = status;
  const autoConnect = status.autoConnect !== false;
  const busy = initing || isInitializing;

  const withSwitch = (children) => (
    <div className="space-y-4">
      <AutoSwitch autoConnect={autoConnect} onSetAuto={onSetAuto} busy={settingAuto} />
      {children}
    </div>
  );

  // ── Söndürülüb ──
  if (!autoConnect) {
    return withSwitch(
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
        İnteqrasiya söndürülüb. Mesaj göndərilmir, QR yaradılmır və server
        brauzer saxlamır. Yenidən işə salmaq üçün yuxarıdakı açarı açın.
      </div>,
    );
  }

  // ── Qoşulub ──
  if (isReady) {
    return withSwitch(
      <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-3">
        <InfoCard title="Hesab" value={status.connectedAs} />
        <InfoCard title="Nömrə" value={status.phoneNumber ? `+${status.phoneNumber}` : null} mono />
        <InfoCard title="Qoşulub" value={fmtDateTime(status.readyAt, { seconds: true })} />
      </div>,
    );
  }

  // ── Qoşulma gözlənilir (QR və ya kod) ──
  if (qrDataUrl || pairingCode) {
    return withSwitch(
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
      </div>,
    );
  }

  // ── Qoşulmayıb ──
  return withSwitch(
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      {/* Hədd dolub gözləmə dayandırılıbsa səbəb görünsün — əks halda
          «QR hara getdi?» sualı yaranırdı. */}
      {qrStopped && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <QrCode className="mt-0.5 h-4 w-4 flex-none" />
          <span>QR skan edilmədi, gözləmə dayandırıldı. Yenidən cəhd üçün «Qoşul» basın.</span>
        </div>
      )}
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
        <li>• Skan edilməsə QR gözləməsi bir neçə dəqiqədən sonra öz-özünə dayanır.</li>
      </ul>
    </div>,
  );
}
