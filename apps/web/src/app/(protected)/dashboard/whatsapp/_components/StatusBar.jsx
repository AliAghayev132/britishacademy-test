// Icons
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

// Local
import { fmtUptime } from "./uptime";

/** Status nişanı — vəziyyətə görə ikon + rəng. */
function StatusBadge({ isLoading, installed, isReady, isInitializing, waiting }) {
  if (isLoading) return <span className="text-sm text-gray-500">Yüklənir…</span>;
  const map = !installed
    ? [XCircle, "text-gray-400", "text-gray-500", "Quraşdırılmayıb", false]
    : isReady
      ? [CheckCircle, "text-emerald-500", "text-emerald-600", "Aktiv", false]
      : isInitializing
        ? [Loader2, "text-amber-500", "text-amber-600", "Başladılır…", true]
        : waiting
          ? [Loader2, "text-blue-500", "text-blue-600", "Qoşulma gözlənilir", true]
          : [XCircle, "text-red-500", "text-red-600", "Qeyri-aktiv", false];
  const [Icon, iconCls, textCls, text, spin] = map;
  return (
    <>
      <Icon className={`h-5 w-5 ${iconCls} ${spin ? "animate-spin" : ""}`} />
      <span className={`text-sm font-semibold ${textCls}`}>{text}</span>
    </>
  );
}

/** Status zolağı: nişan + kitabxana versiyası, vəziyyət, hesab, açıq qalma müddəti. */
export function StatusBar({ status: s, isLoading }) {
  const { installed = true, isReady, isInitializing, qrDataUrl, pairingCode } = s;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4">
      <div className="flex items-center gap-2">
        <StatusBadge
          isLoading={isLoading}
          installed={installed}
          isReady={isReady}
          isInitializing={isInitializing}
          waiting={Boolean(qrDataUrl || pairingCode)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
        {s.libVersion && (
          <span>
            kitabxana <b className="font-mono text-gray-700">v{s.libVersion}</b>
            {s.version?.outdated && (
              <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                köhnə
              </span>
            )}
          </span>
        )}
        {s.state && <span>vəziyyət: <b className="text-gray-700">{s.state}</b></span>}
        {isReady && (
          <>
            <span>hesab: <b className="text-gray-700">{s.connectedAs || "—"}</b></span>
            <span className="font-mono">{s.phoneNumber ? `+${s.phoneNumber}` : ""}</span>
            {s.uptimeSec > 0 && <span>açıqdır: <b className="text-gray-700">{fmtUptime(s.uptimeSec)}</b></span>}
          </>
        )}
      </div>
    </div>
  );
}
