// Lib
import { mongoose } from "#lib";

// Utils
import { LOCALIZED_FIELDS, looksLocalized } from "#utils";

// Local
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
 * @param {(p:{model:string,docIndex:number,docTotal:number,fields:number}) => void}
 *   [opts.onProgress] — hər sənəddən sonra çağırılır (arxa fon işi üçün).
 */
export async function autoTranslate({
  langs = ["en", "ru"],
  model: onlyModel,
  limit = 500,
  overwrite = false,
  onProgress,
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

    for (const [docIndex, doc] of docs.entries()) {
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

      onProgress?.({ model: modelName, docIndex: docIndex + 1, docTotal: docs.length, fields: changedFields });
    }

    report[modelName] = { docs: docs.length, changedDocs, changedFields };
    totalDocs += changedDocs;
    totalFields += changedFields;
  }

  return { report, totalDocs, totalFields, totalCalls, errors };
}

/* ──────────────────────────────────────────────────────────────────────────
 *  ARXA FON İŞİ
 *
 *  NİYƏ LAZIM OLDU. Tərcümə hər sənəd üçün 1-2 AI çağırışı edir; bütün
 *  modellər birlikdə dəqiqələrlə çəkir. Əvvəl endpoint işin BİTMƏSİNİ
 *  gözləyirdi, sorğu isə Cloudflare-in 100 saniyə limitinə ilişirdi: panel
 *  xəta görürdü, iş isə arxada davam edirdi. Kənardan bu, «yarıda saxlayır,
 *  tam tərcümə etmir» kimi görünürdü — üstəlik `errors` siyahısı cavabla
 *  birlikdə itdiyi üçün səbəb heç vaxt görünmürdü.
 *
 *  Ölçülmüşdür: yalnız Partner modeli 30 sənəd / 60 çağırış = 35 saniyə.
 *  Yəni bütöv qaçış tək sorğuya sığmır.
 *
 *  İndi endpoint işi başladıb dərhal qayıdır, panel isə vəziyyəti
 *  `getTranslateState()` ilə soruşur (eyni üsul toplu göndərişdə işlənir).
 * ────────────────────────────────────────────────────────────────────────── */

export class TranslateJob {
  static running = false;
  static startedAt = null;
  static finishedAt = null;
  static model = null;      // hazırda işlənən model
  static docIndex = 0;      // həmin modeldə neçənci sənəd
  static docTotal = 0;
  static fields = 0;        // yazılmış sahə sayı
  static report = null;
  static errors = [];
  static lastMessage = null;

  static getState() {
    return {
      running: this.running,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      model: this.model,
      docIndex: this.docIndex,
      docTotal: this.docTotal,
      fields: this.fields,
      report: this.report,
      // Siyahı uzana bilər — panel üçün ilk 50 kifayətdir.
      errors: this.errors.slice(0, 50),
      message: this.lastMessage,
    };
  }

  /**
   * İşi başlat. Artıq işləyirsə `{ started: false }` qaytarır — iki paralel
   * qaçış eyni sənədlər üçün ikiqat AI xərci deməkdir.
   */
  static start(opts = {}) {
    if (this.running) return { started: false, state: this.getState() };

    this.running = true;
    this.startedAt = new Date();
    this.finishedAt = null;
    this.model = null;
    this.docIndex = 0;
    this.docTotal = 0;
    this.fields = 0;
    this.report = null;
    this.errors = [];
    this.lastMessage = null;

    autoTranslate({
      ...opts,
      onProgress: (p) => {
        this.model = p.model;
        this.docIndex = p.docIndex;
        this.docTotal = p.docTotal;
        this.fields = p.fields;
      },
    })
      .then((r) => {
        this.report = r.report;
        this.errors = r.errors || [];
        this.lastMessage = r.aborted
          ? "AI konfiqurasiya olunmayıb — iş dayandırıldı"
          : `${r.totalFields} sahə tərcümə olundu (${r.totalDocs} sənəd)`;
      })
      .catch((e) => {
        this.errors = [...this.errors, e?.message || "naməlum xəta"];
        this.lastMessage = "Tərcümə xəta ilə dayandı";
      })
      .finally(() => {
        this.running = false;
        this.model = null;
        this.finishedAt = new Date();
      });

    return { started: true, state: this.getState() };
  }
}
