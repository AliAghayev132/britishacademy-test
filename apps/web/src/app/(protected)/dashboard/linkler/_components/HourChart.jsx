// Icons
import { Clock } from "lucide-react";

/** Saat bölgüsü — reklamı nə vaxt göstərmək daha səmərəlidir. */
export default function HourChart({ hours }) {
  const max = Math.max(...hours.map((h) => h.count), 1);
  const peak = hours.reduce((a, b) => (b.count > a.count ? b : a), hours[0] || { hour: 0, count: 0 });
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
        <Clock className="h-4 w-4 text-gray-400" />
        Saat üzrə bölgü
      </h3>
      <p className="mb-4 text-xs text-gray-400">
        Ən aktiv saat: <b className="text-gray-600">{String(peak.hour).padStart(2, "0")}:00</b>{" "}
        ({peak.count} klik) · Bakı vaxtı
      </p>
      <div className="flex h-24 items-end gap-[3px]">
        {hours.map((h) => (
          <div
            key={h.hour}
            className="flex-1"
            title={`${String(h.hour).padStart(2, "0")}:00 — ${h.count} klik`}
          >
            <div
              className="rounded-t bg-emerald-500/80 transition-all hover:bg-emerald-600"
              style={{ height: `${Math.max((h.count / max) * 96, 2)}px` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-gray-400">
        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
      </div>
    </div>
  );
}
