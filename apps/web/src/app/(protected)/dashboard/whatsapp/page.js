"use client";

// ── WhatsApp ──
// whatsapp-web.js (1.34.x) ilə QR / qoşulma kodu üzərindən bağlanma, tək və
// toplu mesaj göndərişi, göndəriş tarixçəsi.
//
// Bu fayl yalnız ORKESTRATORDUR: status, tab seçimi və mutasiyalar. Hər tabın
// və bölmənin öz UI-ı `_components/` altındadır (əvvəl hamısı 578 sətirlik tək fayl idi).
//
// QR şəkli SERVERDƏ generasiya olunur (data URL) — kənar QR servisinə
// göndərmirik, çünki QR sessiya qoşulma məlumatı daşıyır.

// React
import { useState } from "react";

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
import { SendModal } from "./_components/SendModal";
import { PageHeader } from "./_components/PageHeader";
import { StatusBar } from "./_components/StatusBar";
import { UpdateNotice } from "./_components/UpdateNotice";
import { DiagnosticsPanel } from "./_components/DiagnosticsPanel";
import { InstallNotice } from "./_components/InstallNotice";
import { TabNav } from "./_components/TabNav";
import { useBulkQueue } from "./_components/useBulkQueue";

export default function WhatsAppPage() {
  const [tab, setTab] = useState("connect");
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

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        isReady={isReady}
        installed={installed}
        onRefresh={() => refetch()}
        onNewMessage={() => setModal(true)}
        onDisconnect={() => run(disconnect, undefined, "Bağlandı")}
        disconnecting={disconnecting}
        onLogout={() => run(logout, undefined, "Sessiya silindi")}
        loggingOut={loggingOut}
      />

      <StatusBar status={s} isLoading={isLoading} />

      <UpdateNotice version={s.version} />

      {installed && (
        <DiagnosticsPanel
          status={s}
          onCheckVersion={() => run(checkVersion, undefined, "Yoxlanıldı")}
          checkingVersion={checkingVersion}
        />
      )}

      {/* Status sorğusu uğursuzdursa — səbəb + yenidən cəhd */}
      {isError && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <QueryState isError error={error} onRetry={refetch} />
        </div>
      )}

      {lastError && !isReady && !isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {lastError}
        </div>
      )}

      {!installed ? (
        <InstallNotice />
      ) : (
        <>
          <TabNav value={tab} onChange={setTab} />

          <div key={tab} className="ba-fade">
            {tab === "connect" && (
              <ConnectTab
                status={s}
                initing={initing}
                onInit={(arg) => run(init, arg, arg?.pairPhone ? "Kod hazırlanır…" : "Başladılır…")}
              />
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
          </div>
        </>
      )}

      {modal && <SendModal onClose={() => setModal(false)} onSend={onSend} sending={sending} />}
    </div>
  );
}
