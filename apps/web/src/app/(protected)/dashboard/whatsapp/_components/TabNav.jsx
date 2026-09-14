"use client";

// Icons
import { Smartphone, Users, History, ScrollText } from "lucide-react";

const TABS = [
  { id: "connect", label: "Qoşulma", icon: Smartphone },
  { id: "bulk", label: "Toplu göndəriş", icon: Users },
  { id: "history", label: "Tarixçə", icon: History },
  // Mesaj tarixçəsindən AYRI: bağlantının öz hadisələri (QR, kəsilmə,
  // Chrome xətaları, sağlamlıq yoxlaması).
  { id: "logs", label: "Jurnal", icon: ScrollText },
];

export function TabNav({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            value === t.id ? "bg-blue-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <t.icon className="h-4 w-4" /> {t.label}
        </button>
      ))}
    </div>
  );
}
