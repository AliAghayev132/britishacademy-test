"use client";

// ── WhatsApp ──
// whatsapp-web.js (1.34.x) ilə QR / qoşulma kodu üzərindən bağlanma, tək və
// toplu mesaj göndərişi, göndəriş tarixçəsi.
//
// QR şəkli SERVERDƏ generasiya olunur (data URL) — kənar QR servisinə
// göndərmirik, çünki QR sessiya qoşulma məlumatı daşıyır.

// React
import { useState } from "react";
// UI
import { confirmDialog, notify } from "@/components/ui/feedback";
import { QueryState } from "@/components/ui/QueryState";
import {
  MessageSquare, Send, X, RefreshCw, CheckCircle, XCircle, Loader2,
  AlertCircle, Smartphone, LogOut, PowerOff, Users, History, KeyRound, StopCircle,
} from "lucide-react";
// Data
import {
  useWhatsappStatusQuery,
  useWhatsappInitMutation,
  useWhatsappSendMutation,
  useWhatsappBulkMutation,
  useWhatsappBulkCancelMutation,
  useWhatsappMessagesQuery,
  useWhatsappDisconnectMutation,
  useWhatsappLogoutMutation,
} from "@/store/api/adminApi";

const input =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500";
const label = "mb-1.5 block text-sm font-medium text-gray-700";

const TABS = [
  { id: "connect", label: "Qoşulma", icon: Smartphone },
  { id: "bulk", label: "Toplu göndəriş", icon: Users },
  { id: "history", label: "Tarixçə", icon: History },
];

const LEAD_STATUSES = [
  { value: "all", label: "Hamısı" },
  { value: "new", label: "Yeni" },
  { value: "contacted", label: "Əlaqə saxlanılıb" },
  { value: "enrolled", label: "Qeydiyyatdan keçib" },
];

