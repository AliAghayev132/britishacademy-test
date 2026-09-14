// Next
import Link from "next/link";

/**
 * Sidebar-ın tək naviqasiya sətri.
 *
 * Əvvəl bu markup nav dövrünün içində idi; qruplar əlavə olunanda üç yerdə
 * təkrarlanmalı olardı, ona görə ayrıca komponentə çıxarıldı.
 *
 * `open` — sidebar açıqdırmı (yığılanda yalnız ikon görünür).
 */
export default function SidebarNavLink({ item, active, open, badge = 0 }) {
  return (
    <Link
      href={item.href}
      title={!open ? item.name : undefined}
      style={active ? { background: '#00157A', color: '#fff' } : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        active ? 'shadow-md shadow-[#00157A]/25' : 'text-gray-700 hover:bg-[#00157A] hover:text-white'
      }`}
    >
      <item.icon
        className="h-5 w-5 shrink-0 group-hover:text-white"
        style={active ? { color: '#fff' } : undefined}
      />
      <span
        className={`overflow-hidden whitespace-nowrap text-[15px] font-bold transition-all duration-200 group-hover:text-white ${
          open ? 'max-w-[170px] opacity-100' : 'max-w-0 opacity-0'
        }`}
        style={active ? { color: '#fff' } : undefined}
        aria-hidden={!open}
      >
        {item.name}
      </span>

      {/* Yeni müraciət sayı */}
      {badge > 0 &&
        (open ? (
          <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        ))}
    </Link>
  );
}
