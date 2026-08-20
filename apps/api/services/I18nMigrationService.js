// Utils
import { LOCALIZED_FIELDS, LIST_LOCALIZED_FIELDS, looksLocalized } from "#utils";
// Lib
import { mongoose } from "#lib";

/**
 * Köhnə (tək dilli) məzmunu { az, en, ru } formasına gətirir.
 *
 * Dəstəklənən yollar:
 *   "title"                     — sadə sahə
 *   "seo.metaTitle"             — iç-içə obyekt
 *   "faq.$.question"            — massiv elementləri
 *   "content.$.definitions.$.x" — iç-içə massivlər
 *
 * LIST_LOCALIZED_FIELDS-də olan sahələr əvvəllər massiv idi (keywords, tags,
 * hero.words, marquee, content items) — onlar vergüllə birləşdirilib mətnə
 * çevrilir, çünki boş massiv `[]` truthy olduğu üçün AZ fallback-i sındırardı.
 */

/** Bir dəyəri { az, en, ru }-ya çevir; artıq çevrilibsə null qaytar. */
function convert(value, isList) {
  if (value == null) return null;
  if (looksLocalized(value)) return null; // artıq çevrilib
  if (Array.isArray(value)) {
    if (!isList) return null; // gözlənilməz massiv — toxunma
    const joined = value.filter(Boolean).join(", ");
    return joined ? { az: joined, en: "", ru: "" } : null;
  }
  if (typeof value === "string") {
    return value ? { az: value, en: "", ru: "" } : null;
  }
  return null;
}

/**
 * `path`-i rekursiv gəz və çevrilməli dəyərləri `$set` obyektinə yaz.
 * `mongoPrefix` — MongoDB $set açarı (massiv indeksləri ilə).
 */
function walk(node, segments, mongoPrefix, isList, set) {
  if (node == null) return;
  const [head, ...rest] = segments;

  if (head === "$") {
    if (!Array.isArray(node)) return;
    node.forEach((el, i) => walk(el, rest, `${mongoPrefix}.${i}`, isList, set));
    return;
  }

  const nextPrefix = mongoPrefix ? `${mongoPrefix}.${head}` : head;
  const value = node[head];

  if (!rest.length) {
    const converted = convert(value, isList);
    if (converted) set[nextPrefix] = converted;
    return;
  }
  walk(value, rest, nextPrefix, isList, set);
}

export async function migrateI18n() {
  const report = {};
  let totalDocs = 0;
  let totalFields = 0;

  for (const [modelName, fields] of Object.entries(LOCALIZED_FIELDS)) {
    let Model;
    try {
      Model = mongoose.model(modelName);
    } catch {
      report[modelName] = { skipped: "model tapılmadı" };
      continue;
    }

    const docs = await Model.find({}).lean();
    let changedDocs = 0;
    let changedFields = 0;

    // Yazıları yığıb BİR bulkWrite ilə göndəririk — əvvəl sənəd başına ayrıca
    // updateOne gedirdi (200+ sənəddə yüzlərlə şəbəkə gedişi).
    const ops = [];
    for (const doc of docs) {
      const set = {};
      for (const path of fields) {
        const isList = LIST_LOCALIZED_FIELDS.has(path);
        try {
          walk(doc, path.split("."), "", isList, set);
        } catch { /* sahə yoxdursa ötür */ }
      }
      const count = Object.keys(set).length;
      if (count) {
        ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: set } } });
        changedDocs += 1;
        changedFields += count;
      }
    }
    if (ops.length) await Model.bulkWrite(ops, { ordered: false });

    report[modelName] = { docs: docs.length, changedDocs, changedFields };
    totalDocs += changedDocs;
    totalFields += changedFields;
  }

  return { report, totalDocs, totalFields };
}
