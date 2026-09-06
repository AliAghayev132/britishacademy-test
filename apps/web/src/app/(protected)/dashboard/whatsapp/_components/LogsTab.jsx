"use client";

// ── WhatsApp hadisə jurnalı ──
//
// NİYƏ AYRICA TAB: «Tarixçə» göndərilən MESAJLARI göstərir — «kimə nə getdi».
// Bağlantının özü (QR, autentifikasiya, vəziyyət dəyişmələri, kəsilmə, Chrome
// xətaları, sağlamlıq yoxlaması) isə heç yerdə qalmırdı — yalnız server
// konsoluna yazılırdı. «Dünən gecə niyə kəsildi» sualına cavab vermək üçün
// serverə SSH ilə girmək lazım gəlirdi.
//
// Yeni hadisələr socket ilə DƏRHAL düşür; sorğu yalnız səhifələmə və
// bağlantı qopanda ehtiyat üçündür.

// React
import { useEffect, useState } from "react";
// Data
import { useWhatsappLogsQuery, useWhatsappClearLogsMutation } from "@/store/api/adminApi";
// Real-time
import { useSocket } from "@/store/context/SocketContext";
// UI
import { QueryState } from "@/components/ui/QueryState";
import { Pagination } from "@/components/ui/Pagination";
import { confirmDialog, notify } from "@/components/ui/feedback";
// Icons
import {
  Trash2, Radio, QrCode, ShieldCheck, CheckCircle2, Activity, PlugZap,
  HeartPulse, Send, KeyRound, Package, AlertTriangle, Filter,
} from "lucide-react";
// Local
import { fmt } from "./shared";

/** Hadisə növü → etiket + ikon. Serverdəki WA_LOG_TYPES ilə eynidir. */
const TYPES = {
  init: { label: "Başlatma", Icon: PlugZap },
  qr: { label: "QR / kod", Icon: QrCode },
  auth: { label: "Autentifikasiya", Icon: ShieldCheck },
  ready: { label: "Hazır", Icon: CheckCircle2 },
  state: { label: "Vəziyyət", Icon: Activity },
  disconnect: { label: "Kəsilmə", Icon: PlugZap },
  health: { label: "Sağlamlıq", Icon: HeartPulse },
  send: { label: "Göndərmə", Icon: Send },
  ack: { label: "Çatdırılma", Icon: CheckCircle2 },
  session: { label: "Sessiya", Icon: KeyRound },
  version: { label: "Versiya", Icon: Package },
  error: { label: "Xəta", Icon: AlertTriangle },
};

const LEVELS = {
  info: { label: "Məlumat", dot: "bg-gray-300", text: "text-gray-600" },
  warn: { label: "Diqqət", dot: "bg-amber-400", text: "text-amber-700" },
  error: { label: "Xəta", dot: "bg-red-500", text: "text-red-700" },
};

const select =
  "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500";

