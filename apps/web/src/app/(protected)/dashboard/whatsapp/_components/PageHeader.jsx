"use client";

// Icons
import { Send, RefreshCw, LogOut, PowerOff } from "lucide-react";

// Components
import { confirmDialog } from "@/components";

/** Başlıq + əməliyyatlar (yenilə, yeni mesaj, bağla, sessiyanı sil). */
export function PageHeader({
  isReady,
  installed,
  onRefresh,
  onNewMessage,
  onDisconnect,
  disconnecting,
  onLogout,
  loggingOut,
}) {
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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-lg font-bold text-gray-900">WhatsApp</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Nömrəni qoş və müraciət sahiblərinə birbaşa mesaj göndər.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" /> Yenilə
        </button>

        {isReady && (
          <>
            <button
              onClick={onNewMessage}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Send className="h-4 w-4" /> Yeni mesaj
            </button>
            <button
              onClick={onDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              title="Bağla (sessiya saxlanılır)"
            >
              <PowerOff className="h-4 w-4" /> Bağla
            </button>
          </>
        )}

        {installed && (
          <button
            onClick={confirmLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            title="Cihazı ayır + sessiyanı sil"
          >
            <LogOut className="h-4 w-4" /> Sessiyanı sil
          </button>
        )}
      </div>
    </div>
  );
}
