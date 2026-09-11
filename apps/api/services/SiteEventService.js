// Models
import { SiteEvent } from "#models";
// Local
import { parseUA, parseSource } from "./LinkTrackingService.js";

/**
 * «Müraciət hunisi»: sayta giriş → forma açıldı → müraciət göndərildi.
 *
 * Saytdan YALNIZ `visit` və `modal_open` qəbul olunur. `lead_submit` yalnız
 * `leadController.createLead`-dən, müraciət bazada yarandıqdan sonra yazılır —
 * açıq endpointə «göndərdim» yazmaqla statistikanı şişirtmək mümkün olmasın.
 */

const CLIENT_TYPES = new Set(["visit", "modal_open"]);
const SID_RE = /^[a-z0-9]{16,40}$/i;

export const BAKU_TZ = "+04:00";
/** Tarixin Bakı vaxtı ilə günü (YYYY-MM-DD). */
export const bakuDay = (d) => new Date(d.getTime() + 4 * 3600e3).toISOString().slice(0, 10);

/** Yalnız yol — sorğu sətri (utm, gclid, e-poçt linkləri …) saxlanılmır. */
export function cleanPath(p) {
  const s = String(p || "").split(/[?#]/)[0].slice(0, 200);
  return s.startsWith("/") ? s : "/";
}

const token = (v, max = 60) =>
  String(v || "").toLowerCase().trim().replace(/[^a-z0-9._-]/g, "").slice(0, max);

/**
 * Ziyarətin mənbəyi. Üstünlük: utm_source → reklam klik kodu → referer.
 * Saytın öz səhifəsindən gələn referer «birbaşa» sayılır (daxili keçid).
 */
export function resolveSource({ referrer, utm = {}, host } = {}) {
  const u = token(utm.source, 40);
  if (u) return u;
  if (utm.gclid) return "google-ads";
  // fbclid Facebook/Instagram-dan çıxan hər linkə əlavə olunur; Instagram
  // tətbiqi çox vaxt referer göndərmir — bu, yeganə izdir.
  if (utm.fbclid && !referrer) return "facebook/instagram";
  if (referrer && host) {
    try {
      const ref = new URL(referrer).hostname.replace(/^www\./, "");
      if (ref === String(host).replace(/^www\./, "")) return "birbaşa";
    } catch {
      /* yararsız referer — parseSource «birbaşa» qaytarır */
    }
  }
  return parseSource(referrer);
}

/** Sessiyanın ziyarəti — yoxdursa (izləmə gec gəlibsə) yaradılır. */
async function sessionVisit(sid, { path, device }) {
  const visit = await SiteEvent.findOne({ sid, type: "visit" }).select("source campaign").lean();
  if (visit) return visit;
  // Huni ardıcıl qalsın: forma açan hər sessiyanın ziyarəti də olmalıdır.
  await SiteEvent.updateOne(
    { sid, type: "visit" },
    { $setOnInsert: { sid, type: "visit", ts: new Date(), path, device, source: "birbaşa" } },
    { upsert: true },
  );
  return { source: "birbaşa" };
}

/**
 * Saytdan gələn hadisə. Yararsız sorğu səssizcə atılır (endpoint açıqdır,
 * səbəbi geri qaytarmırıq).
 */
export async function recordClientEvent(body = {}, { ua, host } = {}) {
  const type = String(body.type || "");
  if (!CLIENT_TYPES.has(type)) return { ok: false, reason: "type" };
  const sid = String(body.sid || "");
  if (!SID_RE.test(sid)) return { ok: false, reason: "sid" };
  const { device } = parseUA(ua);
  if (device === "bot") return { ok: false, reason: "bot" };
  const path = cleanPath(body.path);

  if (type === "visit") {
    const utm = body.utm && typeof body.utm === "object" ? body.utm : {};
    // Sessiyada BİR ziyarət: upsert + $setOnInsert — təkrar sorğu heç nə dəyişmir.
    const r = await SiteEvent.updateOne(
      { sid, type: "visit" },
      {
        $setOnInsert: {
          sid,
          type,
          ts: new Date(),
          path,
          device,
          source: resolveSource({ referrer: body.referrer, utm, host }),
          campaign: token(utm.campaign, 80) || undefined,
        },
      },
      { upsert: true },
    );
    return { ok: true, created: Boolean(r?.upsertedCount) };
  }

  const visit = await sessionVisit(sid, { path, device });
  await SiteEvent.create({ sid, type, path, device, source: visit.source, campaign: visit.campaign });
  return { ok: true, created: true };
}

/** Müraciət bazada yarandıqdan sonra — yalnız serverdən çağırılır. */
export async function recordLeadSubmit(sid, { path, form, ua } = {}) {
  if (!SID_RE.test(String(sid || ""))) return null;
  const { device } = parseUA(ua);
  if (device === "bot") return null;
  const p = cleanPath(path);
  const visit = await sessionVisit(sid, { path: p, device });
  return SiteEvent.create({
    sid,
    type: "lead_submit",
    path: p,
    form: token(form, 40) || undefined,
    device,
    source: visit.source,
    campaign: visit.campaign,
  });
}

/**
 * Aqreqasiya nəticələrini panelin göstərdiyi formaya salır (saf funksiya).
 * Bütün göstəricilər UNİKAL SESSİYA sayıdır — bir nəfər formanı 3 dəfə
 * açsa huni 3 nəfər göstərməsin (ümumi açılış sayı ayrıca verilir).
 */
export function buildFunnel(
  { byType = [], daily = [], pages = [], sources = [], devices = [], firstTs = null } = {},
  { days = 30, now = new Date() } = {},
) {
  const t = Object.fromEntries(byType.map((r) => [r._id, r]));
  const totals = {
    visits: t.visit?.sessions || 0,
    opens: t.modal_open?.sessions || 0,
    openEvents: t.modal_open?.events || 0,
    submits: t.lead_submit?.sessions || 0,
    submitEvents: t.lead_submit?.events || 0,
  };

  // Boş günlər də qrafikdə görünsün — əks halda dinamika yanlış oxunur.
  const byDay = new Map();
  for (const r of daily) {
    const row = byDay.get(r._id.day) || {};
    row[r._id.type] = r.sessions;
    byDay.set(r._id.day, row);
  }
  const series = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = bakuDay(new Date(now.getTime() - i * 864e5));
    const r = byDay.get(date) || {};
    series.push({ date, visits: r.visit || 0, opens: r.modal_open || 0, submits: r.lead_submit || 0 });
  }

  const merge = (rows, keyName, fields) => {
    const map = new Map();
    for (const r of rows) {
      const key = r._id[keyName] ?? "—";
      const row = map.get(key) || { [keyName]: key, ...Object.fromEntries(Object.values(fields).map((f) => [f, 0])) };
      if (fields[r._id.type]) row[fields[r._id.type]] = r.sessions;
      map.set(key, row);
    }
    return [...map.values()];
  };

  const pageRows = merge(pages, "path", { modal_open: "opens", lead_submit: "submits" })
    .sort((a, b) => b.opens - a.opens || b.submits - a.submits)
    .slice(0, 15);
  const sourceRows = merge(sources, "source", { visit: "visits", modal_open: "opens", lead_submit: "submits" })
    .sort((a, b) => b.visits - a.visits || b.submits - a.submits)
    .slice(0, 12);

  return {
    days,
    totals,
    series,
    pages: pageRows,
    sources: sourceRows,
    devices: devices.map((r) => ({ device: r._id || "other", sessions: r.sessions })),
    trackingSince: firstTs,
  };
}
