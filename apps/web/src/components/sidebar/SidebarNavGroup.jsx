"use client";

// Icons
import { ChevronDown } from "lucide-react";

// Local
import SidebarNavLink from "./SidebarNavLink";

/** Açılan naviqasiya qrupu (yalnız açıq sidebar-da; yığılanda bəndlər düz sıralanır). */
export default function SidebarNavGroup({ group: g, expanded, onToggle, isActive, badgeOf }) {
  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 transition hover:text-gray-600"
      >
        <g.icon className="h-3.5 w-3.5" />
        <span>{g.label}</span>
          {/* Qrup bağlı olanda yeni müraciət tamamilə görünməz
              qalardı — say başlıqda da göstərilir. */}
          {!expanded && g.items.some((it) => badgeOf(it) > 0) && (
            <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {g.items.reduce((sum, it) => sum + badgeOf(it), 0)}
            </span>
          )}
        <ChevronDown
          className={`ml-auto h-3.5 w-3.5 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
        />
      </button>
      {expanded && (
        <div className="mt-1 space-y-1">
          {g.items.map((item) => (
            <SidebarNavLink key={item.href} item={item} active={isActive(item)} open badge={badgeOf(item)} />
          ))}
        </div>
      )}
    </div>
  );
}
