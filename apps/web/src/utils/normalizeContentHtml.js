/**
 * TipTap (admin redaktoru) ilə yazılmış HTML-də saxlanmış köhnə (legacy)
 * media URL-lərini cari host-a uyğun hala gətirir.
 *
 * Konkret olaraq:
 *  - `<img src>`, `<source src>`, `<video src>`, `<a href>`, `srcset` və
 *    inline `style="background-image:url(...)"` daxilində legacy host
 *    (məs. `http://109.205.178.176:3001`) tapılırsa silinir → nisbi yola
 *    çevrilir (`/public/uploads/...`).
 *  - Brauzer onu cari domen (məs. `bdu.co.az`) altında həll edir, nginx isə
 *    `/public/...` yolunu backend-ə proksi edir.
 *
 * SSR-də də işləyir (yalnız sətir əməliyyatları, DOM lazım deyil).
 */

import { LEGACY_IMAGE_HOSTS } from "@/utils/legacyHosts";

let cachedRegex = null;

function getLegacyRegex() {
  if (cachedRegex) return cachedRegex;
  const escaped = LEGACY_IMAGE_HOSTS.map((h) =>
    h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  // Slash, dırnaq və ya mötərizə ilə bitənə qədər host-u tutur.
  cachedRegex = new RegExp(`(${escaped.join("|")})(?=/|"|'|\\)|\\s|$)`, "g");
  return cachedRegex;
}

/**
 * @param {string} html
 * @returns {string}
 */
export function normalizeContentHtml(html) {
  if (!html || typeof html !== "string") return html || "";
  if (LEGACY_IMAGE_HOSTS.length === 0) return html;
  return html.replace(getLegacyRegex(), "");
}
