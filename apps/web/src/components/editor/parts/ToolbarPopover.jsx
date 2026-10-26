'use client';

/* =====================================================================
 *  ToolbarPopover — alət panelindəki açılan menyular üçün ortaq qab.
 *
 *  NİYƏ PORTAL: menyular əvvəl `absolute top-full` ilə düymənin altında
 *  açılırdı, amma hər tabın sırası (`ToolRow`) `overflow-x-auto`-dur. CSS-də
 *  overflow-x «visible» olmayanda overflow-y da avtomatik «auto» olur — yəni
 *  42px hündürlüyündəki sıra açılan paneli KƏSİR, panel sıranın içində
 *  sürüşən kiçik bir zolağa çevrilirdi («açılanda gizlənib qalır»). Üstəlik
 *  sticky toolbar-da `backdrop-blur` var: backdrop-filter `position: fixed`
 *  övladlar üçün də yeni containing block yaradır, ona görə sadəcə `fixed`
 *  yazmaq da kömək etmirdi. Tam ekran rejimində isə qab `overflow-hidden`-dir.
 *
 *  Həll: panel `document.body`-yə portal ilə çıxarılır və düymənin ekrandakı
 *  yerinə görə `fixed` yerləşdirilir:
 *   - sağ kənara sığmırsa sola sürüşdürülür (ekrandan çıxmır);
 *   - aşağıda yer azdırsa və yuxarıda çoxdursa yuxarı açılır;
 *   - hündürlük ekrana sığmırsa panelin özü sürüşür (max-height);
 *   - səhifə/sıra sürüşəndə və pəncərə ölçüsü dəyişəndə yeri yenilənir.
 *
 *  Kənara klik / Escape: çağıran komponent `useDismiss(open, close,
 *  [anchorRef, panelRef])` işlədir — panel portalda olduğu üçün onun ref-i
 *  də «içəri» sayılmalıdır.
 * ===================================================================== */

// React
import { useCallback, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const GAP = 6;     // düymə ilə panel arası
const MARGIN = 8;  // ekran kənarından minimum məsafə
// Kollaj/slayder modallarından (2147482900) aşağı, qalan hər şeydən yuxarı —
// tam ekran redaktor (z-100) və admin header daxil.
const Z = 2147482800;

/** Yazı sahələrində mousedown-u ləğv etmə — əks halda input fokus almır. */
function isTextTarget(el) {
  return Boolean(el?.closest?.('input, textarea, select, [contenteditable="true"]'));
}

export default function ToolbarPopover({ open, anchorRef, panelRef, align = 'start', children }) {
  const [pos, setPos] = useState(null);

  const place = useCallback(() => {
    const anchor = anchorRef?.current;
    const panel = panelRef?.current;
    if (!anchor || !panel) return;

    const a = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // scrollHeight — max-height kəsməmişdən əvvəlki tam hündürlük.
    const w = panel.offsetWidth;
    const h = panel.scrollHeight;

    let left = align === 'end' ? a.right - w : a.left;
    left = Math.max(MARGIN, Math.min(left, vw - w - MARGIN));

    const below = vh - a.bottom - GAP - MARGIN;
    const above = a.top - GAP - MARGIN;
    const up = h > below && above > below;

    const maxHeight = Math.max(160, up ? above : below);
    const top = up ? Math.max(MARGIN, a.top - GAP - Math.min(h, maxHeight)) : a.bottom + GAP;

    setPos((p) =>
      p && p.top === top && p.left === left && p.maxHeight === maxHeight ? p : { top, left, maxHeight }
    );
  }, [anchorRef, panelRef, align]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return undefined;
    }
    place();
    // capture: true — ToolRow-un üfüqi sürüşməsi və admin paneldəki daxili
    // scroll qabları da tutulsun, təkcə window yox.
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    // Panelin məzmunu dəyişəndə (tab, izah bloku, yükləmə zolağı) yenidən hesabla.
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null;
    if (ro && panelRef?.current) ro.observe(panelRef.current);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      ro?.disconnect();
    };
  }, [open, place, panelRef]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={panelRef}
      // Düymələrə klik redaktordakı seçimi itirməsin; amma input-lar fokus alsın.
      onMouseDown={(e) => {
        if (!isTextTarget(e.target)) e.preventDefault();
      }}
      style={{
        position: 'fixed',
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        maxHeight: pos?.maxHeight,
        zIndex: Z,
        // İlk ölçmədən əvvəl (0,0)-da yanıb-sönməsin.
        visibility: pos ? 'visible' : 'hidden',
      }}
      className="overflow-y-auto overscroll-contain rounded-xl shadow-2xl [scrollbar-width:thin]"
    >
      {children}
    </div>,
    document.body
  );
}
