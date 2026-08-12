// ── i18n miqrasiya servisi ──
// Köhnə (tək-dilli string) məzmun sahələrini yeni { az, en, ru } formasına
// çevirir. İdempotentdir: artıq çevrilmiş (obyekt) sahələrə toxunmur.
// Mövcud dəyər AZ variantı kimi qəbul olunur (en/ru boş qalır).
import { mongoose } from "#lib";
import { LOCALIZED_FIELDS, looksLocalized } from "#utils";

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

    for (const doc of docs) {
      const set = {};
      for (const f of fields) {
        const cur = doc[f];
        if (cur == null) continue;
        if (looksLocalized(cur)) continue; // artıq çevrilib
        if (typeof cur === "string") {
          set[f] = { az: cur, en: "", ru: "" };
        }
      }
      if (Object.keys(set).length) {
        await Model.updateOne({ _id: doc._id }, { $set: set });
        changedDocs += 1;
        changedFields += Object.keys(set).length;
      }
    }

    report[modelName] = { docs: docs.length, changedDocs, changedFields };
    totalDocs += changedDocs;
    totalFields += changedFields;
  }

  return { report, totalDocs, totalFields };
}
