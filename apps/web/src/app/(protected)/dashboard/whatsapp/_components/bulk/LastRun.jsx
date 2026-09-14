// Utils
import { fmtDateTime } from "@/utils";

/** Son bitmiş göndərişin xülasəsi və xətaları. */
export function LastRun({ queue }) {
  if (!queue.finishedAt) return null;
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
      <b className="text-gray-900">Son göndəriş:</b>{" "}
      <span className="text-emerald-600">{queue.sent} göndərildi</span>,{" "}
      <span className="text-red-600">{queue.failed} alınmadı</span>
      {queue.skipped > 0 && (
        <>, <span className="text-amber-600">{queue.skipped} ötürüldü</span></>
      )}{" "}
      <span className="text-gray-400">({fmtDateTime(queue.finishedAt, { seconds: true })})</span>
      {queue.errors?.length > 0 && (
        <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-gray-500">
          {queue.errors.map((e, i) => (
            <li key={`${e.to}-${i}`}>
              <span className="font-mono">{e.to}</span> — {e.error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
