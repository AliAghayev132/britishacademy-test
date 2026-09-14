// Icons
import { BarChart3 } from "lucide-react";

/** Klik dinamikası — kitabxanasız sütun qrafiki. */
export default function ClickChart({ series }) {
  const max = Math.max(...series.map((s) => s.count), 1);
  const total = series.reduce((s, x) => s + x.count, 0);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
        <BarChart3 className="h-4 w-4 text-gray-400" />
        Klik dinamikası
      </h3>
      <p className="mb-4 text-xs text-gray-400">
        Seçilmiş dövrdə <b className="text-gray-600">{total}</b> klik · ən yüksək gün: {max}
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
