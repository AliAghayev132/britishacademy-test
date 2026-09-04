"use client";

// ── Toplu göndəriş ──
// İki kanal (WhatsApp / e-poçt) × üç mənbə (müraciətlər / Excel / əl ilə siyahı).
// Göndərmədən əvvəl server `preview` verir, sonra iki mərhələli təsdiq alınır.

import { useState } from "react";
import {
  Loader2, StopCircle, Users, MessageCircle, Mail, FileSpreadsheet,
  ListPlus, Upload, X, Timer, CheckCircle2, XCircle, SkipForward, Radio,
} from "lucide-react";
import { notify } from "@/components/ui/feedback";
import { useBulkPreviewMutation, useBulkSendMutation } from "@/store/api/adminApi";
import { parseSpreadsheet, parseLines } from "@/lib/recipientParser";
import { ConfirmSend } from "./ConfirmSend";
import { input, label, LEAD_STATUSES, fmt, fmtTime, fmtDuration, STATUS_BADGE } from "./shared";

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, hint: "Nömrələrə mesaj" },
  { id: "email", label: "E-poçt", icon: Mail, hint: "SMTP ilə məktub" },
];

const SOURCES = [
  { id: "leads", label: "Müraciətlər", icon: Users, hint: "Statusa görə süz" },
  { id: "excel", label: "Excel / CSV", icon: FileSpreadsheet, hint: "Fayl yüklə" },
  { id: "list", label: "Əl ilə siyahı", icon: ListPlus, hint: "Sətir-sətir yaz" },
];

const FEED_ICON = {
  sent: { Icon: CheckCircle2, cls: "text-emerald-600" },
  failed: { Icon: XCircle, cls: "text-red-500" },
  skipped: { Icon: SkipForward, cls: "text-amber-500" },
  cancelled: { Icon: StopCircle, cls: "text-gray-500" },
};

/**
 * Canlı axın — hər alıcı üçün bir sətir, ən yenisi yuxarıda.
 *
 * NİYƏ LAZIMDIR: əvvəl yalnız «12 / 300» sayğacı vardı. Göndəriş saatlarla
 * çəkəndə admin nəyin baş verdiyini görmürdü: hansı nömrəyə getdi, hansı
 * ötürüldü, xəta nədir. Tarixçə bazadadır, amma o, göndəriş BİTƏNDƏN sonra
 * baxmaq üçündür — bu isə gedişatı canlı izləmək üçün.
 */
