"use client";

// React
import { useEffect, useRef, useState } from "react";

// Icons
import { Sparkles, Loader2 } from "lucide-react";

// Components
import { confirmDialog, notify } from "@/components";

// Store
import { useAdminAutoTranslateMutation, useAdminAutoTranslateStatusQuery } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import ToolCard from "./ToolCard";
import { CountGrid, Notice } from "./shared";

/**
 * AI toplu tərcümə.
 *
 * ── NİYƏ GEDİŞAT GÖSTƏRİCİSİ VAR ──
 * İş hər sənəd üçün 1-2 AI çağırışı edir; bütün modellər birlikdə
 * dəqiqələrlə çəkir (ölçüldü: tək Partner modeli 30 sənəd = 35 saniyə).
 * Əvvəl düymə işin bitməsini gözləyirdi və sorğu Cloudflare-in 100 saniyə
 * limitində kəsilirdi: panel xəta göstərirdi, iş isə arxada davam edirdi —
 * yəni «yarıda saxlayır, tam tərcümə etmir». İndi iş arxa fonda başlayır,
 * bu komponent isə vəziyyəti saniyədə bir soruşur.
 */
export default function AutoTranslateTool() {
  const [startTranslate] = useAdminAutoTranslateMutation();
  const [langs, setLangs] = useState(["en", "ru"]);
  const [watching, setWatching] = useState(false);

  // İş gedərkən tez-tez, boşdayanmada seyrək soruşulur.
  const { data } = useAdminAutoTranslateStatusQuery(undefined, {
    pollingInterval: watching ? 1500 : 0,
    skipPollingIfUnfocused: true,
  });
  const job = data?.data || {};
  const running = Boolean(job.running);

  // İş bitdi — nəticəni BİR dəfə bildir və sorğunu dayandır. Bildiriş
  // effektdədir: render zamanı state dəyişmək olmaz, üstəlik `finishedAt`
  // gələn hər sorğuda təkrarlanır, ona görə ayrıca mühafizə saxlanılır.
  const notified = useRef(null);
  useEffect(() => {
    if (!watching || running || !job.finishedAt) return;
    if (notified.current === job.finishedAt) return;
    notified.current = job.finishedAt;
    setWatching(false);
    if (job.errors?.length) notify.error(`${job.errors.length} sahədə xəta oldu`);
    else notify.success(job.message || "Tərcümə tamamlandı");
  }, [watching, running, job.finishedAt, job.errors, job.message]);

  const run = async () => {
    const shown = langs.map((l) => l.toUpperCase()).join(" və ");
    const ok = await confirmDialog({
      tone: "warning",
      title: "AI toplu tərcümə başlasın?",
      text: `Bazadakı <b>boş ${shown}</b> sahələri AZ mətnindən tərcümə ediləcək.<br><br>Mövcud tərcümələr <b>dəyişmir</b>. İş arxa fonda gedir — gedişat burada görünəcək, səhifəni bağlasanız da davam edir.`,
      confirmText: "Bəli, başla",
      cancelText: "İmtina",
    });
    if (!ok) return;
    try {
      const res = await startTranslate({ langs }).unwrap();
      setWatching(true);
      notify.success(res?.message || "Tərcümə başladı");
    } catch (err) {
      notify.error(apiErrorMessage(err, "Tərcümə başlamadı"));
    }
  };

  const pct = job.docTotal ? Math.round((job.docIndex / job.docTotal) * 100) : 0;

  return (
    <ToolCard
      icon={Sparkles}
      iconClass="bg-violet-50 text-violet-700"
      title="AI ilə toplu tərcümə"
      description={
        <>
          Bazadakı <b>boş EN/RU</b> sahələrini AZ mətnindən avtomatik doldurur — kurslar,
          müəllimlər, filiallar, ölkələr, rəylər, FAQ, SEO və s. Artıq tərcümə olunmuş
          sahələrə <b>toxunmur</b>, ona görə təkrar işlədilə bilər.
        </>
      }
    >
      <Notice className="bg-violet-50 text-violet-800">
        Əvvəlcə <b>Tənzimləmələr → AI</b> bölməsində OpenRouter açarını təyin edin.
        İş arxa fonda gedir: səhifəni bağlasanız da davam edir, qayıdanda gedişatı
        yenidən burada görərsiniz.
      </Notice>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Dillər:</span>
        {["en", "ru"].map((l) => (
          <button
            key={l}
            onClick={() =>
              setLangs((prev) =>
                prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l],
              )
            }
            disabled={running}
            className={`rounded-md px-3 py-1 text-xs font-bold transition disabled:opacity-60 ${
              langs.includes(l)
                ? "bg-violet-600 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <button
        onClick={run}
        disabled={running || !langs.length}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {running ? "Tərcümə gedir…" : "Boş dilləri AI ilə doldur"}
      </button>

      {/* ── Canlı gedişat ── */}
      {running && (
        <div className="mt-4 rounded-lg border border-violet-100 bg-violet-50/60 p-3">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-violet-900">
            <span>{job.model ? `${job.model} işlənir` : "Başlayır…"}</span>
            <span className="tabular-nums">
              {job.docTotal ? `${job.docIndex} / ${job.docTotal}` : ""}
              {job.fields ? ` · ${job.fields} sahə` : ""}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-violet-100">
            <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-violet-700">
            Hər sənəd üçün 1-2 AI sorğusu gedir — bütöv qaçış bir neçə dəqiqə çəkir.
          </p>
        </div>
      )}

      {/* ── Xətalar ── */}
      {!running && job.errors?.length > 0 && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <div className="font-bold">{job.errors.length} xəta:</div>
          <ul className="mt-1 space-y-0.5">
            {job.errors.slice(0, 5).map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        </div>
      )}

      {!running && job.report && <CountGrid counts={job.report} value={(v) => v.changedFields ?? 0} />}
    </ToolCard>
  );
}
