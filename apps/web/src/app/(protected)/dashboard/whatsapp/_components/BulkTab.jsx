"use client";

// ── Toplu göndəriş ──
// İki kanal (WhatsApp / e-poçt) × üç mənbə (müraciətlər / Excel / əl ilə siyahı).
// Göndərmədən əvvəl server `preview` verir, sonra iki mərhələli təsdiq alınır.
//
// Bu fayl yalnız state + serverə sorğuları saxlayır; hissələrin UI-ı `bulk/` altındadır.

// React
import { useState } from "react";

// Icons
import { Loader2, Users } from "lucide-react";

// Components
import { Checkbox, notify } from "@/components";

// Store
import { useBulkPreviewMutation, useBulkSendMutation } from "@/store";

// Lib
import { parseSpreadsheet, parseLines } from "@/lib";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import { ConfirmSend } from "./ConfirmSend";
import { Progress } from "./bulk/Progress";
import { LastRun } from "./bulk/LastRun";
import { ChannelPicker, SourcePicker } from "./bulk/Pickers";
import { RecipientsInput } from "./bulk/RecipientsInput";
import { MessageEditor } from "./bulk/MessageEditor";
import { DelaySettings } from "./bulk/DelaySettings";

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
      notify.error(apiErrorMessage(err, "Önizləmə alınmadı"));
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
      notify.error(apiErrorMessage(err, "Göndəriş başlamadı"));
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
      <ChannelPicker value={channel} onChange={setChannel} blocked={channelBlocked} />
      <SourcePicker value={source} onChange={setSource} />

      <RecipientsInput
        source={source}
        isEmail={isEmail}
        leadStatus={leadStatus}
        onLeadStatus={setLeadStatus}
        rows={rows}
        fileName={fileName}
        parsing={parsing}
        onFile={onFile}
        onClearFile={() => { setRows([]); setFileName(""); }}
        lines={lines}
        onLines={setLines}
      />

      <MessageEditor
        isEmail={isEmail}
        subject={subject}
        onSubject={setSubject}
        template={template}
        onTemplate={setTemplate}
      />

      <DelaySettings limits={limits} delaySec={delaySec} onDelaySec={setDelaySec} isEmail={isEmail} />

      <Checkbox
        checked={skipDuplicates}
        onChange={setSkipDuplicates}
        label="Son 24 saatda mesaj alan alıcıları ötür"
      />

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
