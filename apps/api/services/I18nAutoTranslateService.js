// Utils
import { LOCALIZED_FIELDS, looksLocalized } from "#utils";
// Lib
import { mongoose } from "#lib";
// Services
import { translateFields } from "./AiService.js";

/**
 * Toplu AI tərcümə — bazadakı boş EN/RU sahələrini AZ mətnindən doldurur.
 *
 * Hər sənəd üçün doldurulmalı sahələr yığılır və BİR AI çağırışı ilə (JSON
 * batch) tərcümə edilir — beləcə çağırış sayı sənəd sayı qədər olur, sahə
 * sayı qədər yox.
 *
 * Mövcud tərcüməyə toxunmur (yalnız boş dil doldurulur), ona görə təkrar
 * işlədilə bilər (idempotent).
 */

/** HTML sayılan sahələr — tərcümədə teqlər qorunur. */
const HTML_HINT = /contentHtml|\bcontent$|\bbio$|\banswer$|\bbody$|\bdescription$/;

/** `path` üzrə sənəddəki bütün { az,en,ru } dəyərlərini tap (massiv indeksləri ilə). */
function collect(node, segments, prefix, out) {
  if (node == null) return;
  const [head, ...rest] = segments;

  if (head === "$") {
    if (!Array.isArray(node)) return;
    node.forEach((el, i) => collect(el, rest, `${prefix}.${i}`, out));
    return;
  }

  const next = prefix ? `${prefix}.${head}` : head;
  const value = node[head];

  if (!rest.length) {
    if (looksLocalized(value)) out.push({ path: next, value });
    return;
  }
  collect(value, rest, next, out);
}

/**
 * @param {object} opts
 * @param {string[]} [opts.langs]   — hansı dillər (default ["en","ru"])
 * @param {string}   [opts.model]   — yalnız bir model (məs. "Course")
 * @param {number}   [opts.limit]   — model üzrə maksimum sənəd (default 500)
 * @param {boolean}  [opts.overwrite] — dolu tərcüməni də yenilə (default false)
 */
export async function autoTranslate({
  langs = ["en", "ru"],
  model: onlyModel,
  limit = 500,
  overwrite = false,
} = {}) {
  const report = {};
  let totalDocs = 0;
  let totalFields = 0;
  let totalCalls = 0;
  const errors = [];

  const entries = Object.entries(LOCALIZED_FIELDS).filter(
    ([name]) => !onlyModel || name === onlyModel,
  );

  for (const [modelName, paths] of entries) {
    let Model;
    try {
      Model = mongoose.model(modelName);
    } catch {
      report[modelName] = { skipped: "model tapılmadı" };
      continue;
    }

    const docs = await Model.find({}).limit(limit).lean();
    let changedDocs = 0;
    let changedFields = 0;

    for (const doc of docs) {
      // Sənəddəki bütün çoxdilli dəyərləri topla.
      const found = [];
      for (const p of paths) {
        try { collect(doc, p.split("."), "", found); } catch { /* ötür */ }
      }

      const set = {};
      for (const lang of langs) {
        // Bu dildə boş olan (amma AZ-ı dolu) sahələr.
        const todo = found.filter(({ value }) => {
          const az = String(value.az || "").trim();
          const cur = String(value[lang] || "").trim();
          return az && (overwrite || !cur);
        });
        if (!todo.length) continue;

        // HTML və düz mətni ayrı batch-lərdə göndər (prompt qaydaları fərqlidir).
        for (const isHtml of [false, true]) {
          const group = todo.filter((t) => HTML_HINT.test(t.path) === isHtml);
          if (!group.length) continue;

          const fields = Object.fromEntries(group.map((t) => [t.path, t.value.az]));
          totalCalls += 1;
          const res = await translateFields(fields, lang, { isHtml });
          if (!res.ok) {
            errors.push(`${modelName}/${lang}: ${res.message}`);
            // API açarı yoxdursa davam etməyin mənası yoxdur.
            if (res.status === 503) {
              return { report, totalDocs, totalFields, totalCalls, errors, aborted: true };
            }
            continue;
          }
          for (const [path, text] of Object.entries(res.fields)) {
            const src = found.find((f) => f.path === path);
            if (!src) continue;
            // Eyni sənəddə əvvəlki dil üçün yazılanı itirmə.
            const base = set[path] || { az: src.value.az || "", en: src.value.en || "", ru: src.value.ru || "" };
            set[path] = { ...base, [lang]: text };
            changedFields += 1;
          }
        }
      }

      if (Object.keys(set).length) {
        // QƏSDƏN sənəd-sənəd yazılır (bulkWrite YOX): AI çağırışları pullu və
        // yavaşdır — proses ortada dayansa artıq ödənilmiş tərcümələr itməsin.
        // DB yazısı burada onsuz da darboğaz deyil.
        await Model.updateOne({ _id: doc._id }, { $set: set });
        changedDocs += 1;
      }
    }

    report[modelName] = { docs: docs.length, changedDocs, changedFields };
    totalDocs += changedDocs;
    totalFields += changedFields;
  }

  return { report, totalDocs, totalFields, totalCalls, errors };
}
