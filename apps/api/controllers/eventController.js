// Sayt hadisələri — «müraciət hunisi» (bax SiteEventService).
import { asyncHandler } from "#utils";
import { recordClientEvent } from "#services";

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

export { track };
