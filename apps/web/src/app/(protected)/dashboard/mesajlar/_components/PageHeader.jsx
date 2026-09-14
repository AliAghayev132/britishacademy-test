"use client";

// Icons
import { LogOut, MessagesSquare, PowerOff, RefreshCw, Send } from "lucide-react";

// Components
import { confirmDialog } from "@/components";

// Local
import { ConnectionBadge } from "./ConnectionBadge";

const btn =
  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-60";

/**
 * Başlıq kartı: ad, bağlantı nişanı və əsas əməliyyatlar.
 *
 * Səhifə əvvəl «WhatsApp» adlanırdı, halbuki toplu göndəriş e-poçtla da
 * gedir və tarixçə hər iki kanalı göstərir — ad adminləri çaşdırırdı.
 */
export function PageHeader({
  status,
  isLoading,
  onRefresh,
  onNewMessage,
  onDisconnect,
  disconnecting,
  onLogout,
  loggingOut,
}) {
  const { isReady, installed = true } = status;

  // Sessiyanı silmək geri dönməzdir (QR təzədən skan olunmalıdır) — təsdiqsiz getməsin.
  const confirmLogout = async () => {
    const ok = await confirmDialog({
      tone: "error",
      title: "Sessiya silinsin?",
      text: "Cihaz telefondan ayrılacaq və saxlanmış sessiya silinəcək — yenidən qoşulmaq üçün <b>QR kodu təzədən skan etmək</b> lazım olacaq.",
      confirmText: "Bəli, sil",
      cancelText: "İmtina",
    });
    if (ok) onLogout();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="hidden h-11 w-11 flex-none place-items-center rounded-xl bg-[#00157A] text-white sm:grid">
          <MessagesSquare className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* h2: saytın mobil CSS qaydası bütün h1-ləri 30–44px edir; səhifənin
                əsas başlığı onsuz da üst paneldədir. */}
            <h2 className="text-lg font-bold text-gray-900">Mesaj mərkəzi</h2>
            <ConnectionBadge status={status} isLoading={isLoading} />
          </div>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            WhatsApp və e-poçt ilə tək və toplu mesaj, göndəriş tarixçəsi.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {isReady && (
          <button onClick={onNewMessage} className={`${btn} bg-emerald-600 px-4 text-white hover:bg-emerald-700`}>
            <Send className="h-4 w-4" /> Yeni mesaj
          </button>
        )}
        <button onClick={onRefresh} className={`${btn} border border-gray-200 text-gray-700 hover:bg-gray-50`} title="Vəziyyəti yenilə">
          <RefreshCw className="h-4 w-4" /> Yenilə
        </button>
        {isReady && (
          <button
            onClick={onDisconnect}
            disabled={disconnecting}
            className={`${btn} border border-gray-200 text-gray-700 hover:bg-gray-50`}
            title="Bağla (sessiya saxlanılır)"
          >
            <PowerOff className="h-4 w-4" /> Bağla
          </button>
        )}
        {installed && (
          <button
            onClick={confirmLogout}
            disabled={loggingOut}
            className={`${btn} border border-red-200 text-red-600 hover:bg-red-50`}
            title="Cihazı ayır + sessiyanı sil"
          >
            <LogOut className="h-4 w-4" /> Sessiyanı sil
          </button>
        )}
      </div>
    </div>
  );
}
