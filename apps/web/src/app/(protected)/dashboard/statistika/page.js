"use client";

// React
import { useState } from "react";
// Data
import { useAdminContentStatsQuery } from "@/store/api/adminApi";
// UI
import { QueryState } from "@/components/ui/QueryState";
// Icons
import { Eye, Inbox, FileText, GraduationCap, Users, Globe2, Building2, TrendingUp } from "lucide-react";

/**
 * Məzmun statistikası.
 *
 * İki fərqli sual var və onları qarışdırmamaq vacibdir:
 *   • BAXIŞ  — nəyə maraq göstərilir (səhifə açılışları)
 *   • MÜRACİƏT — nə real nəticə gətirir
 * Çox baxılan kurs həmişə çox müraciət gətirmir; ona görə hər ikisi ayrıca
 * göstərilir və yan-yana müqayisə oluna bilir.
 */

const WINDOWS = [
  { days: 7, label: "7 gün" },
  { days: 30, label: "30 gün" },
  { days: 90, label: "90 gün" },
];

const SOURCE_LABEL = {
  "apply-modal": "Müraciət formu",
  "contact-page": "Əlaqə səhifəsi",
  "course-page": "Kurs səhifəsi",
  whatsapp: "WhatsApp",
  phone: "Telefon",
  excel: "Excel",
  list: "Siyahı",
  other: "Digər",
};

const STATUS_LABEL = {
  new: "Yeni",
  contacted: "Əlaqə saxlanıldı",
  enrolled: "Qeydiyyatdan keçdi",
  rejected: "İmtina",
};
const STATUS_COLOR = {
  new: "#2563EB",
  contacted: "#D97706",
  enrolled: "#059669",
  rejected: "#9CA3AF",
};

