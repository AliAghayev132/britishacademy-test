// ── Məzmun statistikası ──
// Admin panelindəki «Statistika» səhifəsini qidalandırır: ən çox baxılan
// kurslar/yazılar, müraciət mənbələri və dinamikası.
//
// Bütün hesablamalar MongoDB aggregation ilə edilir — sənədləri Node-a
// çəkib orada saymaq 27 kurs üçün işləsə də, müraciət sayı artdıqca
// yavaşlayardı.

// Models
import { Course, BlogPost, Teacher, Destination, Lead, SiteEvent, SiteSetting } from "#models";

// Services
import { buildFunnel, bakuDay, BAKU_TZ } from "#services";

// Utils
import {
  ok,
  asyncHandler,
  bakuDays,
  bakuDayStart,
  BAKU_ZONE,
  rankLeadInterests,
  dateRange,
} from "#utils";

/** Lokallaşdırılmış dəyərdən AZ mətni götür (admin paneli AZ-dır). */
const az = (v) => (v && typeof v === "object" ? v.az || v.en || v.ru || "" : v || "");

/** Baxış sırası ilə ilk N element. */
const topByViews = (Model, fields, limit = 10) =>
  Model.find({ isDeleted: false })
    .sort({ views: -1 })
    .limit(limit)
    .select(`${fields} views slug`)
    .lean();

/**
 * GET /api/admin/stats/content
 *
 * `days` — müraciət dinamikasının pəncərəsi (defolt 30).
 */
const contentStats = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 365);
  // Pəncərə qrafikdəki günlərlə eynidir və Bakı vaxtı ilə başlayır (audit #39).
  const dayKeys = bakuDays(days);
  const since = bakuDayStart(dayKeys[0]);

  const [
    topCourses,
    topPosts,
    topTeachers,
    topDestinations,
    leadsByCourse,
    leadsBySource,
    leadsByStatus,
    leadsByBranch,
    daily,
    totals,
  ] = await Promise.all([
    topByViews(Course, "title"),
    topByViews(BlogPost, "title"),
    topByViews(Teacher, "fullName"),
    topByViews(Destination, "country"),

    // Hansı kurs daha çox müraciət gətirir — baxışdan daha dəyərli göstərici.
    // Kurs VƏ maraq mətni üzrə qruplaşdırılır: köhnə müraciətlərdə `course`
    // boşdur, kurs yalnız `interest` mətnində (kurs adı) yazılıb. Uyğunlaşdırma
    // aşağıda rankLeadInterests ilə edilir.
    Promise.all([
      Lead.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: { course: "$course", interest: "$interest" }, count: { $sum: 1 } } },
      ]),
      Course.find({ isDeleted: false }).select("title slug").lean(),
    ]).then(([groups, courses]) =>
      rankLeadInterests(groups.map((g) => ({ ...g._id, count: g.count })), courses),
    ),

    Lead.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    Lead.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    Lead.aggregate([
      { $match: { isDeleted: false, branch: { $ne: null } } },
      { $group: { _id: "$branch", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $lookup: { from: "branches", localField: "_id", foreignField: "_id", as: "b" } },
      { $unwind: "$b" },
      { $project: { _id: 0, count: 1, name: "$b.name" } },
    ]),

    // Günlük müraciət sayı — qrafik üçün.
    Lead.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: BAKU_ZONE } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    Promise.all([
      Lead.countDocuments({ isDeleted: false }),
      Lead.countDocuments({ isDeleted: false, createdAt: { $gte: since } }),
      Course.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, v: { $sum: "$views" } } },
      ]),
      BlogPost.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, v: { $sum: "$views" } } },
      ]),
    ]),
  ]);

  const [leadsTotal, leadsInWindow, courseViews, postViews] = totals;

  // Boşluqları doldur — qrafikdə müraciət olmayan günlər də görünsün,
  // əks halda xətt sıçrayır və dinamika yanlış oxunur.
  const byDay = new Map(daily.map((d) => [d._id, d.count]));
  const series = dayKeys.map((date) => ({ date, count: byDay.get(date) || 0 }));

  const clean = (rows, field) =>
    rows.map((r) => ({ ...r, [field]: az(r[field]) }));

  ok(res, {
    days,
    totals: {
      leads: leadsTotal,
      leadsInWindow,
      courseViews: courseViews[0]?.v || 0,
      postViews: postViews[0]?.v || 0,
    },
    topCourses: clean(topCourses, "title"),
    topPosts: clean(topPosts, "title"),
    topTeachers: clean(topTeachers, "fullName"),
    topDestinations: clean(topDestinations, "country"),
    leadsByCourse,
    leadsByBranch: clean(leadsByBranch, "name"),
    leadsBySource: leadsBySource.map((r) => ({ source: r._id || "other", count: r.count })),
    leadsByStatus: leadsByStatus.map((r) => ({ status: r._id || "new", count: r.count })),
    series,
  });
});

