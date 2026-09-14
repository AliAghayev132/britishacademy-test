"use client";

// React
import { useEffect } from "react";

// Icons
import { Activity, History, ScrollText, Smartphone, Users } from "lucide-react";

export const TABS = [
  { id: "connect", label: "Bağlantı", icon: Smartphone, hint: "WhatsApp nömrəsini qoş" },
  { id: "bulk", label: "Toplu göndəriş", icon: Users, hint: "WhatsApp və e-poçt" },
  { id: "history", label: "Tarixçə", icon: History, hint: "Göndərilən mesajlar" },
  // Mesaj tarixçəsindən AYRI: bağlantının öz hadisələri (QR, kəsilmə,
  // Chrome xətaları, sağlamlıq yoxlaması).
  { id: "logs", label: "Jurnal", icon: ScrollText, hint: "Bağlantı hadisələri" },
  { id: "diagnostics", label: "Diaqnostika", icon: Activity, hint: "Texniki vəziyyət" },
];

/**
 * Tab zolağı. `badges` — tab üzərində kiçik nişan:
 * { bulk: { text: "gedir", tone: "live" }, diagnostics: { text: 3, tone: "error" } }.
 * Dar ekranda üfüqi sürüşür, sətrə qırılmır.
 */
export function TabNav({ value, onChange, badges = {} }) {
  // Dar ekranda seçilmiş tab görünən sahədən kənarda qalırdı (məs. ?tab=diagnostics).
  useEffect(() => {
    if (!value) return;
    document.getElementById(`msg-tab-${value}`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [value]);

  const onKeyDown = (e) => {
    const i = TABS.findIndex((t) => t.id === value);
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const t = TABS[(next + TABS.length) % TABS.length];
    onChange(t.id);
    document.getElementById(`msg-tab-${t.id}`)?.focus();
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-1.5">
      <div role="tablist" aria-label="Mesaj mərkəzi bölmələri" className="flex min-w-max gap-1" onKeyDown={onKeyDown}>
        {TABS.map((t) => {
          const on = value === t.id;
          const badge = badges[t.id];
          return (
            <button
              key={t.id}
              id={`msg-tab-${t.id}`}
              role="tab"
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(t.id)}
              className={`group flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-left transition ${
                on ? "bg-[#00157A] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <t.icon className={`h-4 w-4 flex-none ${on ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`} />
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-semibold">{t.label}</span>
                <span className={`hidden text-[11px] sm:block ${on ? "text-blue-100" : "text-gray-400"}`}>{t.hint}</span>
              </span>
              {badge && (
                <span
                  className={`ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    badge.tone === "error"
                      ? "bg-red-100 text-red-700"
                      : badge.tone === "warn"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {badge.tone === "live" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
                  {badge.text}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
