// ── Log service ──
// «Tut-unut» audit jurnalı. HEÇ VAXT sorğu axınına xəta atmır.

import { AuditLog } from "#models";

/** Jurnala DÜŞMƏYƏCƏK sahələr — hər yazıda dəyişir, məlumat vermir. */
const NOISE = new Set([
  "updatedAt", "createdAt", "__v", "_id", "id", "slug",
  "views", "clicks", "isDeleted",
]);

/**
 * Dəyəri jurnalda GÖSTƏRMƏK OLMAYAN sahələr.
 *
 * Parol/açar dəyişikliyi qeydə düşməlidir (kim dəyişdi — vacibdir), amma
 * DƏYƏRİ yox. Əks halda audit jurnalının özü sirlərin siyahısına çevrilər.
 */
const SECRET = /pass|password|secret|token|apikey|api_key|key$/i;

const MAX_LEN = 160;

/** İstənilən dəyəri oxunaqlı, qısa sətrə çevir. */
function show(v) {
  if (v === undefined || v === null || v === "") return "—";
  if (typeof v === "boolean") return v ? "bəli" : "xeyr";
  if (v instanceof Date) return v.toISOString().slice(0, 16).replace("T", " ");
  if (Array.isArray(v)) return v.length ? `${v.length} element` : "boş";
  if (typeof v === "object") {
    // Çoxdilli sahə { az, en, ru } — AZ variantı göstərilir.
    if ("az" in v || "en" in v || "ru" in v) return show(v.az || v.en || v.ru);
    if (v._id) return String(v._id);
    const s = JSON.stringify(v);
    return s.length > MAX_LEN ? s.slice(0, MAX_LEN) + "…" : s;
  }
  const s = String(v);
  return s.length > MAX_LEN ? s.slice(0, MAX_LEN) + "…" : s;
}

/** Müqayisə üçün sabit forma (obyekt açarlarının sırası fərq etməsin). */
const key = (v) => {
  try {
    return JSON.stringify(v ?? null);
  } catch {
    return String(v);
  }
};

/**
 * İki sənədi müqayisə edib dəyişən sahələri qaytarır.
 *
 * Yalnız `after`-də OLAN açarlara baxılır: PUT sorğusu adətən sənədin bir
 * hissəsini göndərir, tam sənədlə müqayisə etsək göndərilməyən hər sahə
 * «silindi» kimi görünərdi.
 *
 * @returns {{field:string, from:string, to:string}[]}
 */
export function diffDocs(before = {}, after = {}) {
  const b = before?.toObject ? before.toObject() : before || {};
  const a = after?.toObject ? after.toObject() : after || {};
  const out = [];

  for (const f of Object.keys(a)) {
    if (NOISE.has(f)) continue;
    if (key(b[f]) === key(a[f])) continue;
    out.push(
      SECRET.test(f)
        ? { field: f, from: "•••", to: "•••" } // dəyişdi, amma dəyəri gizli
        : { field: f, from: show(b[f]), to: show(a[f]) },
    );
  }
  return out;
}

/** Sorğudan IP çıxar (proxy arxasında `x-forwarded-for` birincidir). */
const ipOf = (req) =>
  (req?.headers?.["x-forwarded-for"] || req?.ip || "")
    .toString()
    .split(",")[0]
    .trim() || undefined;

/**
 * Admin əməliyyatını qeyd et.
 *
 * @param {object} req  Express sorğusu (`req.user`, IP, User-Agent buradan)
 * @param {object} entry
 * @param {string} entry.action
 * @param {string} [entry.resource]
 * @param {string} [entry.resourceId]
 * @param {string} [entry.summary]
 * @param {Array}  [entry.changes]  `diffDocs` nəticəsi
 * @param {"ok"|"fail"} [entry.status]
 * @param {string} [entry.reason]
 * @param {object} [entry.actor]  `req.user` olmayanda (məs. uğursuz giriş)
 */
export async function logAction(
  req,
  { action, resource, resourceId, summary, changes, status, reason, actor } = {},
) {
  try {
    const u = actor || req?.user || {};
    const name =
      [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "Sistem";

    await AuditLog.create({
      actor: { id: u._id, name, email: u.email, role: u.role },
      action,
      resource,
      resourceId: resourceId != null ? String(resourceId) : undefined,
      summary,
      changes: Array.isArray(changes) && changes.length ? changes.slice(0, 40) : [],
      status: status || "ok",
      reason,
      ip: ipOf(req),
      userAgent: String(req?.headers?.["user-agent"] || "").slice(0, 300) || undefined,
      method: req?.method,
      path: req?.originalUrl?.split("?")[0],
    });
  } catch {
    /* jurnal heç vaxt sorğunu sındırmamalıdır */
  }
}
