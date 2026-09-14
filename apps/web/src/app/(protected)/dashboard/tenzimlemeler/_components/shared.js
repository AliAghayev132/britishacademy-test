// Tənzimləmə tablarının ortaq sahə sinifləri və bölmə qabı.

export const input = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500";
export const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500";

// Səhifə komponentindən KƏNARDA təyin olunur — əks halda React hər düymə
// basışında alt ağacı yenidən qurar və input fokusu itirərdi.
export const Section = ({ title, children }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5">
    <h2 className="mb-4 text-sm font-bold text-gray-900">{title}</h2>
    <div className="grid gap-4 sm:grid-cols-2">{children}</div>
  </div>
);