const STATUS_BADGE = {
  sent: { label: "Göndərildi", cls: "bg-blue-100 text-blue-700" },
  delivered: { label: "Çatdırıldı", cls: "bg-indigo-100 text-indigo-700" },
  read: { label: "Oxundu", cls: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Alınmadı", cls: "bg-red-100 text-red-700" },
};

const fmt = (d) => (d ? new Date(d).toLocaleString("az-AZ") : "—");

export default function WhatsAppPage() {
  const [tab, setTab] = useState("connect");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ phone: "", message: "" });
  const [pairPhone, setPairPhone] = useState("");
  const [bulkForm, setBulkForm] = useState({ template: "", leadStatus: "new", skipDuplicates: true });
  const [page, setPage] = useState(1);

  // Aktiv iş varsa 3 saniyədən bir, sakit vəziyyətdə seyrək yoxlanılır.
  const [poll, setPoll] = useState(3000);
  const { data, isLoading, isError, error, refetch } = useWhatsappStatusQuery(undefined, {
    pollingInterval: poll,
    skipPollingIfUnfocused: true,
  });

  const [init, { isLoading: initing }] = useWhatsappInitMutation();
  const [send, { isLoading: sending }] = useWhatsappSendMutation();
  const [startBulk, { isLoading: bulking }] = useWhatsappBulkMutation();
  const [cancelBulk] = useWhatsappBulkCancelMutation();
  const [disconnect, { isLoading: disconnecting }] = useWhatsappDisconnectMutation();
  const [logout, { isLoading: loggingOut }] = useWhatsappLogoutMutation();

  const s = data?.data || {};
  const { installed = true, isReady, isInitializing, qrDataUrl, pairingCode, lastError, queue = {} } = s;

  const wantedPoll = isReady && !queue.running ? 15000 : 3000;
  if (wantedPoll !== poll) setPoll(wantedPoll);

  const {
    data: msgData, isFetching: msgLoading,
    isError: msgError, error: msgErrorObj, refetch: refetchMsgs,
  } = useWhatsappMessagesQuery(
    { page, limit: 20 },
    { skip: tab !== "history" },
  );
  const messages = msgData?.data?.items || [];
  const pagination = msgData?.data?.pagination;

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

  const onSend = async (e) => {
    e.preventDefault();
    const ok = await run(send, form, "Mesaj göndərildi");
    if (ok) {
      setModal(false);
      setForm({ phone: "", message: "" });
    }
  };

  const onBulk = async () => {
    const ok = await confirmDialog({
      tone: "warning",
      title: "Toplu göndəriş başlasın?",
      text:
        "Seçilmiş müraciətlərə mesaj göndəriləcək. Mesajlar <b>ardıcıl və gecikmə ilə</b> " +
        "göndərilir (4–9 san) — WhatsApp bloklamasın deyə.<br><br>" +
        "Kütləvi göndəriş nömrənizin bloklanma riskini artırır.",
      confirmText: "Bəli, başla",
      cancelText: "İmtina",
    });
    if (!ok) return;
    run(startBulk, bulkForm, "Toplu göndəriş başladı");
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

  // ── Status nişanı ──
  const badge = isLoading ? (
    <span className="text-sm text-gray-500">Yüklənir…</span>
  ) : !installed ? (
    <><XCircle className="h-5 w-5 text-gray-400" /><span className="text-sm font-semibold text-gray-500">Quraşdırılmayıb</span></>
  ) : isReady ? (
    <><CheckCircle className="h-5 w-5 text-emerald-500" /><span className="text-sm font-semibold text-emerald-600">Aktiv</span></>
  ) : isInitializing ? (
    <><Loader2 className="h-5 w-5 animate-spin text-amber-500" /><span className="text-sm font-semibold text-amber-600">Başladılır…</span></>
  ) : qrDataUrl || pairingCode ? (
    <><Loader2 className="h-5 w-5 animate-spin text-blue-500" /><span className="text-sm font-semibold text-blue-600">Qoşulma gözlənilir</span></>
  ) : (
    <><XCircle className="h-5 w-5 text-red-500" /><span className="text-sm font-semibold text-red-600">Qeyri-aktiv</span></>
  );

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
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> Yenilə
          </button>
          {isReady && (
            <>
              <button
                onClick={() => setModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Send className="h-4 w-4" /> Yeni mesaj
              </button>
              <button
                onClick={() => run(disconnect, undefined, "Bağlandı")}
                disabled={disconnecting}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
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
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
              title="Cihazı ayır + sessiyanı sil"
            >
              <LogOut className="h-4 w-4" /> Sessiyanı sil
            </button>
          )}
        </div>
      </div>

      {/* Status zolağı */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4">
        <div className="flex items-center gap-2">{badge}</div>
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

      {lastError && !isReady && (
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

          {/* ── Qoşulma ── */}
          {tab === "connect" && (
            <div className="rounded-xl border border-gray-200 bg-white">
              {isReady ? (
                <div className="grid gap-4 p-5 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Hesab</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">{s.connectedAs || "—"}</div>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Nömrə</div>
                    <div className="mt-1 font-mono text-sm font-semibold text-gray-900">
                      {s.phoneNumber ? `+${s.phoneNumber}` : "—"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Qoşulub</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">{fmt(s.readyAt)}</div>
                  </div>
                </div>
              ) : qrDataUrl || pairingCode ? (
                <div className="flex flex-col items-center p-8">
                  {pairingCode ? (
                    <>
                      <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-700">
                        <KeyRound className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Qoşulma kodu</h3>
                      <p className="mt-1 max-w-md text-center text-sm text-gray-600">
                        Telefonda <b>WhatsApp → Linked devices → Link with phone number</b> seçin
                        və bu kodu daxil edin:
                      </p>
                      <div className="mt-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50 px-8 py-5 font-mono text-3xl font-bold tracking-[0.3em] text-emerald-700">
                        {pairingCode}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-700">
                        <Smartphone className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">QR kodu skan edin</h3>
                      <p className="mt-1 max-w-md text-center text-sm text-gray-600">
                        Telefonda <b>WhatsApp → Linked devices → Link a device</b>.
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt="WhatsApp QR kodu"
                        className="mt-5 h-72 w-72 rounded-2xl border-4 border-emerald-500 bg-white p-3"
                      />
                    </>
                  )}
                </div>
              ) : (
                <div className="p-6">
                  <p className="text-sm text-gray-600">
                    {s.hasSession
                      ? "Saxlanmış sessiya var — «Qoşul» düyməsi QR olmadan bərpa edəcək."
                      : "Qoşulmaq üçün iki üsul var: QR kodu skan edin, ya da telefon nömrəsi ilə qoşulma kodu alın."}
                  </p>
                  <div className="mt-5 flex flex-wrap items-end gap-3">
                    <button
                      onClick={() => run(init, {}, "Başladılır…")}
                      disabled={initing || isInitializing}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                    >
                      {initing || isInitializing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                      {s.hasSession ? "Qoşul" : "QR ilə qoşul"}
                    </button>

                    <div className="flex items-end gap-2">
                      <div>
                        <label className={label}>və ya nömrə ilə kod al</label>
                        <input
                          value={pairPhone}
                          onChange={(e) => setPairPhone(e.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="994501234567"
                          maxLength={12}
                          className={`${input} w-48 font-mono`}
                        />
                      </div>
                      <button
                        onClick={() => run(init, { pairPhone }, "Kod hazırlanır…")}
                        disabled={initing || isInitializing || pairPhone.length < 9}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
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
              )}
            </div>
          )}

          {/* ── Toplu göndəriş ── */}
          {tab === "bulk" && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              {queue.running ? (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      Göndəriş davam edir — {queue.sent + queue.failed} / {queue.total}
                    </div>
                    <button
                      onClick={() => run(cancelBulk, undefined, "Dayandırılır…")}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      <StopCircle className="h-4 w-4" /> Dayandır
                    </button>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-900 transition-all"
                      style={{ width: `${Math.round(((queue.sent + queue.failed) / (queue.total || 1)) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex gap-4 text-sm text-gray-500">
                    <span className="text-emerald-600">✓ {queue.sent} göndərildi</span>
                    <span className="text-red-600">✕ {queue.failed} alınmadı</span>
                    {queue.current && <span className="font-mono">→ {queue.current}</span>}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {!isReady && (
                    <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                      Toplu göndəriş üçün əvvəlcə «Qoşulma» tabından qoşulun.
                    </div>
                  )}
                  <div>
                    <label className={label}>Kimə göndərilsin</label>
                    <select
                      value={bulkForm.leadStatus}
                      onChange={(e) => setBulkForm({ ...bulkForm, leadStatus: e.target.value })}
                      className={input}
                    >
                      {LEAD_STATUSES.map((o) => (
                        <option key={o.value} value={o.value}>Müraciətlər — {o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={label}>Mesaj şablonu</label>
                    <textarea
                      rows={5}
                      value={bulkForm.template}
                      onChange={(e) => setBulkForm({ ...bulkForm, template: e.target.value })}
                      placeholder="Salam {{ad}}! British Academy-də yeni qrup açılır…"
                      className={`${input} resize-none`}
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Dəyişənlər: <span className="font-mono">{"{{ad}}"}</span>,{" "}
                      <span className="font-mono">{"{{telefon}}"}</span> — hər müraciətin
                      məlumatı ilə əvəzlənir.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={bulkForm.skipDuplicates}
                      onChange={(e) => setBulkForm({ ...bulkForm, skipDuplicates: e.target.checked })}
                      className="h-4 w-4"
                    />
                    Son 24 saatda mesaj alan nömrələri ötür
                  </label>
                  <button
                    onClick={onBulk}
                    disabled={bulking || !isReady || !bulkForm.template.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                  >
                    {bulking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                    Göndərişi başlat
                  </button>

                  {queue.finishedAt && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                      <b className="text-gray-900">Son göndəriş:</b>{" "}
                      <span className="text-emerald-600">{queue.sent} göndərildi</span>,{" "}
                      <span className="text-red-600">{queue.failed} alınmadı</span>{" "}
                      <span className="text-gray-400">({fmt(queue.finishedAt)})</span>
                      {queue.errors?.length > 0 && (
                        <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-gray-500">
                          {queue.errors.map((e, i) => (
                            <li key={i}><span className="font-mono">{e.phone}</span> — {e.error}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Tarixçə ── */}
          {tab === "history" && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {(msgLoading && messages.length === 0) || msgError || messages.length === 0 ? (
                <QueryState
                  isLoading={msgLoading && !msgError}
                  isError={msgError}
                  error={msgErrorObj}
                  onRetry={refetchMsgs}
                  isEmpty={messages.length === 0}
                  emptyText="Hələ mesaj göndərilməyib."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Nömrə</th>
                        <th className="hidden px-4 py-3 md:table-cell">Mesaj</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="hidden px-4 py-3 sm:table-cell">Tarix</th>
                      </tr>
                    </thead>
                    <tbody className={msgLoading ? "opacity-60" : ""}>
                      {messages.map((m) => {
                        const b = STATUS_BADGE[m.status] || STATUS_BADGE.sent;
                        return (
                          <tr key={m._id} className="border-t border-gray-100">
                            <td className="px-4 py-3 font-mono text-gray-900">+{m.phone}</td>
                            <td className="hidden max-w-md truncate px-4 py-3 text-gray-500 md:table-cell">
                              {m.body || (m.media?.filename ? `📎 ${m.media.filename}` : "—")}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${b.cls}`}>{b.label}</span>
                              {m.error && <div className="mt-1 text-xs text-red-500">{m.error}</div>}
                            </td>
                            <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">{fmt(m.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    </table>
                </div>
              )}
              {pagination && pagination.pages > 1 && (
                <div className="flex justify-center gap-2 border-t border-gray-100 p-3">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).slice(0, 12).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`h-8 w-8 rounded-lg text-sm font-semibold ${
                        n === pagination.page ? "bg-blue-900 text-white" : "border border-gray-200 text-gray-600"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Tək mesaj modalı */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && setModal(false)}
        >
          <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">Yeni mesaj</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-700" aria-label="Bağla">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={onSend} className="space-y-4 p-6">
              <label className="block">
                <span className={label}>Telefon nömrəsi <span className="text-red-500">*</span></span>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, "") })}
                  placeholder="994501234567 və ya 0501234567"
                  maxLength={12}
                  className={`${input} font-mono`}
                />
              </label>
              <label className="block">
                <span className={label}>Mesaj <span className="text-red-500">*</span></span>
                <textarea
                  required
                  rows={6}
                  maxLength={1000}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Göndərmək istədiyiniz mesajı yazın…"
                  className={`${input} resize-none`}
                />
                <span className="mt-1 block text-right text-xs text-gray-400">{form.message.length} / 1000</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending ? "Göndərilir…" : "Göndər"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
