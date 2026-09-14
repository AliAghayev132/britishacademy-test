"use client";

/**
 * Mətni mübadilə buferinə köçür.
 *
 * `navigator.clipboard` yalnız təhlükəsiz kontekstdə (HTTPS, localhost) var.
 * Sayt IP ünvanı ilə HTTP üzərindən açılanda o `undefined` olur və əvvəl
 * redaktorun «Kopyala» düyməsi səssizcə istisna atırdı. Belə halda köhnə
 * `execCommand("copy")` yoluna düşürük.
 *
 * @returns {Promise<boolean>} alındımı
 */
export async function copyText(text) {
  const value = String(text ?? "");
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // icazə yoxdur — aşağıdakı yola düş
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