/**
 * GET /api/admin/stats/funnel
 *
 * Sayta giriş → forma açıldı → müraciət göndərildi. Hər addım UNİKAL
 * SESSİYA sayı ilə: əvvəl (type, sid) üzrə, sonra type üzrə qruplaşdırılır.
 * `$addToSet` işlədilmir — ziyarət çox olanda sid massivi sənəd limitini
 * (16 MB) keçərdi.
 */
const funnelStats = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 365);
  const now = new Date();
  const since = new Date(`${bakuDay(new Date(now.getTime() - (days - 1) * 864e5))}T00:00:00${BAKU_TZ}`);
  const match = { ts: { $gte: since } };
  const sessionsBy = (key, extraMatch = {}) => [
    { $match: { ...match, ...extraMatch } },
    { $group: { _id: { k: key, type: "$type", sid: "$sid" } } },
    { $group: { _id: { k: "$_id.k", type: "$_id.type" }, sessions: { $sum: 1 } } },
  ];
  const rename = (name) => (rows) => rows.map((r) => ({ ...r, _id: { [name]: r._id.k, type: r._id.type } }));

  const [byType, daily, pages, sources, devices, first] = await Promise.all([
    SiteEvent.aggregate([
      { $match: match },
      { $group: { _id: { type: "$type", sid: "$sid" }, n: { $sum: 1 } } },
      { $group: { _id: "$_id.type", sessions: { $sum: 1 }, events: { $sum: "$n" } } },
    ]),
    SiteEvent.aggregate(sessionsBy({ $dateToString: { format: "%Y-%m-%d", date: "$ts", timezone: BAKU_TZ } })).then(rename("day")),
    SiteEvent.aggregate(sessionsBy("$path", { type: { $in: ["modal_open", "lead_submit"] } })).then(rename("path")),
    SiteEvent.aggregate(sessionsBy("$source")).then(rename("source")),
    SiteEvent.aggregate([
      { $match: { ...match, type: "visit" } },
      { $group: { _id: "$device", sessions: { $sum: 1 } } },
      { $sort: { sessions: -1 } },
    ]),
    SiteEvent.findOne().sort({ ts: 1 }).select("ts").lean(),
  ]);

  ok(res, buildFunnel({ byType, daily, pages, sources, devices, firstTs: first?.ts || null }, { days, now }));
});

// ── Reklam kampaniyaları ──

const ENROLLED = { $sum: { $cond: [{ $eq: ["$status", "enrolled"] }, 1, 0] } };

/** Bir atribusiya sahəsi üzrə: müraciət, qeydiyyat; boş dəyərlər atılır. */
const groupBy = (field, since, limit, extra = {}) =>
  Lead.aggregate([
    { $match: { isDeleted: false, createdAt: { $gte: since }, [`attribution.${field}`]: { $nin: [null, ""] } } },
    { $group: { _id: `$attribution.${field}`, leads: { $sum: 1 }, enrolled: ENROLLED, ...extra } },
    { $sort: { leads: -1, enrolled: -1 } },
    { $limit: limit },
  ]);

/**
 * GET /api/admin/stats/campaigns?days=30 — müraciətlər reklam kanalı,
 * kampaniya, açar söz və reklam qrupu üzrə; hər birində neçəsinin
 * «Qeydiyyatdan keçdi» statusuna çatdığı.
 *
 * Yalnız say qaytarır — ad/telefon yoxdur, ona görə «Statistika» icazəsi
 * kifayətdir. Dövr müraciətin gəldiyi tarixə görədir.
 */
