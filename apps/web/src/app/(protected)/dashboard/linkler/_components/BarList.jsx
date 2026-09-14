// Utils
import { fmtNumber } from "@/utils";

/** Sadə üfüqi sütun siyahısı — ən böyük dəyər tam eni tutur. */
export default function BarList({ title, icon: Icon, rows, empty }) {
  const max = Math.max(...rows.map((r) => r.count || 0), 1);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
        <Icon className="h-4 w-4 text-gray-400" />
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="py-3 text-sm text-gray-400">{empty}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-gray-700">{r.label}</span>
                <span className="flex-none text-sm font-bold text-gray-900">
                  {fmtNumber(r.count)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#00157A]"
                  style={{ width: `${Math.max((r.count / max) * 100, 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