function StatCard({ icon: Icon, label, value, hint, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 flex-none place-items-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-xl font-bold text-gray-900">{value.toLocaleString("az-AZ")}</div>
          <div className="truncate text-xs text-gray-500">{label}</div>
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

/** Sadə üfüqi sütun siyahısı — ən böyük dəyər 100% eni tutur. */
function BarList({ title, icon: Icon, rows, labelKey, valueKey = "count", empty, unit }) {
  const max = Math.max(...rows.map((r) => r[valueKey] || 0), 1);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
        <Icon className="h-4 w-4 text-gray-400" />
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="py-4 text-sm text-gray-400">{empty}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-gray-700">
                  <span className="mr-1.5 text-xs font-bold text-gray-400">{i + 1}.</span>
                  {r[labelKey] || "—"}
                </span>
                <span className="flex-none text-sm font-bold text-gray-900">
                  {(r[valueKey] || 0).toLocaleString("az-AZ")}
                  {unit ? <span className="ml-1 text-xs font-normal text-gray-400">{unit}</span> : null}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#00157A]"
                  style={{ width: `${Math.max(((r[valueKey] || 0) / max) * 100, 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Günlük müraciət qrafiki — kitabxanasız, sadə sütunlar. */
function DailyChart({ series }) {
  const max = Math.max(...series.map((s) => s.count), 1);
  const total = series.reduce((s, x) => s + x.count, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
        <TrendingUp className="h-4 w-4 text-gray-400" />
        Müraciət dinamikası
      </h2>
      <p className="mb-4 text-xs text-gray-400">
        Seçilmiş dövrdə <b className="text-gray-600">{total}</b> müraciət · ən yüksək gün: {max}
      </p>

      <div className="flex h-32 items-end gap-[2px]">
        {series.map((s) => (
          <div
            key={s.date}
            title={`${s.date}: ${s.count}`}
            className="flex-1 rounded-t bg-[#00157A] transition-all hover:bg-[#0022b8]"
            style={{ height: `${Math.max((s.count / max) * 100, 2)}%`, minWidth: 2 }}
          />
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-gray-400">
        <span>{series[0]?.date}</span>
        <span>{series.at(-1)?.date}</span>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminContentStatsQuery({ days });

  if (isLoading || isError) {
    return <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} />;
  }

  const d = data?.data || {};
  const t = d.totals || {};
  const statusRows = (d.leadsByStatus || []).map((r) => ({
    ...r,
    label: STATUS_LABEL[r.status] || r.status,
  }));
  const statusTotal = statusRows.reduce((s, x) => s + x.count, 0) || 1;

  return (
    <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
      {/* Dövr seçimi */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Dövr</span>
        {WINDOWS.map((w) => (
          <button
            key={w.days}
            onClick={() => setDays(w.days)}
            className={`rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition ${
              days === w.days
                ? "border-[#00157A] bg-[#00157A] text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Ümumi göstəricilər */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Inbox} label="Ümumi müraciət" value={t.leads || 0} tone="blue" />
        <StatCard
          icon={TrendingUp}
          label={`Son ${d.days} gündə müraciət`}
          value={t.leadsInWindow || 0}
          tone="emerald"
        />
        <StatCard icon={Eye} label="Kurs səhifəsi baxışı" value={t.courseViews || 0} tone="violet" />
        <StatCard icon={FileText} label="Bloq baxışı" value={t.postViews || 0} tone="amber" />
      </div>

      <div className="mb-4">
        <DailyChart series={d.series || []} />
      </div>

      {/* Baxış vs müraciət — yan-yana */}
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <BarList
          title="Ən çox baxılan kurslar"
          icon={GraduationCap}
          rows={(d.topCourses || []).filter((r) => r.views > 0)}
          labelKey="title"
          valueKey="views"
          unit="baxış"
          empty="Hələ baxış qeydə alınmayıb. Sayğac kurs səhifəsi açılanda işləyir."
        />
        <BarList
          title="Ən çox müraciət gətirən kurslar"
          icon={Inbox}
          rows={d.leadsByCourse || []}
          labelKey="title"
          unit="müraciət"
          empty="Kursa bağlı müraciət yoxdur."
        />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <BarList
          title="Ən çox oxunan bloq yazıları"
          icon={FileText}
          rows={(d.topPosts || []).filter((r) => r.views > 0)}
          labelKey="title"
          valueKey="views"
          unit="baxış"
          empty="Bloq yazısı yoxdur və ya heç baxılmayıb."
        />
        <BarList
          title="Müraciət mənbələri"
          icon={Inbox}
          rows={(d.leadsBySource || []).map((r) => ({ ...r, label: SOURCE_LABEL[r.source] || r.source }))}
          labelKey="label"
          empty="Müraciət yoxdur."
        />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <BarList
          title="Ən çox baxılan müəllimlər"
          icon={Users}
          rows={(d.topTeachers || []).filter((r) => r.views > 0)}
          labelKey="fullName"
          valueKey="views"
          unit="baxış"
          empty="Hələ baxış qeydə alınmayıb."
        />
        <BarList
          title="Ən çox baxılan ölkələr"
          icon={Globe2}
          rows={(d.topDestinations || []).filter((r) => r.views > 0)}
          labelKey="country"
          valueKey="views"
          unit="baxış"
          empty="Hələ baxış qeydə alınmayıb."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList
          title="Filial üzrə müraciətlər"
          icon={Building2}
          rows={d.leadsByBranch || []}
          labelKey="name"
          empty="Filiala bağlı müraciət yoxdur."
        />

        {/* Status bölgüsü — sadə yığılmış zolaq */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
            <Inbox className="h-4 w-4 text-gray-400" />
            Müraciət statusları
          </h2>
          {statusRows.length === 0 ? (
            <p className="py-4 text-sm text-gray-400">Müraciət yoxdur.</p>
          ) : (
            <>
              <div className="mb-3 flex h-3 overflow-hidden rounded-full">
                {statusRows.map((r) => (
                  <div
                    key={r.status}
                    title={`${r.label}: ${r.count}`}
                    style={{
                      width: `${(r.count / statusTotal) * 100}%`,
                      background: STATUS_COLOR[r.status] || "#9CA3AF",
                    }}
                  />
                ))}
              </div>
              <div className="space-y-1.5">
                {statusRows.map((r) => (
                  <div key={r.status} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2.5 w-2.5 flex-none rounded-full"
                      style={{ background: STATUS_COLOR[r.status] || "#9CA3AF" }}
                    />
                    <span className="flex-1 text-gray-600">{r.label}</span>
                    <span className="font-semibold text-gray-900">{r.count}</span>
                    <span className="w-12 text-right text-xs text-gray-400">
                      %{Math.round((r.count / statusTotal) * 100)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
