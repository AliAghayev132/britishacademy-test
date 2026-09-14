"use client";

// React
import { useEffect, useRef, useState } from "react";

// Lib
import { searchNav } from "@/lib";

/**
 * ── Naviqasiya axtarışı ──
 *
 * 25-ə yaxın bölmə var və onlar dörd açılan qrupa paylanıb. «Telefon
 * nömrəsini haradan dəyişim?» kimi sual üçün istifadəçi qrupları bir-bir
 * açıb gözü ilə axtarmalı olurdu. İndi yazmaq kifayətdir — uyğunluq həm
 * bölmə adına, həm də ETİKETLƏRƏ görə tapılır (bax lib/adminNav.js).
 *
 * `openSidebar` — useState setter-i (sabit istinad); Ctrl/⌘+K yığılmış
 * sidebar-ı əvvəlcə açır.
 */
export default function useSidebarSearch({ pathname, router, groups, topNav, bottomNav, openSidebar }) {
  // Sorğu CARİ ÜNVANLA birlikdə saxlanılır: səhifə dəyişəndə köhnə sorğu
  // render zamanı atılır. Ayrıca sıfırlama effekti yazsaydıq, effektin içində
  // sinxron setState olardı (react-hooks/set-state-in-effect) — layihədə
  // «WhatsApp jurnalı» tabında da eyni naxış işlədilir.
  const [search, setSearch] = useState({ path: pathname, q: "", cursor: 0 });
  const s = search.path === pathname ? search : { path: pathname, q: "", cursor: 0 };
  const query = s.q;
  const searchRef = useRef(null);

  const searching = query.trim().length > 0;
  const results = searching ? searchNav(query, groups, [...topNav, ...bottomNav]) : [];
  // Siyahı qısalanda köhnə mövqe kənarda qala bilər — sıxılır.
  const activeIdx = results.length ? Math.min(s.cursor, results.length - 1) : 0;

  const setQuery = (q) => setSearch({ path: pathname, q, cursor: 0 });
  const setCursor = (i) => setSearch({ path: pathname, q: query, cursor: i });
  const closeSearch = () => setSearch({ path: pathname, q: "", cursor: 0 });

  const onSearchKey = (e) => {
    if (e.key === "Escape") { closeSearch(); searchRef.current?.blur(); return; }
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(Math.min(activeIdx + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor(Math.max(activeIdx - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      router.push(results[activeIdx].href);
      closeSearch();
    }
  };

  // Yığılmış sidebar-dakı axtarış ikonu: əvvəl açılır, sonra fokus.
  const expandAndFocus = () => { openSidebar(true); setTimeout(() => searchRef.current?.focus(), 60); };

  // Ctrl/⌘+K — hər yerdən axtarışa keç. Sidebar yığılıbsa əvvəl açılır,
  // yoxsa fokus görünməyən sahəyə düşərdi.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSidebar(true);
        // Sidebar-ın en keçidi bitəndən sonra fokus ver.
        setTimeout(() => searchRef.current?.focus(), 60);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSidebar]);

  return { searchRef, query, searching, results, activeIdx, setQuery, setCursor, closeSearch, onSearchKey, expandAndFocus };
}
