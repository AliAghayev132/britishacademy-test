"use client";

// Next
import Link from "next/link";

// Icons
import { CornerDownLeft } from "lucide-react";

/** Axtarış nəticələri — sorğu varkən adi naviqasiyanı əvəz edir. */
export default function SidebarSearchResults({ results, activeIdx, onHover }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3">
      {results.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-gray-400">
          Heç nə tapılmadı.
          <span className="mt-1 block text-xs">Başqa söz sınayın — məsələn «telefon», «qr», «icazə».</span>
        </p>
      ) : (
        results.map((r, i) => (
          <Link
            key={r.href}
            href={r.href}
            onMouseEnter={() => onHover(i)}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
              i === activeIdx ? 'bg-[#00157A] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <r.icon className={`h-5 w-5 shrink-0 ${i === activeIdx ? 'text-white' : 'text-gray-400'}`} />
            <span className="min-w-0 flex-1">
              {/* Rəng AÇIQ verilir: seçilmiş sətirdə miras qalan rəng
                  tünd gəlirdi və ad mavi fonda oxunmurdu. */}
              <span className={`block truncate text-[15px] font-bold ${i === activeIdx ? 'text-white' : 'text-gray-800'}`}>{r.name}</span>
              {/* Uyğunluq ETİKETDƏN gəlibsə onu göstəririk — istifadəçi
                  «niyə bu çıxdı?» sualına dərhal cavab görür. */}
              <span className={`block truncate text-[11px] ${i === activeIdx ? 'text-white/70' : 'text-gray-400'}`}>
                {r.matchedTag ? `${r.groupLabel ? r.groupLabel + ' · ' : ''}${r.matchedTag}` : r.groupLabel || 'Naviqasiya'}
              </span>
            </span>
            {i === activeIdx && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-white/70" />}
          </Link>
        ))
      )}
    </nav>
  );
}
