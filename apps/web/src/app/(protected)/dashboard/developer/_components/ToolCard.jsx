/**
 * Developer alətlərinin ortaq kart qabığı: ikon, başlıq, izah və alətin öz
 * məzmunu. `danger` — geri qaytarılmayan əməliyyat üçün qırmızı çərçivə.
 */
export default function ToolCard({ icon: Icon, iconClass, title, description, danger = false, children }) {
  return (
    <div
      className={
        danger
          ? "mt-8 max-w-2xl rounded-xl border-2 border-red-200 bg-red-50/40 p-6"
          : "mt-5 max-w-2xl rounded-xl border border-gray-200 bg-white p-6"
      }
    >
      <div className="flex items-start gap-4">
        <div className={`grid h-12 w-12 flex-none place-items-center rounded-xl ${iconClass}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h2 className={`text-base font-bold ${danger ? "text-red-900" : "text-gray-900"}`}>{title}</h2>
          <p className={`mt-1 text-sm ${danger ? "text-red-800" : "text-gray-600"}`}>{description}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
