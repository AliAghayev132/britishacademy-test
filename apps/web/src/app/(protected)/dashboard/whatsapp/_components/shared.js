// WhatsApp bölməsinin paylaşılan sabitləri və kiçik köməkçiləri.

export const input =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500";
export const label = "mb-1.5 block text-sm font-medium text-gray-700";

export const LEAD_STATUSES = [
  { value: "all", label: "Hamısı" },
  { value: "new", label: "Yeni" },
  { value: "contacted", label: "Əlaqə saxlanılıb" },
  { value: "enrolled", label: "Qeydiyyatdan keçib" },
];

export const STATUS_BADGE = {
  sent: { label: "Göndərildi", cls: "bg-blue-100 text-blue-700" },
  delivered: { label: "Çatdırıldı", cls: "bg-indigo-100 text-indigo-700" },
  read: { label: "Oxundu", cls: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Alınmadı", cls: "bg-red-100 text-red-700" },
  // Qəsdən göndərilməyib (son 24 saatda mesaj alıb) — xəta DEYİL.
  skipped: { label: "Ötürüldü", cls: "bg-amber-100 text-amber-700" },
  cancelled: { label: "Dayandırıldı", cls: "bg-gray-200 text-gray-700" },
};

export const fmt = (d) => (d ? new Date(d).toLocaleString("az-AZ") : "—");

/** Yalnız saat:dəqiqə:saniyə — canlı axında tarix yer tutur. */
export const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("az-AZ", { hour12: false }) : "—";

/**
 * Saniyəni oxunaqlı müddətə çevir: 50 → «50 san», 3720 → «1 saat 2 dəq».
 * Toplu göndəriş saatlarla çəkə bilir — «3720 saniyə» heç nə demir.
 */
export function fmtDuration(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  if (s < 60) return `${s} san`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} dəq`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} saat ${rest} dəq` : `${h} saat`;
}
