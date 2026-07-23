import Link from "next/link";
import { ADMIN_RESOURCES } from "@/lib/adminResources";

export const metadata = { title: "Resurslar" };

// Index of every admin-manageable resource.
export default function ResourcesIndexPage() {
  const entries = Object.entries(ADMIN_RESOURCES).filter(([k]) => k !== "leads");
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(([key, cfg]) => (
        <Link
          key={key}
          href={`/dashboard/resurslar/${key}`}
          className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="text-base font-semibold text-gray-900">{cfg.name}</div>
          <div className="mt-1 text-xs text-gray-500">/{key}</div>
        </Link>
      ))}
    </div>
  );
}
