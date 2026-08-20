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
};

export const fmt = (d) => (d ? new Date(d).toLocaleString("az-AZ") : "—");
