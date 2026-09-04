"use client";

// ── WhatsApp ──
// whatsapp-web.js (1.34.x) ilə QR / qoşulma kodu üzərindən bağlanma, tək və
// toplu mesaj göndərişi, göndəriş tarixçəsi.
//
// Bu fayl yalnız ORKESTRATORDUR: status, tab seçimi və mutasiyalar. Hər tabın
// öz UI-ı `_components/` altındadır (əvvəl hamısı 578 sətirlik tək fayl idi).
//
// QR şəkli SERVERDƏ generasiya olunur (data URL) — kənar QR servisinə
// göndərmirik, çünki QR sessiya qoşulma məlumatı daşıyır.

// React
import { useEffect, useRef, useState } from "react";
// UI
import { confirmDialog, notify } from "@/components/ui/feedback";
import { QueryState } from "@/components/ui/QueryState";
import {
  Send, RefreshCw, CheckCircle, XCircle, Loader2, AlertCircle,
  Smartphone, LogOut, PowerOff, Users, History,
} from "lucide-react";
// Data
import {
  useWhatsappStatusQuery,
  useWhatsappInitMutation,
  useWhatsappSendMutation,
  useWhatsappDisconnectMutation,
  useWhatsappLogoutMutation,
  useBulkStatusQuery,
  useBulkCancelMutation,
} from "@/store/api/adminApi";
// Real-time
import { useSocket } from "@/store/context/SocketContext";
// Local
import { ConnectTab } from "./_components/ConnectTab";
import { BulkTab } from "./_components/BulkTab";
import { HistoryTab } from "./_components/HistoryTab";
import { SendModal } from "./_components/SendModal";

const TABS = [
  { id: "connect", label: "Qoşulma", icon: Smartphone },
  { id: "bulk", label: "Toplu göndəriş", icon: Users },
  { id: "history", label: "Tarixçə", icon: History },
];

