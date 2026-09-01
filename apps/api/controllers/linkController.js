// ── İzlənilən qısa linklər ──
// Kampaniya linkinə kliklərin qeydiyyatı (public) və detallı hesabat (admin).

// Utils
import { asyncHandler } from "#utils";
// Models
import { ShortLink, LinkClick } from "#models";
// Services
import { recordClick, logAction } from "#services";

/**
 * POST /api/track/:code   (PUBLIC)
 *
 * Next tərəfindəki /r/<kod> marşrutu çağırır: klik yazılır, hədəf qaytarılır.
 * Yönləndirmənin özü orada baş verir ki, link saytın öz domenində qalsın.
 *
 * Tapılmayan/bağlı link üçün də 200 qaytarılır — ziyarətçiyə səhv göstərmək
 * əvəzinə ana səhifəyə buraxırıq (`target: "/"`). Reklamda çap olunmuş link
 * səhv yazılıbsa, adam heç olmasa sayta düşür.
 */
const track = asyncHandler(async (req, res) => {
  const result = await recordClick(req.params.code, {
    // Serverin arxasında nginx var — həqiqi IP forwarded header-dədir.
    ip: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip,
    ua: req.headers["user-agent"],
    referer: req.headers.referer || req.headers.referrer,
    lang: req.headers["accept-language"],
  });

  res.json({
    success: true,
    data: { target: result.ok ? result.target : "/", found: result.ok },
  });
});

/** Aqreqasiya sətirlərini {label,count} formasına gətir. */
const rows = (arr, fallback = "—") =>
  arr.map((r) => ({ label: r._id || fallback, count: r.count }));

/**
 * GET /api/admin/links/:id/stats?days=30
 *
 * Bütün hesablama aqreqasiya ilə edilir — klik sayı artdıqca sənədləri
 * Node-a çəkib orada saymaq dayanardı.
 */
const stats = asyncHandler(async (req, res) => {
  const link = await ShortLink.findById(req.params.id).lean();
  if (!link) {
    return res.status(404).json({ success: false, message: "Link tapılmadı" });
  }

  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const match = { link: link._id };
  const windowed = { ...match, ts: { $gte: since } };

  const [daily, byDevice, byBrowser, byOs, bySource, byHour, uniq, uniqWindow, inWindow] =
    await Promise.all([
      LinkClick.aggregate([
        { $match: windowed },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$ts" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      LinkClick.aggregate([{ $match: windowed }, { $group: { _id: "$device", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      LinkClick.aggregate([{ $match: windowed }, { $group: { _id: "$browser", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      LinkClick.aggregate([{ $match: windowed }, { $group: { _id: "$os", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      LinkClick.aggregate([{ $match: windowed }, { $group: { _id: "$source", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 12 }]),
      // Saat bölgüsü — reklamı nə vaxt göstərməyin daha səmərəli olduğunu göstərir.
      LinkClick.aggregate([
        { $match: windowed },
        { $group: { _id: { $hour: { date: "$ts", timezone: "Asia/Baku" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      // Unikal ziyarətçi: heş gündəlik duzla qurulur, ona görə bu rəqəm
      // «fərqli ziyarətçi-gün» deməkdir, ömürlük unikal adam deyil.
      LinkClick.distinct("visitorHash", match).then((a) => a.length),
      LinkClick.distinct("visitorHash", windowed).then((a) => a.length),
      LinkClick.countDocuments(windowed),
    ]);

  // Klik olmayan günlər də qrafikdə görünsün — əks halda xətt sıçrayır.
  const byDay = new Map(daily.map((d) => [d._id, d.count]));
  const series = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, count: byDay.get(key) || 0 });
  }

  const hourMap = new Map(byHour.map((h) => [h._id, h.count]));
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourMap.get(h) || 0 }));

  res.json({
    success: true,
    data: {
      link: {
        _id: link._id, code: link.code, title: link.title, target: link.target,
        isActive: link.isActive, expiresAt: link.expiresAt,
        clicks: link.clicks, lastClickAt: link.lastClickAt, createdAt: link.createdAt,
      },
      days,
      totals: {
        clicks: link.clicks || 0,
        unique: uniq,
        clicksInWindow: inWindow,
        uniqueInWindow: uniqWindow,
      },
      series,
      hours,
      byDevice: rows(byDevice),
      byBrowser: rows(byBrowser),
      byOs: rows(byOs),
      bySource: rows(bySource, "birbaşa"),
    },
  });
});

/**
 * DELETE /api/admin/links/:id/clicks
 * Sınaq kliklərini təmizləyir — kampaniya başlamazdan əvvəl sayğacı sıfırlamaq.
 */
const resetClicks = asyncHandler(async (req, res) => {
  const link = await ShortLink.findById(req.params.id);
  if (!link) {
    return res.status(404).json({ success: false, message: "Link tapılmadı" });
  }
  const { deletedCount } = await LinkClick.deleteMany({ link: link._id });
  link.clicks = 0;
  link.lastClickAt = null;
  await link.save();

  await logAction(req, {
    action: "delete", resource: "links",
    summary: `«${link.code}» linkinin ${deletedCount} kliki silindi`,
  });
  res.json({ success: true, message: `${deletedCount} klik silindi` });
});

export { track, stats, resetClicks };
