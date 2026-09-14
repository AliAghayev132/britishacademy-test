"use client";

// React
import { useCallback, useState } from "react";

// Utils
import { rowKey } from "@/utils";

const patchRow = (row, patch) => {
  if (typeof patch === "function") return patch(row);
  return row && typeof row === "object" && !Array.isArray(row) ? { ...row, ...patch } : patch;
};

/**
 * Formadakı təkrarlanan sətirlər (iş saatları, qrafik, faktlar, sertifikatlar).
 *
 * Sətirlər `key={i}` ilə render olunurdu: ortadakı sətri silmək React-ə
 * «sonuncu silindi» deyirdi və daxili vəziyyəti olan sahələr (şəkil yükləmə
 * faizi, açıq seçim siyahısı, AI düyməsinin gözləməsi) qonşu sətrə keçirdi.
 * Burada hər sətrin sabit açarı ayrıca massivdə saxlanılır — sətrin özü
 * dəyişmir, ona görə serverə göndərilən məlumata `_key` qarışmır və sətir
 * sadə dəyər (məs. şəkil URL-i) də ola bilər.
 *
 * @param {Array|(() => Array)} initial
 */
export function useRowList(initial = []) {
  const [state, setState] = useState(() => {
    const rows = typeof initial === "function" ? initial() : initial;
    return { rows, keys: rows.map(() => rowKey()) };
  });

  const add = useCallback((row) => {
    setState((s) => ({ rows: [...s.rows, row], keys: [...s.keys, rowKey()] }));
  }, []);

  const remove = useCallback((index) => {
    setState((s) => ({
      rows: s.rows.filter((_, i) => i !== index),
      keys: s.keys.filter((_, i) => i !== index),
    }));
  }, []);

  /** Obyekt sətirdə `patch` birləşdirilir; funksiya və ya sadə dəyər əvəz edir. */
  const update = useCallback((index, patch) => {
    setState((s) => ({ ...s, rows: s.rows.map((r, i) => (i === index ? patchRow(r, patch) : r)) }));
  }, []);

  return { rows: state.rows, keys: state.keys, add, remove, update };
}