const campaignStats = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 365);
  const since = bakuDayStart(bakuDays(days)[0]);

  const [channels, campaigns, terms, adGroups, settings] = await Promise.all([
    Lead.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: since } } },
      // Atribusiyadan əvvəlki müraciətlərdə kanal yoxdur — «unknown».
      { $group: { _id: { $ifNull: ["$attribution.channel", "unknown"] }, leads: { $sum: 1 }, enrolled: ENROLLED } },
      { $sort: { leads: -1 } },
    ]),
    groupBy("campaign", since, 50, { channel: { $last: "$attribution.channel" } }),
    groupBy("term", since, 50, { campaign: { $last: "$attribution.campaign" } }),
    groupBy("content", since, 30, { campaign: { $last: "$attribution.campaign" } }),
    SiteSetting.get(),
  ]);

  const names = Object.fromEntries((settings.adCampaigns || []).map((c) => [c.id, c.name]));
  const total = channels.reduce((a, r) => ({ leads: a.leads + r.leads, enrolled: a.enrolled + r.enrolled }), { leads: 0, enrolled: 0 });

  ok(res, {
    days,
    total,
    channels: channels.map((r) => ({ channel: r._id, leads: r.leads, enrolled: r.enrolled })),
    campaigns: campaigns.map((r) => ({ id: r._id, name: names[r._id] || "", channel: r.channel, leads: r.leads, enrolled: r.enrolled })),
    terms: terms.map((r) => ({ term: r._id, campaign: r.campaign, campaignName: names[r.campaign] || "", leads: r.leads, enrolled: r.enrolled })),
    adGroups: adGroups.map((r) => ({ id: r._id, campaign: r.campaign, campaignName: names[r.campaign] || "", leads: r.leads, enrolled: r.enrolled })),
  });
});

/** Google Ads klik kodunu yalnız klikdən sonrakı 90 gün ərzində qəbul edir. */
const GCLID_WINDOW_MS = 90 * 864e5;

/**
 * GET /api/admin/stats/google-conversions?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * «Qeydiyyatdan keçdi» statusuna keçmiş, Google Ads klik kodu olan
 * müraciətlər — Google Ads-ə offline konversiya kimi yükləmək üçün
 * (Hədəflər → Konversiyalar → Yükləmələr). Fayl brauzerdə qurulur.
 *
 * Yalnız klik kodu və vaxt qaytarılır — şəxsi məlumat yoxdur.
 * Tarix aralığı QEYDİYYAT anına görədir: hər həftə «keçən həftə qeydiyyat
 * edənləri» yükləmək təkrarsız olsun.
 */
const googleConversions = asyncHandler(async (req, res) => {
  const range = dateRange(req.query.from, req.query.to);
  const leads = await Lead.find({ isDeleted: false, status: "enrolled", "attribution.gclid": { $nin: [null, ""] } })
    .select("attribution.gclid attribution.capturedAt attribution.campaign enrolledAt handledAt updatedAt")
    .sort({ updatedAt: -1 })
    .limit(5000)
    .lean();

  const rows = [];
  let expired = 0;
  for (const l of leads) {
    // Köhnə müraciətlərdə enrolledAt yoxdur — son status dəyişikliyi vaxtı.
    const at = l.enrolledAt || l.handledAt || l.updatedAt;
    if (range?.$gte && at < range.$gte) continue;
    if (range?.$lte && at > range.$lte) continue;
    const clicked = l.attribution.capturedAt;
    if (clicked && at - clicked > GCLID_WINDOW_MS) {
      expired += 1; // Google rədd edəcək — fayla salınmır
      continue;
    }
    rows.push({ gclid: l.attribution.gclid, conversionAt: at, campaign: l.attribution.campaign || "" });
  }
  rows.sort((a, b) => a.conversionAt - b.conversionAt);
  ok(res, { rows, expired });
});

export { contentStats, funnelStats, campaignStats, googleConversions };
