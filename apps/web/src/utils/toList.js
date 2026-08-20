// ── Siyahı normallaşdırıcı ──
// Çoxdilli sahələr üçün siyahı tipli məzmun (açar sözlər, teqlər, hero sözləri,
// marquee, blok bəndləri) hər dil üçün VERGÜLLƏ AYRILMIŞ MƏTN kimi saxlanılır —
// boş massiv `[]` truthy olduğu üçün AZ fallback-i sındırardı, boş mətn "" isə
// düzgün fallback verir. Public API mətn qaytarır, köhnə data isə hələ massiv
// ola bilər — bu helper hər ikisini massivə çevirir.
export function toList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}
