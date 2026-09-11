"use client";

// Data
import { useAdminFunnelStatsQuery } from "@/store/api/adminApi";
// UI
import { QueryState } from "@/components/ui/QueryState";
// Icons
import { Users, MousePointerClick, Send, TrendingUp, Globe2, Smartphone, FileText, Info } from "lucide-react";

/**
 * «Müraciət hunisi» tabı: sayta giriş → forma açıldı → müraciət göndərildi.
 *
 * Bütün göstəricilər UNİKAL SESSİYA sayıdır — bir nəfər formanı üç dəfə
 * açsa huni üç nəfər göstərmir (ümumi açılış sayı ayrıca yazılır).
 * Ziyarət sayı müraciət sayından onlarla dəfə böyükdür, ona görə gündəlik
 * dinamika bir qrafikdə deyil, hər göstərici öz miqyası ilə ayrıca göstərilir.
 */

const fmt = (n) => (n || 0).toLocaleString("az-AZ");
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const pageLabel = (p) => (p === "/" ? "Ana səhifə" : p);
const DEVICE = { mobile: "Mobil", desktop: "Kompüter", tablet: "Planşet", other: "Digər" };

function Card({ title, icon: Icon, hint, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
        <Icon className="h-4 w-4 text-gray-400" />
        {title}
      </h2>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-xl font-bold text-gray-900">{value}</div>
          <div className="truncate text-xs text-gray-500">{label}</div>
        </div>
      </div>
      {sub && <p className="mt-2 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

/** Huni — hər addımda neçə sessiya qalır. Zolaq eni ziyarətə nisbətdir. */
function FunnelSteps({ totals }) {
  const steps = [
    { key: "visits", label: "Sayta giriş", icon: Users, value: totals.visits, note: "unikal sessiya" },
    { key: "opens", label: "Müraciət formunu açdı", icon: MousePointerClick, value: totals.opens, note: `forma cəmi ${fmt(totals.openEvents)} dəfə açılıb` },
    { key: "submits", label: "Müraciət göndərdi", icon: Send, value: totals.submits, note: `${fmt(totals.submitEvents)} müraciət` },
  ];
  const max = Math.max(totals.visits, 1);
  return (
    <div className="space-y-5">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const prev = i ? steps[i - 1] : null;
        return (
          <div key={s.key}>
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Icon className="h-4 w-4 text-gray-400" />
                {s.label}
              </span>
              <span className="text-sm">
                <b className="text-lg text-gray-900">{fmt(s.value)}</b>
                <span className="ml-1.5 text-xs text-gray-400">{s.note}</span>
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#00157A] transition-all"
                style={{ width: `${s.value ? Math.max((s.value / max) * 100, 1.5) : 0}%` }}
              />
            </div>
            {prev && (
              <p className="mt-1 text-xs text-gray-500">
                «{prev.label}» addımından <b className="text-gray-800">%{pct(s.value, prev.value)}</b> keçdi
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Bir göstəricinin gündəlik sütunları — öz miqyası ilə. */
function DailyStrip({ title, series, field }) {
  const max = Math.max(...series.map((s) => s[field]), 1);
  const total = series.reduce((a, s) => a + s[field], 0);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-gray-700">{title}</span>
        <span className="text-gray-400">
          cəmi <b className="text-gray-700">{fmt(total)}</b> · ən yüksək gün {fmt(max === 1 && total === 0 ? 0 : max)}
        </span>
      </div>
      <div className="flex h-16 items-end gap-[2px]">
        {series.map((s) => (
          <div
            key={s.date}
            title={`${s.date}: ${s[field]}`}
            className="flex-1 rounded-t bg-[#00157A] opacity-90 transition hover:opacity-100"
            style={{ height: `${s[field] ? Math.max((s[field] / max) * 100, 4) : 2}%`, minWidth: 2, opacity: s[field] ? undefined : 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

function Table({ head, rows, empty }) {
  if (!rows.length) return <p className="py-3 text-sm text-gray-400">{empty}</p>;
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
            {head.map((h, i) => (
              <th key={h} className={`px-1 pb-2 font-semibold ${i ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-gray-50 last:border-0">
              {r.map((c, j) => (
                <td key={j} className={`px-1 py-2 ${j ? "text-right tabular-nums text-gray-900" : "max-w-[260px] truncate text-gray-700"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FunnelTab({ days }) {
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminFunnelStatsQuery({ days });
  if (isLoading || isError) {
    return <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} />;
  }

  const d = data?.data || {};
  const t = d.totals || {};
  const series = d.series || [];
  const since = d.trackingSince ? new Date(d.trackingSince).toLocaleDateString("az-AZ") : null;

  return (
    <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
      {!t.visits && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 flex-none" />
          <span>
            Bu dövrdə hələ məlumat yoxdur. Sayğac saytda ziyarətlər olduqca dolacaq
            {since ? ` (ilk qeyd: ${since})` : " — yeni qoşulub"}.
          </span>
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Sayta giriş (sessiya)" value={fmt(t.visits)} />
        <Stat icon={MousePointerClick} label="Formanı açan" value={fmt(t.opens)} sub={`Girişlərin %${pct(t.opens, t.visits)}-i`} />
        <Stat icon={Send} label="Müraciət göndərən" value={fmt(t.submits)} sub={`Formanı açanların %${pct(t.submits, t.opens)}-i`} />
        <Stat icon={TrendingUp} label="Ümumi konversiya" value={`%${pct(t.submits, t.visits)}`} sub="Girişdən müraciətə" />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card title="Müraciət hunisi" icon={TrendingUp} hint={`Son ${d.days} gün · hər addımda neçə nəfər (sessiya) qalır`}>
          <FunnelSteps totals={t} />
        </Card>
        <Card title="Gündəlik dinamika" icon={TrendingUp} hint="Hər göstərici öz miqyası ilə — sütunun üstünə gəl, dəyəri gör">
          <div className="space-y-4">
            <DailyStrip title="Sayta giriş" series={series} field="visits" />
            <DailyStrip title="Formanı açan" series={series} field="opens" />
            <DailyStrip title="Müraciət göndərən" series={series} field="submits" />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-gray-400">
            <span>{series[0]?.date}</span>
            <span>{series.at(-1)?.date}</span>
          </div>
        </Card>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card title="Forma hansı səhifədən açılır" icon={FileText} hint="Hansı səhifə müraciətə daha yaxşı çevirir">
          <Table
            head={["Səhifə", "Açan", "Göndərən", "Çevrilmə"]}
            rows={(d.pages || []).map((r) => [pageLabel(r.path), fmt(r.opens), fmt(r.submits), `%${pct(r.submits, r.opens)}`])}
            empty="Forma hələ açılmayıb."
          />
        </Card>
        <Card title="Mənbələr" icon={Globe2} hint="Ziyarətçi haradan gəlib (utm_source → reklam → referer)">
          <Table
            head={["Mənbə", "Giriş", "Açan", "Göndərən", "Konversiya"]}
            rows={(d.sources || []).map((r) => [r.source, fmt(r.visits), fmt(r.opens), fmt(r.submits), `%${pct(r.submits, r.visits)}`])}
            empty="Hələ ziyarət yoxdur."
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Cihazlar" icon={Smartphone} hint="Sayta giriş sessiyaları">
          <Table
            head={["Cihaz", "Sessiya", "Pay"]}
            rows={(d.devices || []).map((r) => [DEVICE[r.device] || r.device, fmt(r.sessions), `%${pct(r.sessions, t.visits)}`])}
            empty="Hələ ziyarət yoxdur."
          />
        </Card>
        <Card title="Google Analytics / Tag Manager" icon={Info}>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Eyni hadisələr GTM-ə də (<code className="rounded bg-gray-100 px-1">dataLayer</code>) göndərilir:</p>
            <ul className="space-y-1 text-xs">
              <li><code className="rounded bg-gray-100 px-1">apply_modal_open</code> — forma açıldı</li>
              <li><code className="rounded bg-gray-100 px-1">generate_lead</code> — müraciət göndərildi</li>
              <li><code className="rounded bg-gray-100 px-1">virtual_pageview</code> — <code className="rounded bg-gray-100 px-1">…/thank-you</code> virtual səhifəsi (məs. /kurslar/ingilis-dili-kurslari/thank-you)</li>
            </ul>
            <p className="text-xs text-gray-400">
              Rəqəmlər GA-dakından bir qədər fərqli ola bilər: bu sayğac reklam bloklayıcısından
              təsirlənmir, botları isə saymır. Şəxsi məlumat (ad, telefon, IP) saxlanılmır.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
