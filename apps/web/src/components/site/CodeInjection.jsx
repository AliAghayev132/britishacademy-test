"use client";

// ── Admin kod inyeksiyası (analytics, pixel, doğrulama meta-ları) ──
// Tənzimləmələr → SEO/Texniki bölməsindəki `<head>` və `</body>` kodunu sayta
// daxil edir. Bu funksiya müştəri texniki tələblərindən biridir; əvvəllər kod
// yalnız bazaya yazılırdı, sayta HEÇ VAXT düşmürdü.
//
// Niyə klient tərəfdə: admin ixtiyari markup yapışdıra bilər (script, meta,
// noscript, iframe). Onu React elementlərinə çevirmək kövrək olardı, `<head>`
// daxilinə xam sətir render etmək isə mümkün deyil. Ona görə mount zamanı
// parse edib real DOM node-larına çeviririk.
//
// ⚠️ Vacib: `innerHTML` ilə əlavə edilən `<script>` brauzer tərəfindən İCRA
// OLUNMUR — ona görə script node-ları yenidən yaradılır (aşağıda).
//
// ⚠️ Təhlükəsizlik: bu, sayta ixtiyari JS yerləşdirmək deməkdir. Sahələri
// yalnız `admin` rolu redaktə edə bilər (bax adminController.ADMIN_ONLY_SETTING_FIELDS).

import { useEffect } from "react";

/** HTML sətrini parse edib hədəf node-a əlavə et (script-lər icra olunacaq şəkildə). */
function injectHtml(html, target, marker) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;

  for (const node of Array.from(tpl.content.childNodes)) {
    let el = node;
    if (node.nodeName === "SCRIPT") {
      // innerHTML-dən gələn script inert olur — eynisini yenidən qururuq.
      el = document.createElement("script");
      for (const attr of Array.from(node.attributes)) {
        el.setAttribute(attr.name, attr.value);
      }
      el.textContent = node.textContent;
    }
    if (el.nodeType === Node.ELEMENT_NODE) el.setAttribute(marker, "");
    target.appendChild(el);
  }
}

export function CodeInjection({ head = "", bodyEnd = "" }) {
  useEffect(() => {
    const jobs = [
      { code: head, target: document.head, marker: "data-ba-head" },
      { code: bodyEnd, target: document.body, marker: "data-ba-body" },
    ];

    for (const { code, target, marker } of jobs) {
      if (!code?.trim()) continue;
      // Təkrar mount-da (StrictMode / naviqasiya) iki dəfə əlavə etmə.
      if (document.querySelector(`[${marker}]`)) continue;
      try {
        injectHtml(code, target, marker);
      } catch (err) {
        console.warn("Kod inyeksiyası alınmadı:", err?.message);
      }
    }
  }, [head, bodyEnd]);

  return null;
}
