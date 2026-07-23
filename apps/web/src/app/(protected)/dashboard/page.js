"use client";

import Link from "next/link";
import { Inbox, GraduationCap, Users, Building2, CalendarClock, MessageSquareQuote, Globe2, FileText } from "lucide-react";
import { useAdminStatsQuery } from "@/store/api/adminApi";

const CARDS = [
  { key: "courses", name: "Kurslar", icon: GraduationCap, href: "/dashboard/resurslar/courses", color: "text-blue-700 bg-blue-50" },
  { key: "teachers", name: "Müəllimlər", icon: Users, href: "/dashboard/resurslar/teachers", color: "text-teal-700 bg-teal-50" },
  { key: "branches", name: "Filiallar", icon: Building2, href: "/dashboard/resurslar/branches", color: "text-violet-700 bg-violet-50" },
  { key: "course-groups", name: "Dərs qrafiki", icon: CalendarClock, href: "/dashboard/resurslar/course-groups", color: "text-amber-700 bg-amber-50" },
  { key: "testimonials", name: "Rəylər", icon: MessageSquareQuote, href: "/dashboard/resurslar/testimonials", color: "text-pink-700 bg-pink-50" },
  { key: "destinations", name: "Xaricdə təhsil", icon: Globe2, href: "/dashboard/resurslar/destinations", color: "text-emerald-700 bg-emerald-50" },
  { key: "blog-posts", name: "Bloq yazıları", icon: FileText, href: "/dashboard/resurslar/blog-posts", color: "text-slate-700 bg-slate-100" },
];

const fmt = (d) => new Date(d).toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function DashboardHome() {
  const { data, isLoading } = useAdminStatsQuery();
  const counts = data?.data?.counts || {};
  const newLeads = data?.data?.newLeads ?? 0;
  const latest = data?.data?.latestLeads || [];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard/muracietler" className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-5 transition-shadow hover:shadow-md">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-900 text-white"><Inbox className="h-6 w-6" /></span>
          <div>
            <div className="text-2xl font-extrabold text-blue-900">{isLoading ? "…" : newLeads}</div>
            <div className="text-sm font-semibold text-blue-800">yeni müraciət</div>
          </div>
        </div>
        <span className="text-sm font-bold text-blue-900">Hamısına bax →</span>
      </Link>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {CARDS.map(({ key, name, icon: Icon, href, color }) => (
          <Link key={key} href={href} className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
            <span className={`inline-grid h-10 w-10 place-items-center rounded-lg ${color}`}><Icon className="h-5 w-5" /></span>
            <div className="mt-3 text-2xl font-extrabold text-gray-900">{isLoading ? "…" : counts[key] ?? 0}</div>
            <div className="text-sm text-gray-500">{name}</div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4 text-sm font-bold text-gray-900">Son müraciətlər</div>
        {latest.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">{isLoading ? "Yüklənir…" : "Hələ müraciət yoxdur."}</div>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {latest.map((l) => (
                <tr key={l._id} className="border-t border-gray-50">
                  <td className="px-5 py-3 font-semibold text-gray-900">{l.name}</td>
                  <td className="px-5 py-3 text-gray-500">{l.phone}</td>
                  <td className="hidden px-5 py-3 text-gray-500 md:table-cell">{l.course?.title || l.interest || "—"}</td>
                  <td className="px-5 py-3 text-right text-xs text-gray-400">{fmt(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
