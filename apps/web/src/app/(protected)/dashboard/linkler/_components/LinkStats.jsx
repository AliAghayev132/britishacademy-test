"use client";

// React
import { useState } from "react";

// Icons
import { Trash2, Smartphone, Monitor, Globe, Users, MousePointerClick } from "lucide-react";

// Components
import { QueryState, confirmDialog, notify } from "@/components";

// Store
import { useLinkStatsQuery, useResetLinkClicksMutation } from "@/store";

// Utils
import { fmtNumber, apiErrorMessage } from "@/utils";

// Local
import BarList from "./BarList";
import ClickChart from "./ClickChart";
import HourChart from "./HourChart";

const DEVICE_LABEL = {
  mobile: "Mobil", tablet: "Planşet", desktop: "Kompüter", bot: "Bot", other: "Digər",
};

const WINDOWS = [
  { days: 7, label: "7 gün" },
  { days: 30, label: "30 gün" },
  { days: 90, label: "90 gün" },
];

/** Bir linkin detallı hesabatı — modalın içində göstərilir. */
export default function LinkStats({ id }) {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError, error, refetch } = useLinkStatsQuery({ id, days });
  const [resetClicks] = useResetLinkClicksMutation();

  if (isLoading || isError) {
    return <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} />;
  }

  const d = data?.data || {};
  const t = d.totals || {};

  const cards = [
    { icon: MousePointerClick, label: "Ümumi klik", value: t.clicks, tone: "bg-blue-50 text-blue-700" },
    { icon: Users, label: "Unikal ziyarətçi", value: t.unique, tone: "bg-emerald-50 text-emerald-700" },
    { icon: MousePointerClick, label: `Son ${d.days} gündə klik`, value: t.clicksInWindow, tone: "bg-violet-50 text-violet-700" },
    { icon: Users, label: `Son ${d.days} gündə unikal`, value: t.uniqueInWindow, tone: "bg-amber-50 text-amber-700" },
  ];

  const runReset = async () => {
    const ok = await confirmDialog({
      tone: "error",
      title: "Kliklər silinsin?",
      text: "Bu linkin <b>bütün klik tarixçəsi</b> silinir və sayğac sıfırlanır. Kampaniya başlamazdan əvvəl sınaq kliklərini təmizləmək üçündür.<br><br>Geri qaytarıla bilməz.",
      confirmText: "Bəli, sil",
    });
    if (!ok) return;
    try {
      const res = await resetClicks({ id }).unwrap();
      notify.success(res.message || "Silindi");
    } catch (e) {
      notify.error(apiErrorMessage(e, "Alınmadı"));
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 truncate font-mono text-xs text-gray-500">
          /r/{d.link?.code} → {d.link?.target}
        </p>
        <div className="flex items-center gap-2">
          {WINDOWS.map((w) => (
            <button
              key={w.days}
              onClick={() => setDays(w.days)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                days === w.days
                  ? "border-[#00157A] bg-[#00157A] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className={`grid h-10 w-10 flex-none place-items-center rounded-lg ${s.tone}`}>
                <s.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-xl font-bold text-gray-900">
                  {fmtNumber(s.value)}
                </div>
                <div className="truncate text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mb-4 rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">
        <b>Unikal ziyarətçi</b> gün ərzində fərqli adamların sayıdır. Şəxsi məlumat
        saxlanılmır — ziyarətçi izi hər gün dəyişən duzla heşlənir, ona görə eyni
        adam iki fərqli gündə iki dəfə sayılır.
      </p>

      <div className="mb-4"><ClickChart series={d.series || []} /></div>
      <div className="mb-4"><HourChart hours={d.hours || []} /></div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList title="Mənbə" icon={Globe} rows={d.bySource || []} empty="Klik yoxdur." />
        <BarList
          title="Cihaz"
          icon={Smartphone}
          rows={(d.byDevice || []).map((r) => ({ ...r, label: DEVICE_LABEL[r.label] || r.label }))}
          empty="Klik yoxdur."
        />
        <BarList title="Brauzer" icon={Monitor} rows={d.byBrowser || []} empty="Klik yoxdur." />
        <BarList title="Əməliyyat sistemi" icon={Monitor} rows={d.byOs || []} empty="Klik yoxdur." />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={runReset}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Klik tarixçəsini sıfırla
        </button>
      </div>
    </div>
  );
}