export function LogsTab() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [level, setLevel] = useState("");
  const { socket, isConnected } = useSocket();

  const params = { page, limit: 50, ...(type ? { type } : {}), ...(level ? { level } : {}) };
  const { data, isFetching, isError, error, refetch } = useWhatsappLogsQuery(params, {
    // Socket işləyəndə seyrək — hadisələr onsuz da anında gəlir.
    pollingInterval: isConnected ? 60000 : 8000,
    skipPollingIfUnfocused: true,
  });
  const [clearLogs, { isLoading: clearing }] = useWhatsappClearLogsMutation();

  // Socket-dən gələn yeni sətirlər siyahının BAŞINA əlavə olunur.
  //
  // Canlı yığın CARİ SÜZGƏCLƏ birlikdə saxlanılır: səhifə və ya süzgəc
  // dəyişəndə köhnə sətirlər sadəcə RENDER zamanı atılır. Ayrıca sıfırlama
  // effekti yazsaydıq, effektin içində sinxron setState olardı.
  const sig = `${page}|${type}|${level}`;
  const [live, setLive] = useState({ sig, rows: [] });

  // Dinləyici süzgəc dəyişəndə yenidən qurulur — cari dəyərlər bağlanışdan
  // (closure) götürülür, ona görə ref lazım deyil.
  useEffect(() => {
    if (!socket) return;
    const onLog = (row) => {
      // Yalnız birinci səhifədə və cari süzgəcə uyğun olanlar.
      if (page !== 1) return;
      if (type && row.type !== type) return;
      if (level && row.level !== level) return;
      setLive((prev) => {
        const rows = prev.sig === sig ? prev.rows : [];
        return { sig, rows: [row, ...rows].slice(0, 50) };
      });
    };
    socket.on("whatsapp:log", onLog);
    return () => socket.off("whatsapp:log", onLog);
  }, [socket, page, type, level, sig]);

  const liveRows = live.sig === sig ? live.rows : [];

  const stored = data?.data?.items || [];
  const pagination = data?.data?.pagination;
  // Canlı sətirlər serverdən gələnlərlə üst-üstə düşə bilər — vaxt+mətnə görə
  // təkrarlar atılır.
  const seen = new Set(stored.map((x) => `${x.createdAt}|${x.message}`));
  const items = [...liveRows.filter((x) => !seen.has(`${x.createdAt}|${x.message}`)), ...stored];
  const firstLoad = isFetching && stored.length === 0;

  const runClear = async () => {
    const ok = await confirmDialog({
      tone: "error",
      title: "Jurnal təmizlənsin?",
      text: "Bütün hadisə qeydləri silinir. Göndərilmiş mesajların tarixçəsinə <b>toxunulmur</b>.",
      confirmText: "Bəli, təmizlə",
    });
    if (!ok) return;
    try {
      const res = await clearLogs().unwrap();
      setLive({ sig, rows: [] });
      notify.success(res.message || "Təmizləndi");
    } catch (e) {
      notify.error(e?.data?.message || "Alınmadı");
    }
  };

  return (
    <div className="space-y-3">
      {/* Süzgəclər */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className={select}>
          <option value="">Bütün hadisələr</option>
          {Object.entries(TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }} className={select}>
          <option value="">Bütün səviyyələr</option>
          {Object.entries(LEVELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <span
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isConnected ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
          }`}
          title={isConnected ? "Yeni hadisələr dərhal görünür" : "Canlı bağlantı yoxdur — arada bir yoxlanılır"}
        >
          <Radio className={`h-3.5 w-3.5 ${isConnected ? "animate-pulse" : ""}`} />
          {isConnected ? "Canlı" : "Sorğu ilə"}
        </span>
        <button
          onClick={runClear}
          disabled={clearing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" /> Təmizlə
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {firstLoad || isError || items.length === 0 ? (
          <QueryState
            isLoading={firstLoad && !isError}
            isError={isError}
            error={error}
            onRetry={refetch}
            isEmpty={items.length === 0}
            emptyText="Hələ hadisə qeydə alınmayıb."
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((x, i) => {
              const t = TYPES[x.type] || TYPES.error;
              const lv = LEVELS[x.level] || LEVELS.info;
              return (
                <li key={`${x.createdAt}-${i}`} className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${lv.dot}`} />
                  <t.Icon className={`mt-0.5 h-4 w-4 flex-none ${lv.text}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-900">{x.message}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
                      <span className="font-semibold">{t.label}</span>
                      <span>{fmt(x.createdAt)}</span>
                      {x.actor?.email && <span>· {x.actor.email}</span>}
                    </div>
                    {/* Texniki təfərrüat gizli qalır — lazım olanda açılır. */}
                    {x.meta && Object.keys(x.meta).length > 0 && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                          texniki məlumat
                        </summary>
                        <pre className="mt-1 overflow-x-auto rounded-lg bg-gray-50 p-2 text-[11px] leading-relaxed text-gray-600">
{JSON.stringify(x.meta, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Pagination
          page={pagination?.page || 1}
          pages={pagination?.pages || 1}
          total={pagination?.total}
          onChange={setPage}
        />
      </div>
    </div>
  );
}
