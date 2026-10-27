"use client";

// React
import { useState } from "react";

// Icons
import {
  Megaphone,
  Target,
  KeyRound,
  Layers,
  Inbox,
  GraduationCap,
  Upload,
  Download,
} from "lucide-react";

// Components
import { QueryState, DateRangePicker, notify } from "@/components";

// Store
import { useAdminCampaignStatsQuery, useLazyAdminGoogleConversionsQuery } from "@/store";

// Lib
import { googleConversionsCsv, downloadText } from "@/lib";

// Utils
import { fmtNumber, apiErrorMessage } from "@/utils";

// Local
import { Card, Stat, Table } from "./FunnelTab";
import { AD_CHANNEL_BY_KEY } from "../../muracietler/adChannels";

/**
 * «Reklam» tabı — müraciətlər hansı kanal / kampaniya / açar söz / reklam
 * qrupundan gəlib və onlardan neçəsi real qeydiyyata çevrilib.
 *
 * «Qeydiyyat» = müraciətin statusu «Qeydiyyatdan keçdi». Operatorlar statusu
 * yeniləmirsə bu sütun boş qalır — hesabatın dəyəri statusların vaxtında
 * dəyişilməsindən asılıdır.
 */

const PAID = new Set(["google-ads", "meta-ads", "paid-other"]);
const pct = (a, b) => (b ? `%${Math.round((a / b) * 1000) / 10}` : "—");
const channelLabel = (k) => (k === "unknown" ? "Məlum deyil" : AD_CHANNEL_BY_KEY[k]?.label || k);

function CampaignCell({ name, id }) {
  return (
    <span title={id}>
      {name || <span className="font-mono text-xs">{id}</span>}
      {name && <span className="ml-1.5 font-mono text-[11px] text-gray-400">{id}</span>}
    </span>
  );
}

const row = (label, r) => [label, fmtNumber(r.leads), fmtNumber(r.enrolled), pct(r.enrolled, r.leads)];
const HEAD = ["Müraciət", "Qeydiyyat", "Çevrilmə"];

export default function CampaignsTab({ days }) {
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminCampaignStatsQuery({ days });
  if (isLoading || isError) {
    return <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} />;
  }
  const d = data?.data || {};
  const channels = d.channels || [];
  const paid = channels.filter((c) => PAID.has(c.channel));
  const paidTotal = paid.reduce((a, c) => ({ leads: a.leads + c.leads, enrolled: a.enrolled + c.enrolled }), { leads: 0, enrolled: 0 });
  const total = d.total || { leads: 0, enrolled: 0 };

  return (
    <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Inbox} label={`Son ${d.days} gündə müraciət`} value={fmtNumber(total.leads)} />
        <Stat icon={Megaphone} label="Reklamdan gələn" value={fmtNumber(paidTotal.leads)} sub={`ümumi müraciətin ${pct(paidTotal.leads, total.leads)}`} />
        <Stat icon={GraduationCap} label="Qeydiyyatdan keçən" value={fmtNumber(total.enrolled)} sub={`çevrilmə ${pct(total.enrolled, total.leads)}`} />
        <Stat icon={Target} label="Reklamdan qeydiyyat" value={fmtNumber(paidTotal.enrolled)} sub={`çevrilmə ${pct(paidTotal.enrolled, paidTotal.leads)}`} />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card title="Reklam mənbələri" icon={Megaphone} hint="Müraciət haradan gəlib. «Məlum deyil» — bu funksiyadan əvvəlki müraciətlər.">
          <Table head={["Mənbə", ...HEAD]} rows={channels.map((r) => row(channelLabel(r.channel), r))} empty="Bu dövrdə müraciət yoxdur." />
        </Card>
        <Card title="Kampaniyalar" icon={Target} hint="Ad «Müraciətlər → Kampaniya adları»-ndan gəlir; yazılmayıbsa ID görünür.">
          <Table
            head={["Kampaniya", ...HEAD]}
            rows={(d.campaigns || []).map((r) => row(<CampaignCell name={r.name} id={r.id} />, r))}
            empty="Bu dövrdə kampaniyadan müraciət yoxdur."
          />
        </Card>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card title="Açar sözlər" icon={KeyRound} hint="Axtarış kampaniyalarında istifadəçinin yazdığı söz. Performance Max / Display-də olmur.">
          <Table
            head={["Açar söz", ...HEAD]}
            rows={(d.terms || []).map((r) => row(<span title={r.campaignName || r.campaign}>{r.term}</span>, r))}
            empty="Bu dövrdə açar sözlü müraciət yoxdur."
          />
        </Card>
        <Card title="Reklam qrupları" icon={Layers} hint="Reklam qrupunun ID-si (Google Ads → Ad groups).">
          <Table
            head={["Reklam qrupu", ...HEAD]}
            rows={(d.adGroups || []).map((r) => row(<span className="font-mono text-xs" title={r.campaignName || r.campaign}>{r.id}</span>, r))}
            empty="Bu dövrdə reklam qrupu məlumatı yoxdur."
          />
        </Card>
      </div>

      <GoogleConversionsCard />
    </div>
  );
}