function LiveFeed({ feed = [] }) {
  if (!feed.length) {
    return (
      <p className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
        İlk mesaj göndəriləndə burada görünəcək…
      </p>
    );
  }
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-gray-100">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-50">
          {feed.map((e, i) => {
            const { Icon, cls } = FEED_ICON[e.status] || FEED_ICON.sent;
            const b = STATUS_BADGE[e.status];
            return (
              <tr key={`${e.at}-${e.to || "x"}-${i}`} className="hover:bg-gray-50/60">
                <td className="w-9 py-2 pl-3">
                  <Icon className={`h-4 w-4 ${cls}`} />
                </td>
                <td className="w-12 py-2 pr-2 text-right font-mono text-xs text-gray-400">
                  {e.i ? `#${e.i}` : ""}
                </td>
                <td className="py-2 pr-2">
                  <span className="font-mono text-gray-900">{e.to || "—"}</span>
                  {e.name && <span className="ml-2 text-xs text-gray-500">{e.name}</span>}
                  {e.error && <div className="text-xs text-gray-500">{e.error}</div>}
                </td>
                <td className="w-24 py-2 pr-2">
                  {b && (
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${b.cls}`}>
                      {b.label}
                    </span>
                  )}
                </td>
                <td className="w-16 py-2 pr-3 text-right font-mono text-xs text-gray-400">
                  {fmtTime(e.at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ Icon, cls, value, label: text }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${cls}`}>
      <Icon className="h-4 w-4" /> <b>{value}</b> {text}
    </span>
  );
}

function Progress({ queue, onCancel, live }) {
  const done = queue.done ?? (queue.sent || 0) + (queue.failed || 0) + (queue.skipped || 0);
  const pct = Math.round((done / (queue.total || 1)) * 100);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          {queue.channel === "email" ? "E-poçt" : "WhatsApp"} göndərilir — {done} / {queue.total}
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
            {pct}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Bağlantı göstəricisi: socket qopsa admin niyə yenilənmədiyini bilsin. */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              live ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
            }`}
            title={live ? "Canlı bağlantı aktivdir" : "Canlı bağlantı yoxdur — arada bir yoxlanılır"}
          >
            <Radio className={`h-3.5 w-3.5 ${live ? "animate-pulse" : ""}`} />
            {live ? "Canlı" : "Sorğu ilə"}
          </span>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <StopCircle className="h-4 w-4" /> Dayandır
          </button>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-900 transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
        <Stat Icon={CheckCircle2} cls="text-emerald-600" value={queue.sent || 0} label="göndərildi" />
        <Stat Icon={XCircle} cls="text-red-600" value={queue.failed || 0} label="alınmadı" />
        <Stat Icon={SkipForward} cls="text-amber-600" value={queue.skipped || 0} label="ötürüldü" />
        {queue.delaySec > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Timer className="h-4 w-4" /> {queue.delaySec} san fasilə
          </span>
        )}
        {queue.etaSec > 0 && <span>təxminən {fmtDuration(queue.etaSec)} qalıb</span>}
      </div>

      {queue.current && (
        <div className="mt-2 text-sm text-gray-500">
          hazırda: <span className="font-mono text-gray-900">{queue.current}</span>
        </div>
      )}

      <div className="mt-4">
        <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
          Canlı gediş
        </div>
        <LiveFeed feed={queue.feed} />
      </div>
    </div>
  );
}

function LastRun({ queue }) {
  if (!queue.finishedAt) return null;
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
      <b className="text-gray-900">Son göndəriş:</b>{" "}
      <span className="text-emerald-600">{queue.sent} göndərildi</span>,{" "}
      <span className="text-red-600">{queue.failed} alınmadı</span>
      {queue.skipped > 0 && (
        <>, <span className="text-amber-600">{queue.skipped} ötürüldü</span></>
      )}{" "}
      <span className="text-gray-400">({fmt(queue.finishedAt)})</span>
      {queue.errors?.length > 0 && (
        <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-gray-500">
          {queue.errors.map((e, i) => (
            <li key={`${e.to}-${i}`}>
              <span className="font-mono">{e.to}</span> — {e.error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Seçim kartları (kanal / mənbə) */
function Picker({ options, value, onChange }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition ${
            value === o.id ? "border-blue-900 bg-blue-50" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <o.icon className={`mt-0.5 h-4 w-4 flex-none ${value === o.id ? "text-blue-900" : "text-gray-400"}`} />
          <span className="min-w-0">
            <span className={`block text-sm font-semibold ${value === o.id ? "text-blue-900" : "text-gray-700"}`}>
              {o.label}
            </span>
            <span className="block text-xs text-gray-500">{o.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function BulkTab({ queue = {}, isReady, onCancel, live = false }) {
  const [channel, setChannel] = useState("whatsapp");
  const [source, setSource] = useState("leads");
  const [leadStatus, setLeadStatus] = useState("new");
  const [template, setTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  // Fasilə: null = kanalın defoltu. Kanal dəyişəndə defolt da dəyişir, ona
  // görə dəyər burada saxlanılmır — yalnız adminin ƏLİ ilə verdiyi rəqəm.
  const [delaySec, setDelaySec] = useState("");

  const [rows, setRows] = useState([]);        // Excel/əl ilə parse nəticəsi
  const [fileName, setFileName] = useState("");
  const [lines, setLines] = useState("");
  const [parsing, setParsing] = useState(false);

  const [preview, setPreview] = useState(null); // təsdiq dialoqu açır

  const [runPreview, { isLoading: previewing }] = useBulkPreviewMutation();
  const [runSend, { isLoading: sending }] = useBulkSendMutation();

  const isEmail = channel === "email";
  // Həddlər serverdən gəlir (bax bulkController.status) — iki yerdə
  // saxlanılsaydı bir-birindən ayrı düşərdi.
  const limits = queue.limits?.[channel] || (isEmail ? { min: 1, max: 300, def: 2 } : { min: 2, max: 300, def: 6 });
  // WhatsApp qoşulmayıbsa yalnız e-poçt mümkündür.
  const channelBlocked = !isEmail && !isReady;

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setParsing(true);
    try {
      const { rows: parsed, headerDetected, sheet } = await parseSpreadsheet(f);
      setRows(parsed);
      setFileName(f.name);
      notify.success(
        `${parsed.length} sətir oxundu (${sheet}${headerDetected ? ", başlıqlı" : ", başlıqsız"})`,
      );
    } catch (err) {
      notify.error("Fayl oxunmadı: " + (err?.message || "naməlum format"));
    } finally {
      setParsing(false);
      e.target.value = "";
    }
  };

  /** Mənbəyə görə serverə göndəriləcək gövdə. */
  const buildBody = () => ({
    channel,
    source,
    ...(delaySec === "" ? {} : { delaySec: Number(delaySec) }),
    ...(source === "leads" ? { leadStatus } : {}),
    ...(source === "excel" ? { recipients: rows } : {}),
    ...(source === "list" ? { recipients: parseLines(lines) } : {}),
  });

  const openConfirm = async () => {
    try {
      const res = await runPreview(buildBody()).unwrap();
      const data = res?.data;
      if (!data?.total) {
        notify.error(
          data?.invalidCount
            ? `Etibarlı alıcı yoxdur (${data.invalidCount} sətir yanlışdır)`
            : "Göndəriləcək alıcı tapılmadı",
        );
        return;
      }
      setPreview(data);
    } catch (err) {
      notify.error(err?.data?.message || "Önizləmə alınmadı");
    }
  };

  const confirmSend = async () => {
    try {
      const res = await runSend({
        ...buildBody(),
        template,
        subject,
        skipDuplicates,
        confirm: true,
      }).unwrap();
      notify.success(res?.message || "Göndəriş başladı");
      setPreview(null);
    } catch (err) {
      notify.error(err?.data?.message || "Göndəriş başlamadı");
    }
  };

  const canSend =
    !channelBlocked &&
    template.trim() &&
    (!isEmail || subject.trim()) &&
    (source === "leads" || (source === "excel" ? rows.length : lines.trim()));

  if (queue.running) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <Progress queue={queue} onCancel={onCancel} live={live} />
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
      {/* Kanal */}
      <div>
        <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">Kanal</div>
        <Picker options={CHANNELS} value={channel} onChange={setChannel} />
        {channelBlocked && (
          <p className="mt-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            WhatsApp qoşulmayıb — «Qoşulma» tabından qoşulun və ya e-poçt kanalını seçin.
          </p>
        )}
      </div>

      {/* Mənbə */}
      <div>
        <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
          Alıcılar haradan
        </div>
        <Picker options={SOURCES} value={source} onChange={setSource} />
      </div>

      {/* Mənbəyə görə giriş */}
      {source === "leads" && (
        <div>
          <label className={label}>Müraciət statusu</label>
          <select value={leadStatus} onChange={(e) => setLeadStatus(e.target.value)} className={input}>
            {LEAD_STATUSES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            {isEmail
              ? "E-poçtu olmayan müraciətlər avtomatik ötürülür."
              : "Nömrəsi olmayan müraciətlər avtomatik ötürülür."}
          </p>
        </div>
      )}

      {source === "excel" && (
        <div>
          <label className={label}>Excel / CSV faylı</label>
          {rows.length > 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-2.5">
              <FileSpreadsheet className="h-5 w-5 flex-none text-emerald-600" />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{fileName}</span>
              <span className="flex-none rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                {rows.length} sətir
              </span>
              <button
                onClick={() => { setRows([]); setFileName(""); }}
                className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50"
                aria-label="Sil"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-5 text-sm font-medium text-gray-500 transition-colors hover:border-[#00157A] hover:text-[#00157A]">
              {parsing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              {parsing ? "Oxunur…" : "Fayl seç (.xlsx, .xls, .csv)"}
              <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="hidden" />
            </label>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Başlıq sətri varsa <b>Ad</b>, <b>Nömrə</b>, <b>E-poçt</b> sütunları tanınır.
            Başlıq yoxdursa hər sətrin ilk xanası dəyər sayılır.
          </p>
        </div>
      )}

      {source === "list" && (
        <div>
          <label className={label}>Siyahı — hər sətirdə bir alıcı</label>
          <textarea
            rows={7}
            value={lines}
            onChange={(e) => setLines(e.target.value)}
            placeholder={isEmail
              ? "aynur@mail.com\nElvin, elvin@mail.com\nnigar@mail.com"
              : "0501234567\nAynur, 0552124151\nElvin - 0777777777"}
            className={`${input} resize-none font-mono text-sm`}
          />
          <p className="mt-1 text-xs text-gray-400">
            {parseLines(lines).length} sətir · «Ad, dəyər» formatı da qəbul olunur
            (vergül, nöqtəli vergül və ya tire ilə).
          </p>
        </div>
      )}

      {/* Mesaj */}
      {isEmail && (
        <div>
          <label className={label}>Mövzu <span className="text-red-500">*</span></label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="British Academy — yeni qrup elanı"
            className={input}
          />
        </div>
      )}

      <div>
        <label className={label}>Mesaj mətni <span className="text-red-500">*</span></label>
        <textarea
          rows={5}
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder="Salam {{ad}}! British Academy-də yeni qrup açılır…"
          className={`${input} resize-none`}
        />
        <p className="mt-1 text-xs text-gray-400">
          Dəyişənlər: <span className="font-mono">{"{{ad}}"}</span>,{" "}
          <span className="font-mono">{isEmail ? "{{email}}" : "{{telefon}}"}</span>
        </p>
      </div>

      {/* Fasilə */}
      <div>
        <label className={label}>Mesajlar arası fasilə</label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="number"
              min={limits.min}
              max={limits.max}
              step={1}
              value={delaySec}
              onChange={(e) => setDelaySec(e.target.value)}
              placeholder={String(limits.def)}
              className={`${input} w-32 pr-12`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
              san
            </span>
          </div>
          {[3, 6, 10, 20, 30].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setDelaySec(String(v))}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                String(v) === delaySec
                  ? "border-blue-900 bg-blue-900 text-white"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {v} san
            </button>
          ))}
          {delaySec !== "" && (
            <button
              type="button"
              onClick={() => setDelaySec("")}
              className="text-xs font-semibold text-gray-500 underline-offset-2 hover:underline"
            >
              defolt
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Boş buraxsan {limits.def} san işlənir. İcazə verilən aralıq{" "}
          {limits.min}–{limits.max} san.
          {!isEmail && " WhatsApp-da fasiləyə 0–30% təsadüfi əlavə olunur — eyni ritm avtomat kimi görünür və bloklanma riskini artırır."}
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={skipDuplicates}
          onChange={(e) => setSkipDuplicates(e.target.checked)}
          className="h-4 w-4"
        />
        Son 24 saatda mesaj alan alıcıları ötür
      </label>

      <button
        onClick={openConfirm}
        disabled={!canSend || previewing}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
      >
        {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
        Yoxla və göndər
      </button>

      <LastRun queue={queue} />

      {preview && (
        <ConfirmSend
          preview={preview}
          channel={channel}
          template={template}
          subject={subject}
          sending={sending}
          onCancel={() => setPreview(null)}
          onConfirm={confirmSend}
        />
      )}
    </div>
  );
}
