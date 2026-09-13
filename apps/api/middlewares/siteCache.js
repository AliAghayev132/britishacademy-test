// Services
import { purgeSiteCache } from "#services";

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Admin marşrutlarında uğurlu YAZMADAN sonra sayt keşini təmizlə (audit #37).
 * Cavab göndəriləndən sonra işləyir — sorğunu ləngitmir; xəta (4xx/5xx) olan
 * sorğu heç nə dəyişmədiyi üçün keşə toxunmur.
 */
export const revalidateOnWrite = (req, res, next) => {
  if (!READ_METHODS.has(req.method)) {
    res.on("finish", () => {
      if (res.statusCode < 400) purgeSiteCache();
    });
  }
  next();
};
