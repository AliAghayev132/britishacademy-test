// Icons
import { TriangleAlert } from "lucide-react";

// İkinci dərəcəli düymələr — «Yoxla (quru rejim)» və «Üzərinə yaz».
export const BTN_OUTLINE =
  "inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60";
export const BTN_OVERWRITE =
  "inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60";

/** Rəngli xəbərdarlıq qutusu; `className` — fon və mətn rəngi. */
export function Notice({ className, children }) {
  return (
    <div className={`mt-4 flex items-start gap-2 rounded-lg p-3 text-sm ${className}`}>
      <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
      <span>{children}</span>
    </div>
  );
}

export function ReportTitle({ children }) {
  return <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{children}</div>;
}

/** Açar → say şəbəkəsi (miqrasiya, tərcümə, seed nəticələri). */
export function CountGrid({ title = "Nəticə", counts, value = (v) => v, cellBg = "bg-gray-50" }) {
  return (
    <div className="mt-6">
      <ReportTitle>{title}</ReportTitle>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Object.entries(counts).map(([k, v]) => (
          <div key={k} className={`rounded-lg border border-gray-100 ${cellBg} px-3 py-2 text-sm`}>
            <span className="font-bold text-gray-900">{value(v)}</span>{" "}
            <span className="text-gray-500">{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** `scroll` — uzun siyahı: hündürlük məhdudlaşır, başlıq yapışqan qalır. */
export function ReportTable({ columns, scroll = false, children }) {
  return (
    <div className={scroll ? "max-h-80 overflow-auto rounded-lg border border-gray-100" : "overflow-x-auto rounded-lg border border-gray-100"}>
      <table className="w-full text-sm">
        <thead className={`${scroll ? "sticky top-0 " : ""}bg-gray-50 text-left text-xs uppercase text-gray-500`}>
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Warnings({ items }) {
  if (!(items?.length > 0)) return null;
  return (
    <ul className="mt-2 space-y-1 text-xs text-amber-700">
      {items.map((w, i) => <li key={i}>⚠️ {w}</li>)}
    </ul>
  );
}
