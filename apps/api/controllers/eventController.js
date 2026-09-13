// Sayt hadisələri — «müraciət hunisi» (bax SiteEventService).
import { asyncHandler } from "#utils";
import { recordClientEvent, parseUA } from "#services";
import { Course, Teacher, Destination, Project, BlogPost } from "#models";

/** Səhifənin öz domeni — daxili keçidi «birbaşa» saymaq üçün. */
const pageHost = (req) => {
  try {
    return new URL(req.headers.origin || req.headers.referer || "").hostname;
  } catch {
    return "";
  }
};

/**
 * POST /api/events — public.
 * Həmişə 204: yararsız/bot sorğunun səbəbi geri qaytarılmır.
 */
const track = asyncHandler(async (req, res) => {
  await recordClientEvent(req.body || {}, { ua: req.headers["user-agent"], host: pageHost(req) });
  res.status(204).end();
});

/** Baxış sayılan detal səhifələri. */
const VIEW_MODELS = { course: Course, teacher: Teacher, destination: Destination, project: Project, blog: BlogPost };
const SLUG_RE = /^[a-z0-9-]{1,160}$/;

/**
 * POST /api/views — public. { type, slug }
 *
 * Əvvəl sayğac GET cavabının içində artırılırdı; Next həmin cavabı 60 s
 * keşlədiyi üçün real baxış deyil, keşin yenilənməsi sayılırdı. İndi səhifə
 * brauzerdə açılanda çağırılır (web ViewBeacon), botlar atılır.
 * Həmişə 204 — yararsız sorğunun səbəbi qaytarılmır.
 */
const view = asyncHandler(async (req, res) => {
  const { type, slug } = req.body || {};
  const Model = VIEW_MODELS[type];
  const { device } = parseUA(req.headers["user-agent"]);
  if (Model && device !== "bot" && SLUG_RE.test(String(slug || ""))) {
    await Model.updateOne({ slug, isDeleted: false }, { $inc: { views: 1 } });
  }
  res.status(204).end();
});

export { track, view };
