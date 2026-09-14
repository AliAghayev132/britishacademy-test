"use client";

// Icons
import { LogOut } from "lucide-react";

/** Sidebar-ın altındakı «Çıxış» düyməsi. Çıxış məntiqi DashboardSidebar-dadır. */
export default function SidebarLogout({ open, onLogout }) {
  return (
    <div className="p-3 border-t border-gray-100">
      <button
        onClick={onLogout}
        title={!open ? 'Çıxış' : undefined}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-semibold"
      >
        <LogOut className="w-5 h-5 shrink-0" />
        <span
          className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-200 ${
            open ? 'opacity-100 max-w-[120px]' : 'opacity-0 max-w-0'
          }`}
          aria-hidden={!open}
        >
          Çıxış
        </span>
      </button>
    </div>
  );
}
