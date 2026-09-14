// Status zolağı və diaqnostika eyni formatı işlədir — bir yerdə saxlanılır.

/** Saniyəni oxunaqlı müddətə çevir: 90 → «1 dəq», 7400 → «2 saat 3 dəq». */
export function fmtUptime(sec) {
  const n = Math.max(0, Math.round(Number(sec) || 0));
  if (n < 60) return `${n} san`;
  const m = Math.floor(n / 60);
  if (m < 60) return `${m} dəq`;
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d} gün ${h % 24} saat`;
  return `${h} saat ${m % 60} dəq`;
}