// ── Google Ads offline konversiya ──

const NAME_KEY = "ba-gads-conversion-name";
const readName = () => {
  try {
    return localStorage.getItem(NAME_KEY) || "Qeydiyyat";
  } catch {
    return "Qeydiyyat";
  }
};
const isoDay = (date) => date.toLocaleDateString("en-CA", { timeZone: "Asia/Baku" }); // YYYY-MM-DD

/**
 * Qeydiyyatdan keçən müraciətlərin Google klik kodlarını Google Ads-ə qaytarmaq.
 * Google bununla reklamı «formu dolduranlara» yox, «real qeydiyyat edənlərə»
 * görə optimallaşdırır.
 */
function GoogleConversionsCard() {
  const [from, setFrom] = useState(() => isoDay(new Date(Date.now() - 6 * 864e5)));
  const [to, setTo] = useState(() => isoDay(new Date()));
  const [name, setName] = useState(readName);
  const [value, setValue] = useState("");
  const [load, { isFetching }] = useLazyAdminGoogleConversionsQuery();

  const download = async () => {
    const conversionName = name.trim();
    if (!conversionName) return notify.error("Konversiya adını yazın");
    try {
      localStorage.setItem(NAME_KEY, conversionName);
    } catch {
      /* yadda saxlanmadı — növbəti dəfə yenidən yazılar */
    }
    try {
      const res = await load({ from, to }).unwrap();
      const { rows = [], expired = 0 } = res.data || {};
      if (!rows.length) {
        notify.error(
          expired
            ? `Bu aralıqda yüklənə bilən konversiya yoxdur (${expired} klik 90 gündən köhnədir).`
            : "Bu aralıqda Google Ads-dən gəlib qeydiyyatdan keçən müraciət yoxdur.",
        );
        return;
      }
      downloadText(googleConversionsCsv(rows, { name: conversionName, value }), `google-ads-konversiyalar-${from}_${to}.csv`);
      notify.success(`${rows.length} konversiya faylı yükləndi${expired ? ` · ${expired} köhnə klik çıxarıldı` : ""}`);
    } catch (err) {
      notify.error(apiErrorMessage(err, "Fayl hazırlanmadı"));
    }
  };

  const input = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500";

  return (
    <Card title="Google Ads-ə konversiya göndər" icon={Upload} hint="Qeydiyyatdan keçən müraciətləri Google Ads-ə qaytarın — reklam real tələbə gətirən axtarışlara yönəlsin.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Qeydiyyat tarixi</span>
            <DateRangePicker from={from} to={to} onFrom={setFrom} onTo={setTo} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Konversiya adı (Google Ads-dəki ilə eyni)</span>
            <input id="gads-conversion-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Dəyər, AZN (istəyə bağlı)</span>
            <input
              id="gads-conversion-value"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              placeholder="məs: 150"
              className={input}
            />
          </label>
          <button
            type="button"
            onClick={download}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00157A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00157A]/90 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {isFetching ? "Hazırlanır…" : "CSV faylını yüklə"}
          </button>
        </div>

        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-600">
          <li>
            <b>Bir dəfə:</b> Google Ads → <i>Goals → Conversions → New conversion action → Import</i> →
            «Manual import using API or uploads» → «Track conversions from clicks». Adını yuxarıdakı sahəyə
            yazdığınız kimi qoyun.
          </li>
          <li>Hər həftə keçən həftənin aralığını seçib faylı yükləyin.</li>
          <li>Google Ads → <i>Goals → Conversions → Uploads</i> → faylı seçib yükləyin.</li>
          <li className="text-xs text-gray-400">
            Faylda yalnız Google klik kodu və qeydiyyat vaxtı var — ad, telefon yoxdur. Klikdən 90 gün keçibsə Google
            qəbul etmir, belə sətirlər fayla salınmır. Eyni faylı iki dəfə yükləmək eyni konversiyanı təkrarlamır.
          </li>
        </ol>
      </div>
    </Card>
  );
}
