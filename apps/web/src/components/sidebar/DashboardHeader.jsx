"use client";

// Next
import Link from "next/link";

// Icons
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

/** Panelin üst başlığı: sidebar açarı, səhifə adı və profil kartı. */
export default function DashboardHeader({ sidebarOpen, onToggleSidebar, title, user }) {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex min-w-0 items-center gap-3">
        {/* Sidebar açarı.
            Əvvəl sidebar-ın SAĞ KƏNARINDA, yarısı kənardan çıxan kiçik
            dairə idi — sidebar `overflow-hidden` olduğuna görə asılı
            vəziyyətdə dayanırdı və gözə dəymirdi. İndi başlığın solunda,
            barmaqla da rahat tutulan ölçüdədir. */}
        <button
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Menyunu yığ' : 'Menyunu aç'}
          aria-label={sidebarOpen ? 'Menyunu yığ' : 'Menyunu aç'}
          aria-expanded={sidebarOpen}
          className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#00157A]"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4.5 w-4.5" />
          ) : (
            <PanelLeftOpen className="h-4.5 w-4.5" />
          )}
        </button>
        <h2 className="truncate text-lg font-semibold text-gray-800">
          {title}
        </h2>
      </div>
      <Link
        href="/dashboard/profile"
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-[#00157A] overflow-hidden flex items-center justify-center text-white text-sm font-semibold">
          {user?.firstName?.[0]}
          {user?.lastName?.[0]}
        </div>
        <div className="hidden md:block text-right">
          <p className="text-sm font-medium text-gray-900">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
      </Link>
    </header>
  );
}
