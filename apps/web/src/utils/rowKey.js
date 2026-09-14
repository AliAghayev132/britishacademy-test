/**
 * Təkrarlanan form sətirləri üçün sabit React açarı.
 *
 * `key={i}` sətir silinəndə və ya yeri dəyişəndə React-in komponentləri
 * qarışdırmasına səbəb olur: daxili vəziyyəti olan sahə (açıq panel, AI
 * düyməsinin gözləmə halı, fokus) qonşu sətrə keçir. Bazadan gələn sətrin
 * `_id`-si var; yeni sətir yaradılanda `_key` verilir. Server sxemi naməlum
 * `_key` sahəsini atır, amma göndərməzdən öncə yenə də silinməsi yaxşıdır.
 */
let seq = 0;

export function rowKey() {
  seq += 1;
  return `row-${Date.now().toString(36)}-${seq.toString(36)}`;
}

/** Sətrin açarı: `_id` → `_key`. */
export const keyOf = (row) => row?._id || row?._key;
