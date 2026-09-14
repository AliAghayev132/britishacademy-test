"use client";

// Icons
import { Users, MessageCircle, Mail, FileSpreadsheet, ListPlus } from "lucide-react";

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, hint: "Nömrələrə mesaj" },
  { id: "email", label: "E-poçt", icon: Mail, hint: "SMTP ilə məktub" },
];

const SOURCES = [
  { id: "leads", label: "Müraciətlər", icon: Users, hint: "Statusa görə süz" },
  { id: "excel", label: "Excel / CSV", icon: FileSpreadsheet, hint: "Fayl yüklə" },
  { id: "list", label: "Əl ilə siyahı", icon: ListPlus, hint: "Sətir-sətir yaz" },
];

/** Seçim kartları (kanal / mənbə) */
function Picker({ options, value, onChange }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition ${
            value === o.id ? "border-blue-900 bg-blue-50" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <o.icon className={`mt-0.5 h-4 w-4 flex-none ${value === o.id ? "text-blue-900" : "text-gray-400"}`} />
          <span className="min-w-0">
            <span className={`block text-sm font-semibold ${value === o.id ? "text-blue-900" : "text-gray-700"}`}>
              {o.label}
            </span>
            <span className="block text-xs text-gray-500">{o.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/** Kanal seçimi + WhatsApp qoşulmayanda xəbərdarlıq. */
export function ChannelPicker({ value, onChange, blocked }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">Kanal</div>
      <Picker options={CHANNELS} value={value} onChange={onChange} />
      {blocked && (
        <p className="mt-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          WhatsApp qoşulmayıb — «Qoşulma» tabından qoşulun və ya e-poçt kanalını seçin.
        </p>
      )}
    </div>
  );
}

/** Alıcıların mənbəyi. */
export function SourcePicker({ value, onChange }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
        Alıcılar haradan
      </div>
      <Picker options={SOURCES} value={value} onChange={onChange} />
    </div>
  );
}
