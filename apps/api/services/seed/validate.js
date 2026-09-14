// ── Validation ──
/** Runs validateSync on every doc; returns { ok, errors: [{key, name, path, message}] }. */
export function validateGraph(graph) {
  const errors = [];
  let total = 0;
  for (const [key, value] of Object.entries(graph)) {
    const docs = Array.isArray(value) ? value : [value];
    for (const doc of docs) {
      total += 1;
      const err = doc.validateSync();
      if (err) {
        const name = doc.name || doc.title || doc.fullName || doc.label || doc.country || doc.key;
        for (const e of Object.values(err.errors)) errors.push({ key, name, path: e.path, message: e.message });
      }
    }
  }

  // ── Unikal sahələrin təkrarı ──
  //
  // validateSync YALNIZ bir sənədə baxır — sənədlər arası təkrarı görmür.
  // Təkrar yalnız MongoDB insertMany zamanı üzə çıxırdı və istifadəçi
  // mənasız «409 Conflict» alırdı: hansı model, hansı sahə, hansı dəyər —
  // heç biri məlum olmurdu. İndi seed heç nə silmədən əvvəl dayanır.
  for (const [key, value] of Object.entries(graph)) {
    if (!Array.isArray(value) || !value.length) continue;
    const schema = value[0].schema;
    if (!schema) continue;
    const uniques = Object.entries(schema.paths)
      .filter(([, path]) => path.options?.unique)
      .map(([name]) => name);
    for (const field of uniques) {
      const seen = new Map();
      for (const doc of value) {
        const v = doc[field];
        if (v == null) continue;
        const id = typeof v === "object" ? JSON.stringify(v) : String(v);
        seen.set(id, (seen.get(id) || 0) + 1);
      }
      for (const [v, n] of seen) {
        if (n > 1) {
          errors.push({ key, name: v, path: field, message: `«${field}» dəyəri ${n} sənəddə təkrarlanır: ${v}` });
        }
      }
    }
  }

  return { ok: errors.length === 0, total, errors };
}
