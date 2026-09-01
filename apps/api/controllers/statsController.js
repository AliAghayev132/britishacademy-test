// ── Məzmun statistikası ──
// Admin panelindəki «Statistika» səhifəsini qidalandırır: ən çox baxılan
// kurslar/yazılar, müraciət mənbələri və dinamikası.
//
// Bütün hesablamalar MongoDB aggregation ilə edilir — sənədləri Node-a
// çəkib orada saymaq 27 kurs üçün işləsə də, müraciət sayı artdıqca
// yavaşlayardı.

import { asyncHandler } from "#utils";
import { Course, BlogPost, Teacher, Destination, Lead } from "#models";

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
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

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
    Lead.aggregate([
      { $match: { isDeleted: false, course: { $ne: null } } },
      { $group: { _id: "$course", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: "courses", localField: "_id", foreignField: "_id", as: "c" } },
      { $unwind: "$c" },
      { $project: { _id: 0, count: 1, title: "$c.title", slug: "$c.slug" } },
    ]),

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
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
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
  const series = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, count: byDay.get(key) || 0 });
  }

  const clean = (rows, field) =>
    rows.map((r) => ({ ...r, [field]: az(r[field]) }));

  res.json({
    success: true,
    data: {
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
      leadsByCourse: clean(leadsByCourse, "title"),
      leadsByBranch: clean(leadsByBranch, "name"),
      leadsBySource: leadsBySource.map((r) => ({ source: r._id || "other", count: r.count })),
      leadsByStatus: leadsByStatus.map((r) => ({ status: r._id || "new", count: r.count })),
      series,
    },
  });
});

export { contentStats };
