// Icons
import { StopCircle, CheckCircle2, XCircle, SkipForward } from "lucide-react";

// Utils
import { fmtTime } from "@/utils";

// Local
import { STATUS_BADGE } from "../shared";

const FEED_ICON = {
  sent: { Icon: CheckCircle2, cls: "text-emerald-600" },
  failed: { Icon: XCircle, cls: "text-red-500" },
  skipped: { Icon: SkipForward, cls: "text-amber-500" },
  cancelled: { Icon: StopCircle, cls: "text-gray-500" },
};

/**
 * Canlı axın — hər alıcı üçün bir sətir, ən yenisi yuxarıda.
 *
 * NİYƏ LAZIMDIR: əvvəl yalnız «12 / 300» sayğacı vardı. Göndəriş saatlarla
 * çəkəndə admin nəyin baş verdiyini görmürdü: hansı nömrəyə getdi, hansı
 * ötürüldü, xəta nədir. Tarixçə bazadadır, amma o, göndəriş BİTƏNDƏN sonra
 * baxmaq üçündür — bu isə gedişatı canlı izləmək üçün.
 */
export function LiveFeed({ feed = [] }) {
  if (!feed.length) {
    return (
      <p className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
        İlk mesaj göndəriləndə burada görünəcək…
      </p>
    );
  }
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-gray-100">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-50">
          {feed.map((e, i) => {
            const { Icon, cls } = FEED_ICON[e.status] || FEED_ICON.sent;
            const b = STATUS_BADGE[e.status];
            return (
              <tr key={`${e.at}-${e.to || "x"}-${i}`} className="hover:bg-gray-50/60">
                <td className="w-9 py-2 pl-3">
                  <Icon className={`h-4 w-4 ${cls}`} />
                </td>
                <td className="w-12 py-2 pr-2 text-right font-mono text-xs text-gray-400">
                  {e.i ? `#${e.i}` : ""}
                </td>
                <td className="py-2 pr-2">
                  <span className="font-mono text-gray-900">{e.to || "—"}</span>
                  {e.name && <span className="ml-2 text-xs text-gray-500">{e.name}</span>}
                  {e.error && <div className="text-xs text-gray-500">{e.error}</div>}
                </td>
                <td className="w-24 py-2 pr-2">
                  {b && (
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${b.cls}`}>
                      {b.label}
                    </span>
                  )}
                </td>
                <td className="w-16 py-2 pr-3 text-right font-mono text-xs text-gray-400">
                  {fmtTime(e.at, { seconds: true })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
