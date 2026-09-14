"use client";

// ── Mesaj mərkəzi ──
// WhatsApp bağlantısı (whatsapp-web.js — QR və ya qoşulma kodu), tək və toplu
// göndəriş (WhatsApp + e-poçt), tarixçə, bağlantı jurnalı və diaqnostika.
//
// Bu fayl yalnız ORKESTRATORDUR: status, tab seçimi və mutasiyalar. Hər tabın
// öz UI-ı `_components/` altındadır.
//
// Səhifə əvvəl «WhatsApp» adlanırdı (/dashboard/whatsapp) — toplu göndəriş
// e-poçtla da getdiyi üçün ad çaşdırırdı. Köhnə ünvan next.config-də bura
// yönləndirilir.
//
// QR şəkli SERVERDƏ generasiya olunur (data URL) — kənar QR servisinə
// göndərmirik, çünki QR sessiya qoşulma məlumatı daşıyır.

// React
import { useState } from "react";

// Next
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Components
import { notify, QueryState } from "@/components";

// Store
import {
  useWhatsappStatusQuery,
  useWhatsappInitMutation,
  useWhatsappSendMutation,
  useWhatsappDisconnectMutation,
  useWhatsappLogoutMutation,
  useBulkCancelMutation,
  useWhatsappCheckVersionMutation,
} from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import { ConnectTab } from "./_components/ConnectTab";
import { BulkTab } from "./_components/BulkTab";
import { HistoryTab } from "./_components/HistoryTab";
import { LogsTab } from "./_components/LogsTab";
import { DiagnosticsTab } from "./_components/DiagnosticsTab";
import { SendModal } from "./_components/SendModal";
import { PageHeader } from "./_components/PageHeader";
import { InstallNotice } from "./_components/InstallNotice";
import { TabNav, TABS } from "./_components/TabNav";
import { useBulkQueue } from "./_components/useBulkQueue";

export default function MessagesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Seçilmiş tab ünvandadır (?tab=bulk) — səhifə yenilənəndə və link
  // paylaşılanda eyni tab açılır.
  const requested = searchParams.get("tab");
  const [modal, setModal] = useState(false);
  const [page, setPage] = useState(1);

  // Aktiv iş varsa 3 saniyədən bir, sakit vəziyyətdə seyrək yoxlanılır.
  const [poll, setPoll] = useState(3000);
  const { data, isLoading, isError, error, refetch } = useWhatsappStatusQuery(undefined, {
    pollingInterval: poll,
    skipPollingIfUnfocused: true,
  });

  const [init, { isLoading: initing }] = useWhatsappInitMutation();
  const [send, { isLoading: sending }] = useWhatsappSendMutation();
  const [cancelBulk] = useBulkCancelMutation();
  const [checkVersion, { isLoading: checkingVersion }] = useWhatsappCheckVersionMutation();
  const [disconnect, { isLoading: disconnecting }] = useWhatsappDisconnectMutation();
  const [logout, { isLoading: loggingOut }] = useWhatsappLogoutMutation();

  const s = data?.data || {};
  const { installed = true, isReady, lastError } = s;

  // Toplu göndərişin canlı vəziyyəti (socket + sorğu) — bax useBulkQueue.
  const { queue, live } = useBulkQueue();

  const wantedPoll = isReady && !queue.running ? 15000 : 3000;
  if (wantedPoll !== poll) setPoll(wantedPoll);

  // Ünvanda tab yoxdursa: qoşulubsa göndəriş, qoşulmayıbsa bağlantı.
  // Status gələnə qədər tab seçilmir — əks halda «Bağlantı» bir anlıq açılıb
  // «Toplu göndəriş»ə sıçrayırdı.
  const tab = TABS.some((t) => t.id === requested) ? requested : isLoading ? null : isReady ? "bulk" : "connect";
  const setTab = (id) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", id);
    router.replace(`${pathname}?${params}`, { scroll: false });
  };

  /** Mutasiya işlədici — uğur/xəta toast-u ilə. */
  const run = async (fn, arg, okMsg) => {
    try {
      const res = await fn(arg).unwrap();
      notify.success(res?.message || okMsg);
      return true;
    } catch (err) {
      notify.error(apiErrorMessage(err, "Xəta baş verdi"));
      return false;
    }
  };

  const onSend = async (form) => {
    const ok = await run(send, form, "Mesaj göndərildi");
    if (ok) setModal(false);
    return ok;
  };

  const errors24h = s.logSummary?.errors || 0;
  const badges = {
    ...(queue.running ? { bulk: { text: "gedir", tone: "live" } } : {}),
    ...(errors24h
      ? { diagnostics: { text: errors24h, tone: "error" } }
      : s.version?.outdated
        ? { diagnostics: { text: "yeniləmə", tone: "warn" } }
        : {}),
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        status={s}
        isLoading={isLoading}
        onRefresh={() => refetch()}
        onNewMessage={() => setModal(true)}
        onDisconnect={() => run(disconnect, undefined, "Bağlandı")}
        disconnecting={disconnecting}
        onLogout={() => run(logout, undefined, "Sessiya silindi")}
        loggingOut={loggingOut}
      />

      {/* Status sorğusu uğursuzdursa — səbəb + yenidən cəhd */}
      {isError && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <QueryState isError error={error} onRetry={refetch} />
        </div>
      )}

      {!installed ? (
        <InstallNotice />
      ) : (
        <>
          <TabNav value={tab} onChange={setTab} badges={badges} />

          {tab && <div key={tab} role="tabpanel" aria-labelledby={`msg-tab-${tab}`} className="ba-fade">
            {tab === "connect" && (
              <div className="space-y-4">
                {lastError && !isReady && !isError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {lastError}
                  </div>
                )}
                <ConnectTab
                  status={s}
                  initing={initing}
                  onInit={(arg) => run(init, arg, arg?.pairPhone ? "Kod hazırlanır…" : "Başladılır…")}
                />
              </div>
            )}
            {tab === "bulk" && (
              <BulkTab
                queue={queue}
                isReady={isReady}
                live={live}
                onCancel={() => run(cancelBulk, undefined, "Dayandırılır…")}
              />
            )}
            {tab === "history" && <HistoryTab page={page} onPage={setPage} />}
            {tab === "logs" && <LogsTab />}
            {tab === "diagnostics" && (
              <DiagnosticsTab
                status={s}
                onCheckVersion={() => run(checkVersion, undefined, "Yoxlanıldı")}
                checkingVersion={checkingVersion}
              />
            )}
          </div>}
        </>
      )}

      {modal && <SendModal onClose={() => setModal(false)} onSend={onSend} sending={sending} />}
    </div>
  );
}
