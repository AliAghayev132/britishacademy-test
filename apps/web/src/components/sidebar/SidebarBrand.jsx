// Next
import Link from "next/link";

/** Sidebar-ın yuxarısındakı loqo; yığılanda yalnız qalxan qalır. */
export default function SidebarBrand({ open }) {
  return (
    <div className="h-16 flex items-center px-4 border-b border-gray-100">
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 overflow-hidden"
      >
        <div className="w-9 h-9 rounded-xl bg-[#00157A] text-white flex items-center justify-center shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/shield.png" alt="British Academy" className="w-6 h-6 object-contain" />
        </div>
        <span
          className={`text-[15px] font-bold text-[#00157A] whitespace-nowrap leading-tight transition-opacity duration-200 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ fontFamily: "'Poppins', sans-serif" }}
          aria-hidden={!open}
        >
          British Academy
        </span>
      </Link>
    </div>
  );
}