/** Status nişanı — vəziyyətə görə ikon + rəng. */
function StatusBadge({ isLoading, installed, isReady, isInitializing, waiting }) {
  if (isLoading) return <span className="text-sm text-gray-500">Yüklənir…</span>;
  const map = !installed
    ? [XCircle, "text-gray-400", "text-gray-500", "Quraşdırılmayıb", false]
    : isReady
      ? [CheckCircle, "text-emerald-500", "text-emerald-600", "Aktiv", false]
      : isInitializing
        ? [Loader2, "text-amber-500", "text-amber-600", "Başladılır…", true]
        : waiting
          ? [Loader2, "text-blue-500", "text-blue-600", "Qoşulma gözlənilir", true]
          : [XCircle, "text-red-500", "text-red-600", "Qeyri-aktiv", false];
  const [Icon, iconCls, textCls, text, spin] = map;
  return (
    <>
      <Icon className={`h-5 w-5 ${iconCls} ${spin ? "animate-spin" : ""}`} />
      <span className={`text-sm font-semibold ${textCls}`}>{text}</span>
    </>
  );
}

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
  const [disconnect, { isLoading: disconnecting }] = useWhatsappDisconnectMutation();
  const [logout, { isLoading: loggingOut }] = useWhatsappLogoutMutation();

  const s = data?.data || {};
  const { installed = true, isReady, isInitializing, qrDataUrl, pairingCode, lastError } = s;

  // ── Toplu göndəriş: canlı izləmə ──
  //
  // İKİ MƏNBƏ QƏSDƏNDİR. Socket hər mesajdan sonra hadisə göndərir (dərhal
  // görünür), sorğu isə ehtiyatdır: səhifə göndəriş ORTASINDA açılsa və ya
  // bağlantı qopsa, tam vəziyyət yenə də bərpa olunur. Socket işləyəndə
  // sorğunun tezliyi azalır — şəbəkəni lüzumsuz yükləməsin.
  const { socket, isConnected } = useSocket();
  const [liveQueue, setLiveQueue] = useState(null);
  const live = Boolean(socket && isConnected);

  const { data: bulkData } = useBulkStatusQuery(undefined, {
    pollingInterval: live ? 15000 : 3000,
    skipPollingIfUnfocused: true,
  });

  // Serverdən gələn tam vəziyyət əsasdır; socket yalnız aralıq yeniləmələri
  // gətirir, ona görə axın (feed) və həddlər sonuncu tam cavabdan saxlanılır.
  const base = bulkData?.data || {};
  const queue = liveQueue && liveQueue.startedAt === base.startedAt
    ? { ...base, ...liveQueue }
    : base;

  // Axın: hansı göndərişə aid olduğu ilə birlikdə saxlanılır.
  const feedRef = useRef({ startedAt: null, rows: [] });

  // Səhifə göndəriş ORTASINDA açılsa, socket yalnız BUNDAN SONRAKI hadisələri
  // gətirir — əvvəlki sətirlər serverin öz axınından götürülür. Olmasaydı,
  // 200 mesajlıq göndərişin ortasında açılan panel birdən bir sətirə düşərdi.
  const serverFeed = base.feed;
  useEffect(() => {
    if (!serverFeed?.length) return;
    const same = feedRef.current.startedAt === base.startedAt;
    if (!same || serverFeed.length > feedRef.current.rows.length) {
      feedRef.current = { startedAt: base.startedAt, rows: serverFeed };
    }
  }, [serverFeed, base.startedAt]);

  useEffect(() => {
    if (!socket) return;
    const push = (entry, startedAt) => {
      // Yeni göndəriş başlayıbsa köhnə sətirlər atılır.
      const rows = feedRef.current.startedAt === startedAt ? feedRef.current.rows : [];
      feedRef.current = { startedAt, rows: [entry, ...rows].slice(0, 300) };
      return feedRef.current.rows;
    };
    const onStart = (state) => {
      feedRef.current = { startedAt: state.startedAt, rows: [] };
      setLiveQueue({ ...state, feed: [] });
    };
    const onProgress = ({ entry, state }) => {
      setLiveQueue({ ...state, running: true, feed: push(entry, state.startedAt) });
    };
    const onDone = (state) => setLiveQueue({ ...state, feed: feedRef.current.rows });

    socket.on("bulk:start", onStart);
    socket.on("bulk:progress", onProgress);
    socket.on("bulk:done", onDone);
    return () => {
      socket.off("bulk:start", onStart);
      socket.off("bulk:progress", onProgress);
      socket.off("bulk:done", onDone);
    };
  }, [socket]);

  const wantedPoll = isReady && !queue.running ? 15000 : 3000;
  if (wantedPoll !== poll) setPoll(wantedPoll);

  /** Mutasiya işlədici — uğur/xəta toast-u ilə. */
  const run = async (fn, arg, okMsg) => {
    try {
      const res = await fn(arg).unwrap();
      notify.success(res?.message || okMsg);
      return true;
    } catch (err) {
      notify.error(err?.data?.message || "Xəta baş verdi");
      return false;
    }
  };

  const onSend = async (form) => {
    const ok = await run(send, form, "Mesaj göndərildi");
    if (ok) setModal(false);
    return ok;
  };

  const onLogout = async () => {
    const ok = await confirmDialog({
      tone: "error",
      title: "Sessiya silinsin?",
      text: "Cihaz telefondan ayrılacaq və saxlanmış sessiya silinəcək — yenidən qoşulmaq üçün <b>QR kodu təzədən skan etmək</b> lazım olacaq.",
      confirmText: "Bəli, sil",
      cancelText: "İmtina",
    });
    if (ok) run(logout, undefined, "Sessiya silindi");
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Başlıq + əməliyyatlar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">WhatsApp</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Nömrəni qoş və müraciət sahiblərinə birbaşa mesaj göndər.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> Yenilə
          </button>

          {isReady && (
            <>
              <button
                onClick={() => setModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Send className="h-4 w-4" /> Yeni mesaj
              </button>
              <button
                onClick={() => run(disconnect, undefined, "Bağlandı")}
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
              onClick={onLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              title="Cihazı ayır + sessiyanı sil"
            >
              <LogOut className="h-4 w-4" /> Sessiyanı sil
            </button>
          )}
        </div>
      </div>

      {/* Status zolağı */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4">
        <div className="flex items-center gap-2">
          <StatusBadge
            isLoading={isLoading}
            installed={installed}
            isReady={isReady}
            isInitializing={isInitializing}
            waiting={Boolean(qrDataUrl || pairingCode)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          {s.libVersion && <span>kitabxana <b className="font-mono text-gray-700">v{s.libVersion}</b></span>}
          {s.state && <span>vəziyyət: <b className="text-gray-700">{s.state}</b></span>}
          {isReady && (
            <>
              <span>hesab: <b className="text-gray-700">{s.connectedAs || "—"}</b></span>
              <span className="font-mono">{s.phoneNumber ? `+${s.phoneNumber}` : ""}</span>
            </>
          )}
        </div>
      </div>

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

      {/* Kitabxana yoxdursa — quraşdırma göstərişi */}
      {!installed ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <p className="font-semibold">Kitabxana quraşdırılmayıb</p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-white/70 p-3 font-mono text-xs">
cd apps/api
npm i whatsapp-web.js@^1.34.7 qrcode@^1.5.4
              </pre>
              <p className="mt-2">
                Quraşdırıldıqdan sonra API-ni yenidən başladın. Linux serverdə Chrome/Chromium
                da olmalıdır (yoxdursa <span className="font-mono">WHATSAPP_CHROME_PATH</span>).
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Tablar */}
          <div className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === t.id ? "bg-blue-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>

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
          </div>
        </>
      )}

      {modal && <SendModal onClose={() => setModal(false)} onSend={onSend} sending={sending} />}
    </div>
  );
}
